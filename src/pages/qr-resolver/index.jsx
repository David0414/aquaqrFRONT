// src/pages/qr-resolver/index.jsx
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import MachineBusyAlert from '../water-dispensing-control/components/MachineBusyAlert';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

const QRResolver = () => {
  const nav = useNavigate();
  const loc = useLocation();
  const { getToken, isLoaded, isSignedIn } = useAuth();

  const [state, setState] = React.useState({ phase: 'checking', msg: '' });
  const [machineBusyError, setMachineBusyError] = React.useState(null);

  const sp = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const m = sp.get('m');
  const ts = sp.get('ts');
  const sig = sp.get('sig');
  const error = sp.get('error');

  React.useEffect(() => {
    if (error) {
      setState({ phase: 'error', msg: 'QR invalido o expirado' });
      return;
    }
    if (!m || !sig) {
      setState({ phase: 'error', msg: 'Faltan parametros del QR' });
      return;
    }

    const qs = new URLSearchParams({ m, sig, ...(ts ? { ts } : {}) }).toString();
    fetch(`/api/qr/resolve?${qs}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data?.ok) {
          setState({ phase: 'error', msg: data?.error || 'No se pudo validar el QR' });
          return;
        }
        setState({
          phase: 'validated',
          machineId: data.machineId,
          machineLocation: data.machineLocation || 'Desconocida',
        });
      })
      .catch(() => setState({ phase: 'error', msg: 'Error de red al validar QR' }));
  }, [m, sig, ts, error]);

  React.useEffect(() => {
    if (state.phase !== 'validated' || !isLoaded) return undefined;

    if (!isSignedIn) {
      localStorage.setItem(
        'pendingDispense',
        JSON.stringify({ machineId: state.machineId, machineLocation: state.machineLocation, at: Date.now() })
      );
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`;
      return undefined;
    }

    let cancelled = false;

    const reserveAndContinue = async () => {
      try {
        const token = await getToken({ template: CLERK_JWT_TEMPLATE });
        const res = await fetch(`${API}/api/dispense/demo/control`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'qr_inicio',
            machineId: state.machineId,
            machineLocation: state.machineLocation,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.status === 423 && data?.error === 'MACHINE_BUSY') {
          const err = new Error(data?.message || 'Esta maquina esta en uso por otro usuario');
          err.code = 'MACHINE_BUSY';
          err.expiresAt = data?.expiresAt;
          err.isOwnLock = data?.isOwnLock;
          setMachineBusyError(err);
          return;
        }

        if (!res.ok) {
          setState({ phase: 'error', msg: data?.detail || data?.error || 'No se pudo iniciar el flujo' });
          return;
        }

        nav('/water/choose', {
          state: { machineId: state.machineId, machineLocation: state.machineLocation, fromQR: true },
          replace: true,
        });
      } catch {
        if (!cancelled) setState({ phase: 'error', msg: 'Error de red al iniciar el flujo' });
      }
    };

    reserveAndContinue();

    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, nav, state]);

  if (state.phase === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <Icon name="Loader2" className="animate-spin" />
          <span>Validando QR...</span>
        </div>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-text-primary font-medium">{state.msg}</p>
        <div className="flex gap-2">
          <Button asChild><Link to="/qr-scanner-landing">Abrir escaner interno</Link></Button>
          <Button variant="ghost" asChild><Link to="/home-dashboard">Ir al inicio</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-text-secondary">
        <Icon name="Loader2" className="animate-spin" />
        <span>Enrutando al dispensador...</span>
      </div>
      <MachineBusyAlert
        error={machineBusyError}
        onBackHome={() => nav('/home-dashboard', { replace: true })}
      />
    </div>
  );
};

export default QRResolver;
