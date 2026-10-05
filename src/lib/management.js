const API = import.meta.env.VITE_API_URL;
export const ADMIN_SESSION_KEY = 'agua24MonitorSession';
const ADMIN_MODE_KEY = 'agua24AdminLoginMode';

export function getAdminSession() {
  return window.sessionStorage.getItem(ADMIN_MODE_KEY) === 'username'
    ? window.sessionStorage.getItem(ADMIN_SESSION_KEY) : null;
}

export function saveAdminSession(token) {
  clearAdminSession();
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, token);
  window.sessionStorage.setItem(ADMIN_MODE_KEY, 'username');
  window.dispatchEvent(new Event('agua24-admin-session'));
}

export async function getManagementToken(getToken) {
  return getAdminSession() ? null : getToken({ template: 'aquaqr-api' }).catch(() => null);
}

export function managementHeaders(token, extra = {}) {
  const session = getAdminSession();
  return { ...(session ? { 'X-Monitor-Session': session } : token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

export function accountHome(access) {
  if (access.role === 'ADMIN') return '/water-monitor';
  if (access.role === 'PARTNER') return '/partner-panel';
  return '/home-dashboard';
}

export function clearAdminSession() {
  for (const key of [ADMIN_SESSION_KEY, ADMIN_MODE_KEY, 'agua24MonitorAdmin', 'agua24MonitorAdminUser', 'agua24MonitorAdminPassword']) {
    window.sessionStorage.removeItem(key);
  }
  window.dispatchEvent(new Event('agua24-admin-session'));
}

export async function managementFetch(url, options) {
  const response = await fetch(url, options);
  if (response.status === 401) clearAdminSession();
  return response;
}

export async function managementRequest(path, getToken, options = {}) {
  const token = await getManagementToken(getToken);
  if (!token && !getAdminSession()) throw Object.assign(new Error('Tu sesión ha terminado. Inicia sesión nuevamente.'), { status: 401 });
  const res = await managementFetch(`${API}${path}`, { ...options,
    headers: managementHeaders(token, { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }),
    cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = Object.assign(new Error(data.error || 'No se pudo completar la operación'), { status: res.status });
    if (res.status === 401) clearAdminSession();
    throw error;
  }
  return data;
}
