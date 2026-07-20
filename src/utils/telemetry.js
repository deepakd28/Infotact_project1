export function normalizeNodeState(value, fallback = 'Idle') {
  if (typeof value !== 'string') return fallback;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const normalized = trimmed.toLowerCase();

  if (['charging', 'charge', 'charging_cycle'].includes(normalized)) return 'Charging';
  if (['discharging', 'discharge', 'active'].includes(normalized)) return 'Discharging';
  if (['idle', 'standby', 'stable'].includes(normalized)) return 'Idle';
  if (['alert', 'fault', 'warning', 'alarm'].includes(normalized)) return 'Alert';
  if (['offline', 'lost', 'stale'].includes(normalized)) return 'Offline';

  return trimmed.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function applyIncomingNodeUpdates(previousUpdates, incomingEvent) {
  const next = { ...(previousUpdates || {}) };
  if (!incomingEvent || !incomingEvent.nodeId) return next;

  const normalizedState = normalizeNodeState(incomingEvent.state ?? incomingEvent.status);
  const status = normalizeNodeState(incomingEvent.status ?? incomingEvent.state);

  next[incomingEvent.nodeId] = {
    ...(next[incomingEvent.nodeId] || {}),
    ...incomingEvent,
    state: normalizedState,
    status,
    lastSeen: incomingEvent.lastSeen || new Date().toISOString()
  };

  return next;
}

export function parsePowerValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim().replace(/,/g, '');
  const match = trimmed.match(/[-+]?\d+(?:\.\d+)?/);
  if (!match) return null;

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatPowerValue(value) {
  if (value == null || Number.isNaN(value)) return '0 MW';

  const rounded = Math.abs(value) >= 100 ? Math.round(value) : Number(value.toFixed(1));
  const prefix = value >= 0 ? '+' : '-';
  return `${value === 0 ? '' : prefix}${rounded.toFixed(rounded % 1 === 0 ? 0 : 1)} MW`;
}

export function computeDashboardMetrics(nodeUpdates = {}) {
  const entries = Object.values(nodeUpdates || {});
  const monitoredNodes = Math.max(entries.length, 1);
  const activeConnections = entries.filter((node) => {
    const state = (node.status || node.state || '').toString().toLowerCase();
    return ['charging', 'discharging', 'alert'].includes(state);
  }).length;
  const totalCapacityMw = entries.reduce((sum, node) => {
    const value = parsePowerValue(node.output);
    return sum + (value == null ? 0 : Math.abs(value));
  }, 0);

  return {
    monitoredNodes,
    activeConnections,
    totalCapacityMw
  };
}
