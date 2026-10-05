const API = import.meta.env.VITE_API_URL;
export const ADMIN_SESSION_KEY = 'agua24MonitorSession';

export function managementHeaders(token, extra = {}) {
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

export function accountHome(access) {
  if (access.role === 'ADMIN') return '/water-monitor';
  if (access.role === 'PARTNER') return '/partner-panel';
  return '/home-dashboard';
}

export function clearAdminSession() {
  for (const key of [ADMIN_SESSION_KEY, 'agua24MonitorAdmin', 'agua24MonitorAdminUser', 'agua24MonitorAdminPassword']) {
    window.sessionStorage.removeItem(key);
  }
}

export async function managementRequest(path, getToken, options = {}) {
  const token = await getToken({ template: 'aquaqr-api' }).catch(() => null);
  if (!token) throw Object.assign(new Error('Tu sesión ha terminado. Inicia sesión nuevamente.'), { status: 401 });
  const res = await fetch(`${API}${path}`, { ...options,
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
