import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Navigate, useLocation } from 'react-router-dom';
import Button from './Button';
import { ADMIN_SESSION_KEY, managementRequest } from '../../lib/management';

const ManagementContext = createContext(null);
export const useManagementAccess = () => useContext(ManagementContext);

export default function ManagementGuard({ children }) {
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const [access, setAccess] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const adminSession = window.sessionStorage.getItem(ADMIN_SESSION_KEY);

  useEffect(() => {
    if (!isLoaded || (!isSignedIn && !adminSession)) return undefined;
    let cancelled = false;
    setAccess(null);
    setError('');
    managementRequest('/api/management/me', getToken).then((data) => {
      if (!cancelled) setAccess({ ...data, owner: userId || adminSession });
    }).catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [getToken, userId, isLoaded, isSignedIn, adminSession, retry]);

  if (!isLoaded) return <div className="p-8 text-center">Cargando acceso…</div>;
  if (!isSignedIn && !adminSession) return <Navigate to={`/user-login?${location.pathname === '/partner-panel' ? 'partner' : 'monitor'}=1`} replace />;
  if (error) return (
    <div className="mx-auto max-w-md space-y-4 p-8 text-center">
      <p role="alert">{error}</p>
      <Button onClick={() => setRetry((value) => value + 1)}>Reintentar</Button>
      <a className="block text-primary underline" href="/user-login?monitor=1">Volver al acceso</a>
    </div>
  );
  if (!access || access.owner !== (userId || adminSession)) return <div className="p-8 text-center">Verificando permisos…</div>;
  if (!access.canManage) return (
    <div className="mx-auto max-w-md space-y-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Acceso de socio pendiente</h1>
      <p>{access.active ? 'El administrador debe habilitar tu cuenta como socio para acceder a tus máquinas.' : 'Tu acceso al panel está suspendido. Contacta al administrador.'}</p>
      <a className="text-primary underline" href="/home-dashboard">Volver a Inicio</a>
    </div>
  );
  return <ManagementContext.Provider value={access}>{children}</ManagementContext.Provider>;
}
