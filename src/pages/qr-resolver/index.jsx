// src/pages/qr-resolver/index.jsx
import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const QRResolver = () => {
  const nav = useNavigate();
  const loc = useLocation();
  const { isLoaded, isSignedIn } = useAuth();

  const [state, setState] = React.useState({ phase: 'checking', msg: '' });

  const sp = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const m = sp.get('m');
  const ts = sp.get('ts');
  const sig = sp.get('sig');
  const error = sp.get('error');

  React.useEffect(() => {
    if (error) {
      setState({ phase: 'error', msg: 'QR inválido o expirado' });
      return;
    }
    if (!m || !sig) {
      setState({ phase: 'error', msg: 'Faltan parámetros del QR' });
      return;
    }

    const qs = new URLSearchParams({ m, sig, ...(ts ? { ts } : {}) }).toString();
    fetch(`/api/qr/resolve?${qs}`)
      .then(r => r.json())
      .then(data => {
        if (!data?.ok) {
          setState({ phase: 'error', msg: data?.error || 'No se pudo validar el QR' });
          return;
        }
        setState({
          phase: 'validated',
          machineId: data.machineId,
          machineLocation: data.machineLocation || 'Desconocida'
        });
      })
      .catch(() => setState({ phase: 'error', msg: 'Error de red al validar QR' }));
  }, [m, sig, ts, error]);

  // Si ya validamos el QR, decidimos según login
  React.useEffect(() => {
    if (state.phase !== 'validated' || !isLoaded) return;

    if (!isSignedIn) {
      // Guardamos intención y mandamos a sign-in
      localStorage.setItem(
        'pendingDispense',
        JSON.stringify({ machineId: state.machineId, machineLocation: state.machineLocation, at: Date.now() })
      );
      // Clerk: redirigir de vuelta aquí tras login
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`;
      return;
    }

    // Logueado -> manda al control
    nav('/water-dispensing-control', {
      state: { machineId: state.machineId, machineLocation: state.machineLocation, fromQR: true },
      replace: true
    });
  }, [state, isLoaded, isSignedIn, nav]);

  if (state.phase === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <Icon name="Loader2" className="animate-spin" />
          <span>Validando QR…</span>
        </div>
      </div>
    );
  }

  if (state.phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-text-primary font-medium">{state.msg}</p>
        <div className="flex gap-2">
          <Button asChild><Link to="/qr/scanner-landing">Abrir escáner interno</Link></Button>
          <Button variant="ghost" asChild><Link to="/">Ir al inicio</Link></Button>
        </div>
      </div>
    );
  }

  // validated -> en breve redirige (spinner breve)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-text-secondary">
        <Icon name="Loader2" className="animate-spin" />
        <span>Enrutando al dispensador…</span>
      </div>
    </div>
  );
};

export default QRResolver;
