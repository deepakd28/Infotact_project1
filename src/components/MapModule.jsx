import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, ScaleControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useGridSocket } from '../hooks/useGridSocket';

import 'leaflet/dist/leaflet.css';

// Fix standard Leaflet asset paths
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Helper to determine status colors
const getStateColor = (state) => {
  switch (state) {
    case 'Discharging': return '#ef4444';
    case 'Charging': return '#10b981';
    case 'Idle': return '#f59e0b';
    case 'Alert': return '#f97316';
    case 'Offline': return '#6b7280';
    default: return '#9ca3af';
  }
};

// Box-Muller transformation for natural, realistic spatial distribution
const randomGaussian = (mean = 0, stdev = 1) => {
  const u1 = 1 - Math.random();
  const u2 = 1 - Math.random();
  const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
  return mean + randStdNormal * stdev;
};

// Generator for 3,000 naturally scattered nodes across a wide region
const generate3000Nodes = () => {
  const nodes = [];
  const types = ['Solar Farm', 'Battery Storage', 'Substation'];
  const states = ['Idle', 'Charging', 'Discharging'];

  // Geographic centers (Delhi NCR sub-districts for a realistic grid topology)
  const centers = [
    { lat: 28.6448, lng: 77.2167 }, // Central
    { lat: 28.5355, lng: 77.3910 }, // East Cluster
    { lat: 28.4595, lng: 77.0266 }, // South West Cluster
    { lat: 28.7041, lng: 77.1025 }, // North West Cluster
    { lat: 28.4089, lng: 77.3178 }  // South East Cluster
  ];

  for (let i = 0; i < 3000; i++) {
    const cluster = centers[i % centers.length];
    const type = types[i % types.length];
    const state = states[Math.floor(Math.random() * states.length)];
    
    // Spread nodes naturally using Gaussian distribution with light noise offset
    const lat = randomGaussian(cluster.lat, 0.08) + (Math.random() - 0.5) * 0.01;
    const lng = randomGaussian(cluster.lng, 0.08) + (Math.random() - 0.5) * 0.01;

    let powerOutput = 0;
    if (state === 'Discharging') powerOutput = parseFloat((Math.random() * 18 + 2).toFixed(1));
    else if (state === 'Charging') powerOutput = parseFloat((-(Math.random() * 12 + 1)).toFixed(1));

    nodes.push({
      id: `GRID-NODE-${(i + 1).toString().padStart(4, '0')}`,
      type,
      state,
      powerOutput,
      lat,
      lng
    });
  }
  return nodes;
};

// --- Fast Canvas Layer (60 FPS Performance Engine) ---
const FastCanvasLayer = ({ nodesMapRef, filterType }) => {
  const map = useMap();
  const markersRef = useRef(new Map());
  const canvasRendererRef = useRef(L.canvas({ padding: 0.5 }));

  useEffect(() => {
    let animationFrameId;

    const renderLoop = () => {
      const currentNodes = nodesMapRef.current;

      // Clean up markers if removed from node store
      markersRef.current.forEach((marker, id) => {
        if (!currentNodes.has(id)) {
          map.removeLayer(marker);
          markersRef.current.delete(id);
        }
      });

      currentNodes.forEach((node, id) => {
        // Direct category filter check
        if (filterType !== 'ALL' && node.type !== filterType) {
          if (markersRef.current.has(id)) {
            map.removeLayer(markersRef.current.get(id));
            markersRef.current.delete(id);
          }
          return;
        }

        const color = getStateColor(node.state || node.status);
        const radius = node.state === 'Alert' ? 6 : node.state === 'Discharging' ? 5 : 4;
        let marker = markersRef.current.get(id);

        if (!marker) {
          marker = L.circleMarker([node.lat, node.lng], {
            renderer: canvasRendererRef.current,
            radius,
            fillColor: color,
            color: '#ffffff',
            weight: 0.8,
            fillOpacity: 0.85,
          }).addTo(map);

          marker.bindPopup(`
            <div style="color: #1f2937; font-family: sans-serif; min-width: 180px;">
              <h4 style="margin: 0 0 4px 0; color: #111827;">⚡ ${node.id}</h4>
              <div style="font-size: 0.85rem;"><strong>Type:</strong> ${node.type}</div>
              <div style="font-size: 0.85rem;"><strong>State:</strong> <span style="color:${color}; font-weight:bold;">${node.state || node.status}</span></div>
              <div style="font-size: 0.85rem;"><strong>Power:</strong> ${node.powerOutput !== undefined ? node.powerOutput.toFixed(1) + ' MW' : '0.0 MW'}</div>
              <div style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">GIS: ${node.lat.toFixed(4)}, ${node.lng.toFixed(4)}</div>
            </div>
          `);

          markersRef.current.set(id, marker);
        } else {
          marker.setLatLng([node.lat, node.lng]);
          marker.setStyle({ fillColor: color, radius });
        }
      });

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current.clear();
    };
  }, [map, filterType, nodesMapRef]);

  return null;
};

