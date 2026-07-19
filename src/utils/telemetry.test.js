import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeNodeState, applyIncomingNodeUpdates } from './telemetry.js';

test('normalizes common telemetry states', () => {
  assert.equal(normalizeNodeState('Charging'), 'Charging');
  assert.equal(normalizeNodeState('charging'), 'Charging');
  assert.equal(normalizeNodeState('FAULT'), 'Alert');
  assert.equal(normalizeNodeState('offline'), 'Offline');
  assert.equal(normalizeNodeState(undefined), 'Idle');
});

test('applies incoming websocket payloads into node updates', () => {
  const previous = {
    'NODE-001': { state: 'Idle', output: '0 MW', lastSeen: '2024-01-01T00:00:00.000Z' }
  };

  const next = applyIncomingNodeUpdates(previous, {
    nodeId: 'NODE-001',
    status: 'Discharging',
    output: '+12 MW',
    lat: 28.645,
    lng: 77.22
  });

  assert.equal(next['NODE-001'].state, 'Discharging');
  assert.equal(next['NODE-001'].output, '+12 MW');
  assert.equal(next['NODE-001'].lat, 28.645);
  assert.equal(next['NODE-001'].lng, 77.22);
  assert.equal(next['NODE-001'].status, 'Discharging');
  assert.ok(next['NODE-001'].lastSeen);
});
