import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWallet, readCustomerSummary, recordCustomerWallet, loadCustomerSummary, invalidateCustomerSummary } from '../src/lib/customerSummary.mjs';

const values = new Map();
globalThis.sessionStorage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value),
  removeItem: (key) => values.delete(key), key: (index) => [...values.keys()][index], get length() { return values.size; } };
const token = async () => 'fixture-token';
const summary = (real = 10000, bonus = 250) => ({ wallet: { balanceCents: real + bonus, realBalanceCents: real,
  bonusBalanceCents: bonus, totalAvailableCents: real + bonus }, promotions: [{ key: 'topup_bonus' }] });
const response = (data) => ({ ok: true, status: 200, json: async () => data });

test('deposit and bonus remain distinct for both database and summary wallet formats', () => {
  assert.deepEqual(normalizeWallet({ balanceCents: 10000, bonusBalanceCents: 250 }), summary().wallet);
  assert.deepEqual(normalizeWallet(summary().wallet), summary().wallet);
  assert.equal(normalizeWallet({ balanceCents: 0 }).totalAvailableCents, 0);
});

test('pages share an authenticated in-flight summary request, and snapshots are isolated per user', async () => {
  let calls = 0, tokens = 0;
  const getToken = async () => { tokens++; return token(); };
  const options = { fetcher: async (url, request) => {
    calls++; assert.equal(request.headers.Authorization, 'Bearer fixture-token'); return response(summary());
  } };
  const first = loadCustomerSummary('dedup-user', getToken, '', options);
  const second = loadCustomerSummary('dedup-user', getToken, '', options);
  assert.equal(first, second); await first;
  assert.equal(calls, 1); assert.equal(tokens, 1);
  assert.equal(readCustomerSummary('dedup-user').wallet.realBalanceCents, 10000);
  assert.equal(readCustomerSummary('different-user'), null);
});

test('an old response cannot overwrite a confirmed recharge or contaminate another machine quote', async () => {
  let release;
  const loading = loadCustomerSummary('paid-user', token, '', { fetcher: () => new Promise((resolve) => { release = resolve; }) });
  await Promise.resolve();
  recordCustomerWallet('paid-user', { balanceCents: 20000, bonusBalanceCents: 500 });
  release(response(summary(0, 0)));
  const data = await loading;
  assert.equal(data.wallet.realBalanceCents, 20000); assert.equal(data.wallet.totalAvailableCents, 20500);
  assert.equal(readCustomerSummary('paid-user').wallet.realBalanceCents, 20000);
  assert.equal(readCustomerSummary('paid-user', 'membershipContext=1&machineId=OTHER'), null);
});

test('editing promotions invalidates snapshots while subsequent server balances remain authoritative', async () => {
  const options = { fetcher: async () => response(summary(10000, 250)) };
  await loadCustomerSummary('selection-user', token, '', options);
  await loadCustomerSummary('selection-user', token, 'membershipContext=1', options);
  invalidateCustomerSummary('selection-user');
  assert.equal(readCustomerSummary('selection-user'), null);
  assert.equal(readCustomerSummary('selection-user', 'membershipContext=1'), null);
  await loadCustomerSummary('selection-user', token, '', { fetcher: async () => response(summary(5000, 0)) });
  assert.equal(readCustomerSummary('selection-user').wallet.realBalanceCents, 5000);
});
