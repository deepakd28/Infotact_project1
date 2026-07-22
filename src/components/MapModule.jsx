import React, { useEffect, useMemo, useState } from 'react';

import { MapContainer, TileLayer, Marker, Popup, Polyline, ScaleControl } from 'react-leaflet';
import L from 'leaflet';
import { useGridSocket } from '../hooks/useGridSocket';
import { applyIncomingNodeUpdates } from '../utils/telemetry';

// Import Leaflet core styles so the map tiles position themselves correctly
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker assets breaking under modern bundlers like Vite
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

export default function MapModule() {
  const [filterType, setFilterType] = useState('ALL');
  const socketUrl = import.meta.env.VITE_GRID_SOCKET_URL || 'ws://localhost:8080/telemetry';
  const { isConnected, latestData, socketError } = useGridSocket(socketUrl);
  const [liveNodeUpdates, setLiveNodeUpdates] = useState({});
  const [liveEventCount, setLiveEventCount] = useState(0);

  const mockGridNodes = useMemo(() => [
    { id: 'NODE-001', type: 'Solar Farm', state: 'Idle', output: '0 MW (Grid Balancing)', lat: 28.6448, lng: 77.216721 },
    { id: 'NODE-002', type: 'Battery Storage', state: 'Discharging', output: '+15.2 MW (Peak Load)', lat: 28.65, lng: 77.21 },
    { id: 'NODE-003', type: 'Substation', state: 'Charging', output: '-8.4 MW', lat: 28.638, lng: 77.225 }
  ], []);

  const getStateColor = (state) => {
    switch (state) {
      case 'Discharging':
        return '#ef4444';
      case 'Charging':
        return '#10b981';
      case 'Idle':
        return '#f59e0b';
      case 'Alert':
        return '#f97316';
      case 'Offline':
        return '#6b7280';
      default:
        return '#9ca3af';
    }
  };

  const isNodeStale = (node) => {
    if (!node.lastSeen) return false;
    const age = Date.now() - new Date(node.lastSeen).getTime();
    return age > 20_000;
  };

  const getNodeIconProperties = (node) => {
    const stateKey = node.status || node.state;
    const color = isNodeStale(node) ? '#6b7280' : getStateColor(stateKey);
    const size = stateKey === 'Alert' ? 18 : stateKey === 'Discharging' ? 16 : 14;
    return { color, size };
  };

  const createCustomIcon = (color, size = 14) => new L.DivIcon({
    html: `<span style="
      background-color: ${color};
      width: ${size}px;
      height: ${size}px;
      display: block;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 0 ${size / 1.5}px ${color}, 0 0 ${Math.max(4, size / 3)}px ${color};
    "></span>`,
    className: 'custom-grid-marker',
    iconSize: [size, size],
    iconAnchor: [Math.round(size / 2), Math.round(size / 2)],
    popupAnchor: [0, -Math.round(size / 2)]
  });

  useEffect(() => {
    if (!latestData) return;

    const incomingEvents = Array.isArray(latestData) ? latestData : [latestData];
    const hasNodeEvents = incomingEvents.some((event) => event && event.nodeId);

    if (!hasNodeEvents) return;

    setLiveNodeUpdates((prev) => applyIncomingNodeUpdates(prev, latestData));
    setLiveEventCount((count) => count + 1);
  }, [latestData]);

  const mergeNode = (node) => {
    const update = liveNodeUpdates[node.id] || {};
    const resolvedState = update.state || update.status || node.state;

    return {
      ...node,
      state: resolvedState,
      output: update.output || node.output,
      status: resolvedState,
      lastSeen: update.lastSeen || null,
      lat: update.lat ?? node.lat,
      lng: update.lng ?? node.lng,
      type: update.type || node.type
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
          <p style={{ margin: '0.5rem 0 0', color: '#9ca3af', fontSize: '0.9rem' }}>Live telemetry now drives the marker state, color, and status badges.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', background: '#374151', padding: '4px 8px', borderRadius: '4px', color: '#9ca3af' }}>
            Map Engine: Active
          </span>
          <span style={{ fontSize: '0.8rem', background: isConnected ? '#10b981' : '#ef4444', padding: '4px 8px', borderRadius: '4px', color: '#f9fafb' }}>
            {isConnected ? 'WS Connected' : 'WS Disconnected'}
          </span>
          <span style={{ fontSize: '0.8rem', background: '#111827', padding: '4px 8px', borderRadius: '4px', color: '#9ca3af', border: '1px solid #374151' }}>
            {liveEventCount} live events
          </span>
          {lastUpdateAt && (
            <span style={{ fontSize: '0.8rem', background: '#111827', padding: '4px 8px', borderRadius: '4px', color: '#9ca3af', border: '1px solid #374151' }}>
              Last update: {new Date(lastUpdateAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {socketError && (
        <div style={{ marginBottom: '1rem', padding: '0.75rem 0.9rem', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.12)', color: '#fecaca', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          {socketError}
        </div>
      )}

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
              transition: 'background 0.2s, color 0.2s',
              minWidth: '110px'
            }}
          >
            {type}
          </button>
        ))}
      </div>

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
            positions={mockGridNodes.map((node) => [node.lat, node.lng])}
          />
          {filteredNodes.map((node) => {
            const { color, size } = getNodeIconProperties(node);
            return (
              <Marker key={node.id} position={[node.lat, node.lng]} icon={createCustomIcon(color, size)}>
                <Popup>
                  <div style={{ color: '#1f2937', fontFamily: 'sans-serif', minWidth: '180px' }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#111827' }}>⚡ {node.id}</h4>
                    <div style={{ fontSize: '0.85rem', margin: '2px 0' }}><strong>Type:</strong> {node.type}</div>
                    <div style={{ fontSize: '0.85rem', margin: '2px 0' }}>
                      <strong>State:</strong> <span style={{ color, fontWeight: 'bold' }}>{node.status || node.state}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', margin: '2px 0' }}><strong>Metrics:</strong> {node.output}</div>
                    {node.lastSeen && (
                      <div style={{ fontSize: '0.75rem', marginTop: '6px', color: '#6b7280' }}>Updated {new Date(node.lastSeen).toLocaleTimeString()}</div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h4 style={{ color: '#9ca3af', marginBottom: '0.75rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Live telemetry node cards
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
              {filteredNodes.map((node) => (
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
            Live stream enabled
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