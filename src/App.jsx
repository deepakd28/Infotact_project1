import React from 'react';
import MapModule from './components/MapModule';
import './App.css';

function App() {
  // Global Mock Grid Metrics to fit the "GridWeaver" theme
  const gridMetrics = {
    totalNodes: 3,
    activeConnections: "100,000+ (Virtual Threads active)",
    systemStatus: "STABLE",
    totalCapacity: "450 MW"
  };

  return (
    <div className="app-container" style={{ fontFamily: 'system-ui, sans-serif', background: '#111827', color: '#f9fafb', minHeight: '100vh' }}>
      {/* Dashboard Header */}
      <header style={{ padding: '1.5rem', backgroundColor: '#1f2937', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#10b981' }}>⚡ GridWeaver Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>IoT Microgrid State Engine UI</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>System Status: </span>
          <strong style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>{gridMetrics.systemStatus}</strong>
        </div>
      </header>
      
      {/* Dashboard Analytics Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1.5rem 1.5rem 0 1.5rem' }}>
        <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Simulated Loom Connections</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '4px', color: '#60a5fa' }}>{gridMetrics.activeConnections}</div>
        </div>
        <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Monitored Microgrid Nodes</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '4px' }}>{gridMetrics.totalNodes} / 50,000</div>
        </div>
        <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Current Generation Capacity</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '4px', color: '#f59e0b' }}>{gridMetrics.totalCapacity}</div>
        </div>
      </div>

      {/* Main Map Content Wrapper */}
      <main style={{ padding: '1.5rem' }}>
        <MapModule />
      </main>
    </div>
  );
}

export default App;