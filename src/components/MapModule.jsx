import React, { useEffect, useState } from 'react';

import { MapContainer, TileLayer, Marker, Popup, Polyline, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import { useGridSocket } from '../hooks/useGridSocket';

// Import Leaflet core styles so the map tiles position themselves correctly
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker assets breaking under modern bundlers like Vite
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function MapModule() {
  const [filterType, setFilterType] = useState('ALL');
  const socketUrl = import.meta.env.VITE_GRID_SOCKET_URL || 'ws://localhost:8080/telemetry';
  const { isConnected, latestData } = useGridSocket(socketUrl);
  const [liveNodeUpdates, setLiveNodeUpdates] = useState({});

  // Structuring mock IoT node telemetry to mirror your backend state definitions
  const mockGridNodes = [
    { id: "NODE-001", type: "Solar Farm", state: "Idle", output: "0 MW (Grid Balancing)", lat: 28.644800, lng: 77.216721 },
    { id: "NODE-002", type: "Battery Storage", state: "Discharging", output: "+15.2 MW (Peak Load)", lat: 28.650000, lng: 77.210000 },
    { id: "NODE-003", type: "Substation", state: "Charging", output: "-8.4 MW", lat: 28.638000, lng: 77.225000 }
  ];

  // Helper helper function to assign colors to Spring State Machine states
  const getStateColor = (state) => {
    switch(state) {
      case 'Discharging': return '#ef4444'; // Red/Orange for active supply drain
      case 'Charging': return '#10b981';    // Green for taking power
      case 'Idle': return '#f59e0b';        // Amber for down/standby
      default: return '#9ca3af';
    }
  };

  // Generates custom glowing dots instead of bulky default Leaflet icons
  const createCustomIcon = (color) => {
    return new L.DivIcon({
      html: `<span style="
        background-color: ${color}; 
        width: 14px; 
        height: 14px; 
        display: block; 
        border-radius: 50%; 
        border: 2px solid #ffffff; 
        box-shadow: 0 0 10px ${color}, 0 0 4px ${color};
      "></span>`,
      className: 'custom-grid-marker',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
      popupAnchor: [0, -7]
    });
  };

  useEffect(() => {
    if (!latestData) return;
    const incomingEvents = Array.isArray(latestData) ? latestData : [latestData];
    setLiveNodeUpdates((prev) => {
      const next = { ...prev };
      incomingEvents.forEach((event) => {
        if (!event.nodeId) return;
        next[event.nodeId] = {
          ...(next[event.nodeId] || {}),
          ...event,
          lastSeen: new Date().toISOString()
        };
      });
      return next;
    });
  }, [latestData]);

  const mergeNode = (node) => {
    const update = liveNodeUpdates[node.id] || {};
    return {
      ...node,
      state: update.state || node.state,
      output: update.output || node.output,
      status: update.status || node.state,
      lastSeen: update.lastSeen || null
    };
  };

  const filteredNodes = mockGridNodes
    .map(mergeNode)
    .filter((node) => {
      if (filterType === 'ALL') return true;
      return node.type === filterType;
    });

  const lastUpdateAt = Object.values(liveNodeUpdates).reduce((latest, item) => {
    if (!item.lastSeen) return latest;
    return latest > item.lastSeen ? latest : item.lastSeen;
  }, '');

  // Center point of your city grid (Delhi, India)
  const mapCenter = [
    mockGridNodes.reduce((sum, node) => sum + node.lat, 0) / mockGridNodes.length,
    mockGridNodes.reduce((sum, node) => sum + node.lng, 0) / mockGridNodes.length
  ];

  const nodeTypes = ['ALL', 'Solar Farm', 'Battery Storage', 'Substation'];

  return (
    <div style={{
      border: '1px solid #374151',
      borderRadius: '8px',
      padding: '2rem',
      backgroundColor: '#1f2937',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, color: '#f3f4f6' }}>🗺️ GIS Live Topology View</h3>
          <p style={{ margin: '0.5rem 0 0', color: '#9ca3af', fontSize: '0.9rem' }}>Static city grid scaffold with mock node markers</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', background: '#374151', padding: '4px 8px', borderRadius: '4px', color: '#9ca3af' }}>
            Map Engine: Active
          </span>
          <span style={{ fontSize: '0.8rem', background: isConnected ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '4px', color: '#f9fafb' }}>
            {isConnected ? 'WS Connected' : 'WS Disconnected'}
          </span>
          {lastUpdateAt && (
            <span style={{ fontSize: '0.8rem', background: '#111827', padding: '4px 8px', borderRadius: '4px', color: '#9ca3af', border: '1px solid #374151' }}>
              Last update: {new Date(lastUpdateAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {nodeTypes.map(type => (
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
              transition: 'background 0.2s, color 0.2s',
              minWidth: '110px'
            }}
          >
            {type}
          </button>
        ))}
      </div>

     {/* Live Leaflet Map Container Canvas */}
      <div style={{
        height: 'clamp(320px, 55vh, 520px)',
        width: '100%',
        backgroundColor: '#111827',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 1 
      }}>
       <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
          <ScaleControl position="bottomleft" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <Polyline
            pathOptions={{ color: '#60a5fa', weight: 2, dashArray: '8 6', opacity: 0.75 }}
            positions={mockGridNodes.map(node => [node.lat, node.lng])}
          />
          {filteredNodes.map((node) => (
            <Marker key={node.id} position={[node.lat, node.lng]} icon={createCustomIcon(getStateColor(node.state))}>
              <Popup>
                <div style={{ color: '#1f2937', fontFamily: 'sans-serif', minWidth: '160px' }}>
                  <h4 style={{ margin: '0 0 4px 0', color: '#111827' }}>⚡ {node.id}</h4>
                  <div style={{ fontSize: '0.85rem', margin: '2px 0' }}><strong>Type:</strong> {node.type}</div>
                  <div style={{ fontSize: '0.85rem', margin: '2px 0' }}>
                    <strong>State:</strong> <span style={{ color: getStateColor(node.state), fontWeight: 'bold' }}>{node.state}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', margin: '2px 0' }}><strong>Metrics:</strong> {node.output}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Simulated Telemetry Streams Table */}
      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ color: '#9ca3af', marginBottom: '0.75rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Staged Telemetry Node Models (Step 3/4 Target)
        </h4>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#9ca3af' }}>
                <th style={{ padding: '0.5rem' }}>Node ID</th>
                <th style={{ padding: '0.5rem' }}>Type</th>
                <th style={{ padding: '0.5rem' }}>State Machine Status</th>
                <th style={{ padding: '0.5rem' }}>Power Output</th>
                <th style={{ padding: '0.5rem' }}>GIS Coordinates</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map(node => (
                <tr key={node.id} style={{ borderBottom: '1px solid #111827', color: '#e5e7eb' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{node.id}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{node.type}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{ 
                      color: getStateColor(node.state), 
                      background: 'rgba(255,255,255,0.03)', 
                      padding: '2px 6px', 
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      border: `1px solid ${getStateColor(node.state)}33`
                    }}>
                      ● {node.state}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>{node.output}</td>
                  <td style={{ padding: '0.75rem 0.5rem', fontFamily: 'monospace', color: '#9ca3af' }}>
                    {node.lat.toFixed(4)}, {node.lng.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop: '2rem', borderTop: '1px solid #374151', paddingTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h4 style={{ color: '#9ca3af', margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📜 Real-time System Event Log (Reactive Audit Trail)
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#60a5fa', background: 'rgba(96, 165, 250, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
            Kafka Sync Pending
          </span>
        </div>

        <div style={{ 
          backgroundColor: '#111827', 
          borderRadius: '6px', 
          padding: '1rem', 
          maxHeight: '150px', 
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.85rem',
          border: '1px solid #1f2937',
          lineHeight: '1.5'
        }}>
          <div style={{ color: '#ef4444', marginBottom: '0.4rem' }}>
            [2026-07-10 14:32:01] <span style={{ color: '#9ca3af' }}>[SYS_ALARM]</span> Storm front detected in Zone A. 50,000 Solar connections fluctuating.
          </div>
          <div style={{ color: '#f59e0b', marginBottom: '0.4rem' }}>
            [2026-07-10 14:32:02] <span style={{ color: '#9ca3af' }}>[STATE_ENG]</span> NODE-001 tripped transition: <span style={{ fontWeight: 'bold' }}>Charging → Idle</span>
          </div>
          <div style={{ color: '#10b981', marginBottom: '0.4rem' }}>
            [2026-07-10 14:32:03] <span style={{ color: '#9ca3af' }}>[SMART_GRID]</span> Triggered discharge event to NODE-002 (Home Battery Wall). +12.5 MW injection active.
          </div>
          <div style={{ color: '#9ca3af' }}>
            [2026-07-10 14:32:05] <span style={{ color: '#9ca3af' }}>[SYS_INFO]</span> Grid load stabilized at 60Hz frequency balancer target.
          </div>
        </div>
      </div>
    </div>
  );
}