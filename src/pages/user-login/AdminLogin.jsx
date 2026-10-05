import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountAccess } from '../../components/ui/AccountAccess';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { startAdminSession } = useAccountAccess();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/management/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store',
        body: JSON.stringify({ user: username.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'No se pudo iniciar sesión. Intenta nuevamente.');
      if (!data.token || data.role !== 'ADMIN') throw new Error('No se pudo verificar el acceso administrativo.');
      await startAdminSession(data.token);
      setPassword('');
      navigate('/water-monitor', { replace: true });
    } catch (failure) {
      setError(failure instanceof TypeError ? 'No se pudo conectar. Revisa tu conexión e intenta nuevamente.' : failure.message);
    } finally {
      setBusy(false);
    }
  };

  const fieldClass = 'mt-2 h-12 w-full min-w-0 rounded-2xl border border-sky-100 bg-slate-50/70 px-4 text-[16px] outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200';
  return (
    <form onSubmit={submit} className="space-y-4" aria-label="Acceso de administrador">
      <label htmlFor="admin-username" className="block text-sm font-semibold text-slate-700">
        Usuario
        <input id="admin-username" name="username" type="text" autoComplete="username"
          required value={username} disabled={busy} onChange={(event) => setUsername(event.target.value)} className={fieldClass} />
      </label>
      <label htmlFor="admin-password" className="block text-sm font-semibold text-slate-700">
        Contraseña
        <input id="admin-password" name="password" type="password" autoComplete="current-password"
          required value={password} disabled={busy} onChange={(event) => setPassword(event.target.value)} className={fieldClass} />
      </label>
      {error && <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={busy} className="h-12 w-full rounded-2xl bg-[linear-gradient(90deg,#42B9D4_0%,#1E3F7A_100%)] font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60">
        {busy ? 'Verificando acceso…' : 'Entrar al panel de administrador'}
      </button>
    </form>
  );
}
