import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import Agua24Brand from '../Agua24Brand';
import Button from './Button';

export default function PartnerAccessNotice({ onRetry, onLogout }) {
  const { user } = useUser();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const email = user?.primaryEmailAddress?.emailAddress;
  const switchAccount = async () => {
    setBusy(true);
    setError('');
    try {
      await onLogout();
      navigate('/partner-login', { replace: true });
    } catch {
      setError('No se pudo cerrar la sesión. Intenta nuevamente.');
    } finally { setBusy(false); }
  };

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-sky-50 px-4 py-8">
      <section className="w-full max-w-md rounded-[28px] border border-sky-100 bg-white p-6 text-center shadow-lg" aria-labelledby="partner-access-title">
        <Agua24Brand className="mx-auto mb-6 h-12" />
        <h1 id="partner-access-title" className="text-2xl font-bold text-[#12356b]">Tu cuenta aún no está habilitada como socio</h1>
        {email && <p className="mt-3 break-words text-sm font-semibold text-[#1E3F7A]">{email}</p>}
        <p className="mt-4 text-sm leading-6 text-slate-600">
          Esta cuenta tiene acceso de cliente. Para administrar tu máquina, el administrador debe habilitar este correo en Socios y asignarte la máquina.
        </p>
        <div className="mt-6 space-y-3">
          <Button fullWidth disabled={busy} onClick={onRetry}>Ya me habilitaron, verificar acceso</Button>
          <Button fullWidth variant="outline" loading={busy} onClick={switchAccount}>Entrar con otra cuenta</Button>
          <Button fullWidth variant="link" disabled={busy} onClick={() => navigate('/home-dashboard', { replace: true })}>Continuar como cliente</Button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </section>
    </main>
  );
}
