import test from 'node:test';
import assert from 'node:assert/strict';
import { canResumeDispense, isDispenseRoute, resumedDispenseState } from '../src/lib/dispenseSession.mjs';

const now = Date.parse('2026-10-14T18:00:00Z');
const session = (changes = {}) => ({ active: true, machineId: 'AQ-002', hardwareId: '02',
  selectedLiters: 20, stageCode: '06', expiresAt: '2026-10-14T18:20:00Z',
  tx: { txId: 'fill-002', status: 'STARTED', startPulseCount: 0, pulsesPerLiter: 360 }, ...changes });

test('a QR reservation never resumes as a filling transaction, even with an old filling stage', () => {
  for (const stageCode of [null, '00', '01', '03', '06']) {
    assert.equal(canResumeDispense(session({ tx: null, stageCode }), now), false);
  }
});

test('only a started transaction in a live server reservation can be restored', () => {
  assert.equal(canResumeDispense(session(), now), true);
  for (const changes of [{ active: false }, { expiresAt: '2026-10-14T17:59:00Z' },
    { expiresAt: '2026-10-14T18:00:00Z' }, { expiresAt: 'invalid' }, { expiresAt: undefined },
    { tx: { status: 'STARTED' } }, ...['COMPLETED', 'CANCELED', 'FAILED'].map((status) => ({ tx: { txId: 'fill-002', status } }))]) {
    assert.equal(canResumeDispense(session(changes), now), false);
  }
});

test('returning to a confirmed filling preserves its original flowmeter baseline without using a different transaction', () => {
  const previous = { txId: 'fill-002', startPulseCount: 850, pulsesPerLiter: 400, status: 'COMPLETED' };
  const restored = resumedDispenseState(session(), previous);
  assert.equal(restored.tx.startPulseCount, 850);
  assert.equal(restored.tx.pulsesPerLiter, 400);
  assert.equal(restored.tx.status, 'STARTED');
  assert.equal(restored.machineId, 'AQ-002');
  assert.equal(resumedDispenseState(session(), { ...previous, txId: 'other-fill' }).tx.startPulseCount, 0);
});

test('session recovery leaves payment returns and management panels in their own routes', () => {
  for (const pathname of ['/water', '/water/choose', '/water/position-up', '/water-dispensing-control', '/filling-progress', '/qr-scanner-landing']) {
    assert.equal(isDispenseRoute(pathname), true);
  }
  for (const pathname of ['/home-dashboard', '/balance-recharge', '/water-monitor', '/partner-panel', '/qr-resolver']) {
    assert.equal(isDispenseRoute(pathname), false);
  }
});
