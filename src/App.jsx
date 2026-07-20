import React, { useEffect, useMemo, useState } from 'react';
import MapModule from './components/MapModule';
import { useGridSocket } from './hooks/useGridSocket';
import { applyIncomingNodeUpdates, computeDashboardMetrics, formatPowerValue } from './utils/telemetry';
import './App.css';

function SparklineMini({ values, accent }) {
  const width = 84;
  const height = 46;
  const max = Math.max(...values);
  const min = Math.min(...values);

  const points = values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / (max - min || 1)) * (height - 8) - 4;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="kpi-sparkline" aria-hidden="true">
      <polyline points={points.join(' ')} fill="none" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RadialMeter({ accent, progress = 0.68 }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg viewBox="0 0 56 56" className="kpi-radial" aria-hidden="true">
      <circle cx="28" cy="28" r={radius} stroke="rgba(255,255,255,0.12)" strokeWidth="6" fill="none" />
      <circle
        cx="28"
        cy="28"
        r={radius}
        stroke={accent}
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - progress)}
        transform="rotate(-90 28 28)"
      />
    </svg>
  );
}

function App() {
  const socketUrl = import.meta.env.VITE_GRID_SOCKET_URL || 'ws://localhost:8080/telemetry';
  const { isConnected, latestData } = useGridSocket(socketUrl);
  const [liveNodeUpdates, setLiveNodeUpdates] = useState(() => ({
    'NODE-001': { id: 'NODE-001', state: 'Idle', status: 'Idle', output: '0 MW' },
    'NODE-002': { id: 'NODE-002', state: 'Discharging', status: 'Discharging', output: '+15.2 MW' },
    'NODE-003': { id: 'NODE-003', state: 'Charging', status: 'Charging', output: '-8.4 MW' }
  }));
  const [lastUpdated, setLastUpdated] = useState(() => new Date());

  useEffect(() => {
    if (!latestData) return;

    const incomingEvents = Array.isArray(latestData) ? latestData : [latestData];
    const hasNodeEvents = incomingEvents.some((event) => event && event.nodeId);

    if (!hasNodeEvents) return;

    setLiveNodeUpdates((previous) => incomingEvents.reduce((next, event) => applyIncomingNodeUpdates(next, event), previous));
    setLastUpdated(new Date());
  }, [latestData]);

  useEffect(() => {
    if (isConnected) {
      setLastUpdated(new Date());
    }
  }, [isConnected]);

  const dashboardMetrics = useMemo(() => computeDashboardMetrics(liveNodeUpdates), [liveNodeUpdates]);

  const kpiCards = [
    {
      label: 'Simulated Loom Connections',
      value: dashboardMetrics.activeConnections.toLocaleString(),
      subvalue: 'Active endpoints',
      accent: '#60a5fa',
      visual: 'sparkline',
      sparkValues: [14, 22, 20, 28, 24, 31]
    },
    {
      label: 'Monitored Microgrid Nodes',
      value: dashboardMetrics.monitoredNodes,
      total: '/ 50,000',
      subvalue: isConnected ? 'Live telemetry tracked' : 'Awaiting telemetry',
      accent: '#00E676',
      visual: 'radial'
    },
    {
      label: 'Current Generation Capacity',
      value: formatPowerValue(dashboardMetrics.totalCapacityMw),
      subvalue: 'Aggregated dispatch',
      accent: '#FFB300',
      visual: 'sparkline',
      sparkValues: [12, 17, 16, 22, 19, 25]
    }
  ];

  return (
    <div className="app-container" style={{ fontFamily: 'system-ui, sans-serif', background: '#111827', color: '#f9fafb', minHeight: '100vh' }}>
      <header style={{ padding: '1.5rem', backgroundColor: '#1f2937', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#10b981' }}>⚡ GridWeaver Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#9ca3af' }}>IoT Microgrid State Engine UI</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>System Status: </span>
          <strong style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>STABLE</strong>
        </div>
      </header>

      <div className="kpi-grid">
        {kpiCards.map((card) => (
          <div key={card.label} className="kpi-card">
            <div className="kpi-body">
              <div className="kpi-label">{card.label}</div>
              <div className="kpi-live-pill">{isConnected ? 'LIVE' : 'STANDBY'}</div>
              <div className="kpi-value-row">
                <span className="kpi-value" style={{ color: card.accent }}>{card.value}</span>
                {card.total ? <span className="kpi-total">{card.total}</span> : null}
              </div>
              <div className="kpi-subvalue">{card.subvalue}</div>
            </div>
            <div className="kpi-visual" aria-hidden="true">
              {card.visual === 'sparkline' ? (
                <SparklineMini values={card.sparkValues} accent={card.accent} />
              ) : (
                <RadialMeter accent={card.accent} />
              )}
            </div>
          </div>
        ))}
      </div>

      <section className="status-panel" aria-label="System health overview">
        <div className="status-panel__header">
          <div>
            <p className="status-panel__eyebrow">System health</p>
            <h2>Live operations overview</h2>
          </div>
          <div className={`status-pill ${isConnected ? 'status-pill--live' : 'status-pill--standby'}`}>
            {isConnected ? 'Telemetry live' : 'Awaiting feed'}
          </div>
        </div>

        <div className="status-panel__body">
          <div className="status-panel__main">
            <div className="status-figure">{dashboardMetrics.activeConnections}</div>
            <div className="status-copy">
              <strong>Active grid links</strong>
              <p>Current endpoint activity and connection resilience.</p>
            </div>
          </div>

          <div className="status-panel__details">
            <div className="status-chip">Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            <div className="status-chip">Nodes monitored {dashboardMetrics.monitoredNodes}</div>
            <div className="status-chip">Capacity {formatPowerValue(dashboardMetrics.totalCapacityMw)}</div>
          </div>
        </div>
      </section>

      <main style={{ padding: '1.5rem' }}>
        <MapModule />
      </main>
    </div>
  );
}

export default App;