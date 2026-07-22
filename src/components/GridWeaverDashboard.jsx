import React, { useState } from 'react';

/**
 * GridWeaver Microgrid Dashboard Component
 * Designed for real-time telemetry, GIS topology monitoring, and grid node metrics.
 */
export default function GridWeaverDashboard() {
  const [filter, setFilter] = useState('ALL');
  const [wsStatus, setWsStatus] = useState('DISCONNECTED');

  const nodeTypes = ['ALL', 'Solar Farm', 'Battery Storage', 'Substation'];

  const telemetryData = [
    { id: 'NODE-001', type: 'Solar Farm', status: 'STANDBY', power: '12.4 MW', coords: '28.6139° N, 77.2090° E' },
    { id: 'NODE-002', type: 'Battery Storage', status: 'STANDBY', power: '6.2 MW', coords: '28.6280° N, 77.2180° E' },
    { id: 'NODE-003', type: 'Substation', status: 'ACTIVE', power: '5.0 MW', coords: '28.6100° N, 77.2300° E' },
  ];

  const filteredNodes = filter === 'ALL' 
    ? telemetryData 
    : telemetryData.filter(node => node.type === filter);

  return (
    <div style={{ backgroundColor: '#0e1726', color: '#e0e6ed', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
      
      {/* Top Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', backgroundColor: '#131d31', padding: '16px 24px', borderRadius: '8px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚡ GridWeaver Dashboard
          </h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888ea8' }}>
            IoT Microgrid State Engine UI
          </p>
        </div>
        <div>
          <span style={{ fontSize: '12px', color: '#888ea8', marginRight: '8px' }}>System Status:</span>
          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            STABLE
          </span>
        </div>
      </header>

      {/* Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        
        {/* Metric 1 */}
        <div style={{ backgroundColor: '#131d31', padding: '20px', borderRadius: '8px', border: '1px solid #1b2e4b' }}>
          <div style={{ fontSize: '12px', color: '#888ea8', marginBottom: '8px' }}>Simulated Loom Connections</div>
          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>STANDBY</span>
          <h2 style={{ fontSize: '28px', margin: '12px 0 4px 0' }}>2</h2>
          <div style={{ fontSize: '12px', color: '#888ea8' }}>Active endpoints</div>
        </div>

        {/* Metric 2 */}
        <div style={{ backgroundColor: '#131d31', padding: '20px', borderRadius: '8px', border: '1px solid #1b2e4b' }}>
          <div style={{ fontSize: '12px', color: '#888ea8', marginBottom: '8px' }}>Monitored Microgrid Nodes</div>
          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>STANDBY</span>
          <h2 style={{ fontSize: '28px', margin: '12px 0 4px 0' }}>3 <span style={{ fontSize: '14px', color: '#888ea8' }}>/ 50,000</span></h2>
          <div style={{ fontSize: '12px', color: '#888ea8' }}>Awaiting telemetry</div>
        </div>

        {/* Metric 3 */}
        <div style={{ backgroundColor: '#131d31', padding: '20px', borderRadius: '8px', border: '1px solid #1b2e4b' }}>
          <div style={{ fontSize: '12px', color: '#888ea8', marginBottom: '8px' }}>Current Generation Capacity</div>
          <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>STANDBY</span>
          <h2 style={{ fontSize: '28px', color: '#e2a03f', margin: '12px 0 4px 0' }}>+23.6 MW</h2>
          <div style={{ fontSize: '12px', color: '#888ea8' }}>Aggregated dispatch</div>
        </div>

      </div>

      {/* Topology & Telemetry Section */}
      <section style={{ backgroundColor: '#131d31', padding: '24px', borderRadius: '8px', border: '1px solid #1b2e4b' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🗺️ GIS Live Topology View
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888ea8' }}>
              Live telemetry now drives the marker state, color, and status badges.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', backgroundColor: '#1b2e4b', padding: '4px 8px', borderRadius: '4px' }}>Map Engine: Active</span>
            <span style={{ fontSize: '11px', backgroundColor: '#e7515a', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
              WS {wsStatus}
            </span>
          </div>
        </div>

        {/* WebSocket Error Banner */}
        {wsStatus === 'DISCONNECTED' && (
          <div style={{ backgroundColor: 'rgba(231, 81, 90, 0.15)', color: '#e7515a', border: '1px solid #e7515a', padding: '12px 16px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>
            Unable to reach the telemetry WebSocket endpoint.
          </div>
        )}

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {nodeTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                backgroundColor: filter === type ? '#10b981' : '#1b2e4b',
                color: filter === type ? '#0e1726' : '#888ea8',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                transition: 'all 0.2s'
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Live Telemetry Node Cards Table */}
        <div style={{ marginTop: '24px' }}>
          <h4 style={{ fontSize: '12px', color: '#888ea8', textTransform: 'uppercase', tracking: '1px', marginBottom: '12px' }}>
            Live Telemetry Node Cards
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1b2e4b', color: '#888ea8' }}>
                <th style={{ padding: '12px' }}>Node ID</th>
                <th style={{ padding: '12px' }}>Type</th>
                <th style={{ padding: '12px' }}>State Machine Status</th>
                <th style={{ padding: '12px' }}>Power Output</th>
                <th style={{ padding: '12px' }}>GIS Coordinates</th>
              </tr>
            </thead>
            <tbody>
              {filteredNodes.map(node => (
                <tr key={node.id} style={{ borderBottom: '1px solid #19263c' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{node.id}</td>
                  <td style={{ padding: '12px' }}>{node.type}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>
                      {node.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{node.power}</td>
                  <td style={{ padding: '12px', color: '#888ea8' }}>{node.coords}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </section>
    </div>
  );
}