const API = import.meta.env?.VITE_API_URL || '';
const PREFIX = 'agua24.customer-summary.v1:';
const MAX_AGE = 5 * 60 * 1000;
const pending = new Map(), revisions = new Map(), walletUpdates = new Map();
const userPrefix = (userId) => `${PREFIX}${encodeURIComponent(userId)}:`;
const queryKey = (query = '') => { const params = new URLSearchParams(query); params.sort(); return params.toString(); };
const summaryKey = (userId, query) => `${userPrefix(userId)}summary:${queryKey(query)}`;
const read = (key) => { try { return JSON.parse(globalThis.sessionStorage?.getItem(key) || 'null'); } catch { return null; } };
const write = (key, value) => { try { globalThis.sessionStorage?.setItem(key, JSON.stringify(value)); } catch { /* Storage can be disabled. */ } };

export function normalizeWallet(wallet) {
  if (!wallet || !Number.isFinite(Number(wallet.realBalanceCents ?? wallet.balanceCents))) return null;
  const realBalanceCents = Number(wallet.realBalanceCents ?? wallet.balanceCents);
  const bonusBalanceCents = Number(wallet.bonusBalanceCents || 0);
  const totalAvailableCents = realBalanceCents + bonusBalanceCents;
  return { balanceCents: totalAvailableCents, realBalanceCents, bonusBalanceCents, totalAvailableCents };
}

export function readCustomerSummary(userId, query = '') {
  if (!userId) return null;
  const stored = read(summaryKey(userId, query));
  if (stored?.userId !== userId || !stored.data?.wallet || !Array.isArray(stored.data.promotions)
    || !Number.isFinite(stored.savedAt) || Date.now() - stored.savedAt > MAX_AGE) return null;
  const update = walletUpdates.get(userId) || read(`${userPrefix(userId)}wallet`);
  return update?.savedAt >= stored.savedAt ? { ...stored.data, wallet: update.wallet } : stored.data;
}

export function recordCustomerWallet(userId, value) {
  const wallet = normalizeWallet(value);
  if (!userId || !wallet) return wallet;
  const current = readCustomerSummary(userId);
  revisions.set(userId, (revisions.get(userId) || 0) + 1);
  const update = { wallet, savedAt: Date.now() };
  walletUpdates.set(userId, update); write(`${userPrefix(userId)}wallet`, update);
  write(summaryKey(userId, ''), { userId, savedAt: update.savedAt, data: {
    ...(current || { promotions: [], partial: true }), wallet,
  } });
  return wallet;
}

export function invalidateCustomerSummary(userId) {
  if (!userId) return;
  revisions.set(userId, (revisions.get(userId) || 0) + 1);
  try {
    const storage = globalThis.sessionStorage, prefix = `${userPrefix(userId)}summary:`;
    for (let index = (storage?.length || 0) - 1; index >= 0; index--) {
      const key = storage.key(index); if (key?.startsWith(prefix)) storage.removeItem(key);
    }
  } catch { /* The next authenticated request still gets fresh data. */ }
}

export function loadCustomerSummary(userId, getToken, query = '', { fetcher = globalThis.fetch } = {}) {
  if (!userId) return Promise.reject(new Error('Inicia sesión para consultar tu saldo.'));
  const revision = revisions.get(userId) || 0;
  const key = summaryKey(userId, query), requestKey = `${key}:${revision}`;
  if (pending.has(requestKey)) return pending.get(requestKey);
  const request = (async () => {
    const token = await getToken({ template: 'aquaqr-api' });
    if (!token) throw new Error('No se pudo obtener tu sesión. Intenta nuevamente.');
    const params = queryKey(query);
    const response = await fetcher(`${API}/api/rewards/summary${params ? `?${params}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
    });
    let data = await response.json().catch(() => null);
    if (!response.ok || !data) throw Object.assign(new Error(data?.error || 'No se pudo cargar tu resumen.'), { status: response.status });
    // A read started before an approved payment must never replace its new balance.
    if ((revisions.get(userId) || 0) !== revision) {
      const update = walletUpdates.get(userId);
      if (update) data = { ...data, wallet: update.wallet };
      return data;
    }
    const savedAt = Date.now(), wallet = normalizeWallet(data.wallet);
    if (wallet) {
      const update = { wallet, savedAt }; walletUpdates.set(userId, update);
      write(`${userPrefix(userId)}wallet`, update); data = { ...data, wallet };
    }
    write(key, { userId, data, savedAt });
    return data;
  })().finally(() => pending.delete(requestKey));
  pending.set(requestKey, request);
  return request;
}
