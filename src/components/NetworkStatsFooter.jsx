import React from 'react';

export default function NetworkStatsFooter() {
  const stats = [
    { label: 'Latency', value: '18 ms', status: 'optimal' },
    { label: 'Packet Throughput', value: '1.24 MB/s', status: 'optimal' },
    { label: 'Buffer Health', value: '99.8%', status: 'optimal' },
    { label: 'Active Protocols', value: 'MQTT / WS', status: 'neutral' }
  ];

  return (
    <footer
      style={{
        margin: '0 1.5rem 1.5rem',
        padding: '0.85rem 1.25rem',
        borderRadius: '12px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 8px #10b981'
          }}
        />
        <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>
          Real-time Socket Telemetry Stream
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {stats.map((stat) => (
          <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{stat.label}:</span>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: '600',
                color: stat.status === 'optimal' ? '#34d399' : '#e5e7eb',
                fontFamily: 'monospace'
              }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </footer>
  );
}
