import React from 'react';

export default function MapModule() {
  // Structuring mock IoT node telemetry to mirror your backend state definitions
  const mockGridNodes = [
    { id: "NODE-001", type: "Solar Array", state: "Idle", output: "0 MW (Storm Impacted)", lat: 40.7128, lng: -74.0060 },
    { id: "NODE-002", type: "Home Battery Wall", state: "Discharging", output: "+12.5 MW (Rerouting)", lat: 40.7250, lng: -74.0100 },
    { id: "NODE-003", type: "Industrial Substation", state: "Charging", output: "-5.0 MW", lat: 40.7350, lng: -73.9900 }
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

  return (
    <div style={{
      border: '1px solid #374151',
      borderRadius: '8px',
      padding: '2rem',
      backgroundColor: '#1f2937',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, color: '#f3f4f6' }}>🗺️ GIS Live Topology View</h3>
        <span style={{ fontSize: '0.8rem', background: '#374151', padding: '4px 8px', borderRadius: '4px', color: '#9ca3af' }}>
          Dependencies Ready: react-leaflet
        </span>
      </div>

      {/* Visual Placeholder for the Leaflet Container */}
      <div style={{
        height: '350px',
        backgroundColor: '#111827',
        border: '2px dashed #4b5563',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '1rem'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🗺️</div>
        <div style={{ fontWeight: 'bold', color: '#e5e7eb' }}>Leaflet Map Container Scaffolding</div>
        <p style={{ color: '#9ca3af', fontSize: '0.85rem', maxWidth: '400px', textAlign: 'center', margin: '4px 0 0 0' }}>
          Step 1 Complete. Tomorrow this container will render interactive open-source tiles bound to incoming Kafka event offsets.
        </p>
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
              {mockGridNodes.map(node => (
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
    </div>
  );
}