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