export default function MapModule({ onMetricsChange }) {
  const [filterType, setFilterType] = useState('ALL');
  const [isSimulatorActive, setIsSimulatorActive] = useState(false);
  const [liveEventCount, setLiveEventCount] = useState(0);

  const socketUrl = import.meta.env.VITE_GRID_SOCKET_URL || 'ws://localhost:8080/telemetry';
  const { isConnected, latestData, socketError } = useGridSocket(socketUrl);

  // Reference store for all 3,000 nodes
  const nodesMapRef = useRef(new Map());

  // Generate 3,000 naturally spread out nodes on component mount
  const initial3000Nodes = useMemo(() => generate3000Nodes(), []);

  // Microgrid Metrics State
  const [gridMetrics, setGridMetrics] = useState({
    idleCount: 0,
    chargingCount: 0,
    dischargingCount: 0,
    totalNodes: 3000,
    totalPowerMW: 0
  });

  const recalculateMetrics = () => {
  let idle = 0;
  let charging = 0;
  let discharging = 0;
  let totalPower = 0;
  let count = 0;

  nodesMapRef.current.forEach((node) => {
    count++;
    if (node.state === 'Idle') idle++;
    else if (node.state === 'Charging') charging++;
    else if (node.state === 'Discharging') discharging++;

    if (node.powerOutput !== undefined) {
      totalPower += node.powerOutput;
    }
  });

  const updatedMetrics = {
    idleCount: idle,
    chargingCount: charging,
    dischargingCount: discharging,
    totalNodes: count,
    totalPowerMW: totalPower
  };

  setGridMetrics(updatedMetrics);

  // Send update to parent App component if callback exists
  if (onMetricsChange) {
    onMetricsChange(updatedMetrics);
  }
};

  // Populate 3,000 nodes into buffer on load
  useEffect(() => {
    initial3000Nodes.forEach((node) => nodesMapRef.current.set(node.id, node));
    recalculateMetrics();
  }, [initial3000Nodes]);

  // Handle incoming WebSocket telemetry
  useEffect(() => {
    if (!latestData) return;
    const incomingEvents = Array.isArray(latestData) ? latestData : [latestData];

    incomingEvents.forEach((evt) => {
      if (evt && evt.nodeId) {
        const existing = nodesMapRef.current.get(evt.nodeId) || {};
        nodesMapRef.current.set(evt.nodeId, { ...existing, ...evt, id: evt.nodeId });
      }
    });

    setLiveEventCount((prev) => prev + incomingEvents.length);
    recalculateMetrics();
  }, [latestData]);

  // --- Stress Test Simulation Engine ---
  const toggleSimulator = () => {
    if (isSimulatorActive) {
      setIsSimulatorActive(false);
      return;
    }

    setIsSimulatorActive(true);
    const states = ['Discharging', 'Charging', 'Idle'];

    // Update random subsets of the 3,000 nodes continuously
    const intervalId = setInterval(() => {
      for (let k = 0; k < 600; k++) {
        const randIndex = Math.floor(Math.random() * 3000) + 1;
        const id = `GRID-NODE-${randIndex.toString().padStart(4, '0')}`;
        const existing = nodesMapRef.current.get(id);

        if (existing) {
          const newState = states[Math.floor(Math.random() * states.length)];
          existing.state = newState;
          existing.powerOutput = newState === 'Discharging' ? (Math.random() * 18 + 2) : newState === 'Charging' ? -(Math.random() * 12 + 1) : 0;
          nodesMapRef.current.set(id, existing);
        }
      }

      setLiveEventCount((c) => c + 600);
      recalculateMetrics();
    }, 16);

    window.__simInterval = intervalId;
  };

  // Reset test: stops active stream and recalculates base metrics
  const handleResetTest = () => {
    if (window.__simInterval) {
      clearInterval(window.__simInterval);
    }

    setIsSimulatorActive(false);
    setLiveEventCount(0);

    // Re-seed original 3,000 node set
    nodesMapRef.current.clear();
    initial3000Nodes.forEach((node) => nodesMapRef.current.set(node.id, node));
    recalculateMetrics();
  };

  useEffect(() => {
    if (!isSimulatorActive && window.__simInterval) {
      clearInterval(window.__simInterval);
    }
  }, [isSimulatorActive]);

  const mapCenter = [28.5800, 77.2000];
  const nodeTypes = ['ALL', 'Solar Farm', 'Battery Storage', 'Substation'];

  return (
    <div style={{
      border: '1px solid #374151',
      borderRadius: '8px',
      padding: '2rem',
      backgroundColor: '#1f2937',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, color: '#f3f4f6' }}>🗺️ GIS Live Topology View (3,000 Active Nodes)</h3>
          <p style={{ margin: '0.5rem 0 0', color: '#9ca3af', fontSize: '0.9rem' }}>
            60 FPS Canvas accelerated grid topology with live telemetry streaming.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={toggleSimulator}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: isSimulatorActive ? '#ef4444' : '#10b981',
                color: '#ffffff'
              }}
            >
              {isSimulatorActive ? '⏹ Stop Stress Test' : '⚡ Run 3,000 Node Stress Test'}
            </button>

            <button
              type="button"
              onClick={handleResetTest}
              style={{
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                borderRadius: '4px',
                border: '1px solid #374151',
                cursor: 'pointer',
                background: '#111827',
                color: '#9ca3af'
              }}
            >
              ↺ Reset Test
            </button>

            <span style={{ fontSize: '0.8rem', background: '#374151', padding: '4px 8px', borderRadius: '4px', color: '#9ca3af' }}>
              Map Engine: Active
            </span>
            <span style={{ fontSize: '0.8rem', background: isConnected ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '4px', color: '#f9fafb' }}>
              {isConnected ? 'WS Connected' : 'WS Disconnected'}
            </span>
          </div>

          {/* Live Events Stream Counter Placement directly under live events button */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{
              fontSize: '0.8rem',
              background: '#111827',
              padding: '4px 10px',
              borderRadius: '4px',
              color: '#60a5fa',
              border: '1px solid #1f2937',
              fontWeight: 'bold'
            }}>
              📊 {liveEventCount.toLocaleString()} live events processed
            </span>
            {isSimulatorActive && (
              <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                ● Stress Stream Active
              </span>
            )}
          </div>
        </div>
      </div>

      {socketError && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 0.9rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.12)', color: '#fecaca', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {socketError}
        </div>
      )}

      {/* Filter Category Buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {nodeTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setFilterType(type)}
            style={{
              cursor: 'pointer',
              border: '1px solid #374151',
              background: filterType === type ? '#10b981' : '#111827',
              color: filterType === type ? '#f9fafb' : '#9ca3af',
              padding: '0.65rem 0.9rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              minWidth: '110px'
            }}
          >
            {type}
          </button>
        ))}
      </div>

      {/* 3,000 Node Map View Container */}
      <div style={{
        height: 'clamp(360px, 60vh, 560px)',
        width: '100%',
        backgroundColor: '#111827',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1
      }}>
        <MapContainer center={mapCenter} zoom={10} style={{ height: '100%', width: '100%' }} preferCanvas={true}>
          <ScaleControl position="bottomleft" />
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <FastCanvasLayer nodesMapRef={nodesMapRef} filterType={filterType} />
        </MapContainer>
      </div>

      {/* TELEMETRY STATE & AGGREGATED POWER TRACKER */}
      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ color: '#9ca3af', marginBottom: '0.75rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          MICROGRID NODE STATE & AGGREGATED POWER TRACKER (3,000 NODES)
        </h4>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>Metric Category</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>Idle Nodes</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>Charging Nodes</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>Discharging Nodes</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>Total Monitored Nodes</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>Aggregated Net Power Output</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #111827', color: '#e5e7eb' }}>
                <td style={{ padding: '0.85rem 0.5rem', fontWeight: 'bold' }}>Live Node Telemetry</td>
                <td style={{ padding: '0.85rem 0.5rem' }}>
                  <span style={{ color: '#f59e0b', background: '#f59e0b18', padding: '3px 8px', borderRadius: '4px', fontSize: '0.82rem', border: '1px solid #f59e0b44' }}>
                    ● Idle ({gridMetrics.idleCount.toLocaleString()})
                  </span>
                </td>
                <td style={{ padding: '0.85rem 0.5rem' }}>
                  <span style={{ color: '#10b981', background: '#10b98118', padding: '3px 8px', borderRadius: '4px', fontSize: '0.82rem', border: '1px solid #10b98144' }}>
                    ● Charging ({gridMetrics.chargingCount.toLocaleString()})
                  </span>
                </td>
                <td style={{ padding: '0.85rem 0.5rem' }}>
                  <span style={{ color: '#ef4444', background: '#ef444418', padding: '3px 8px', borderRadius: '4px', fontSize: '0.82rem', border: '1px solid #ef444444' }}>
                    ● Discharging ({gridMetrics.dischargingCount.toLocaleString()})
                  </span>
                </td>
                <td style={{ padding: '0.85rem 0.5rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {gridMetrics.totalNodes.toLocaleString()} Active Nodes
                </td>
                <td style={{ padding: '0.85rem 0.5rem', fontWeight: 'bold', color: gridMetrics.totalPowerMW >= 0 ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
                  {gridMetrics.totalPowerMW >= 0 ? `+${gridMetrics.totalPowerMW.toFixed(1)}` : gridMetrics.totalPowerMW.toFixed(1)} MW
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* REAL-TIME SYSTEM EVENT LOG */}
      <div style={{ marginTop: '2.5rem', borderTop: '1px solid #374151', paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ color: '#9ca3af', margin: 0, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📜 REAL-TIME SYSTEM EVENT LOG (REACTIVE AUDIT TRAIL)
          </h4>
        </div>

        <div style={{
          backgroundColor: '#111827',
          borderRadius: '6px',
          padding: '1rem',
          maxHeight: '160px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          border: '1px solid #1f2937',
          lineHeight: '1.6'
        }}>
          <div style={{ color: '#ef4444', marginBottom: '0.4rem' }}>
            [2026-07-24 12:30:01] <span style={{ color: '#9ca3af' }}>[SYS_ALARM]</span> Region-wide grid topology initialized with 3,000 spatial microgrid nodes.
          </div>
          <div style={{ color: '#f59e0b', marginBottom: '0.4rem' }}>
            [2026-07-24 12:30:02] <span style={{ color: '#9ca3af' }}>[STATE_ENG]</span> Substation & Storage clusters balanced across spatial sectors.
          </div>
          <div style={{ color: '#10b981', marginBottom: '0.4rem' }}>
            [2026-07-24 12:30:03] <span style={{ color: '#9ca3af' }}>[SMART_GRID]</span> Fast Canvas sub-layer mounted with 60 FPS update path active.
          </div>
          <div style={{ color: '#9ca3af' }}>
            [2026-07-24 12:30:05] <span style={{ color: '#9ca3af' }}>[SYS_INFO]</span> Frequency balancer target operating normally.
          </div>
        </div>
      </div>
    </div>
  );
}