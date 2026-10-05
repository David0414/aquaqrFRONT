import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import Button from './Button';
import StartupStatus from '../StartupStatus';
import { accountHome, clearAdminSession, managementRequest } from '../../lib/management';

const AccountContext = createContext(null);
export const useAccountAccess = () => useContext(AccountContext);

export function AccountAccessProvider({ children }) {
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    clearAdminSession();
    setResult(null);
    setFailure(null);
    if (!isLoaded || !isSignedIn) return undefined;
    let cancelled = false;
    managementRequest('/api/management/me', getToken).then((access) => {
      if (!cancelled) setResult({ owner: userId, access });
    }).catch((error) => {
      if (!cancelled) setFailure({ owner: userId, message: error.message });
    });
    return () => { cancelled = true; };
  }, [getToken, userId, isLoaded, isSignedIn, revision]);

  const access = isSignedIn && result?.owner === userId ? result.access : null;
  const error = isSignedIn && failure?.owner === userId ? failure.message : '';
  return (
    <AccountContext.Provider value={{ access, error, isLoaded, isSignedIn,
      retry: () => setRevision((value) => value + 1) }}>
      {children}
    </AccountContext.Provider>
  );
}

export function AccountGuard({ children, roles }) {
  const { access, error, isLoaded, isSignedIn, retry } = useAccountAccess();
  const { signOut } = useClerk();
  if (!isLoaded) return <StartupStatus />;
  if (!isSignedIn) return <Navigate to="/user-login" replace />;
  if (error) return (
    <div className="mx-auto max-w-md space-y-4 p-8 text-center">
      <p role="alert">{error}</p>
      <Button onClick={retry}>Reintentar</Button>
      <Button variant="outline" onClick={() => signOut({ redirectUrl: '/user-login' })}>Cerrar sesión</Button>
    </div>
  );
  if (!access) return <StartupStatus />;
  if (roles && !roles.includes(access.role)) return <Navigate to={accountHome(access)} replace />;
  if (roles && access.role !== 'CUSTOMER' && !access.canManage) return (
    <div className="mx-auto max-w-md space-y-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Acceso al panel suspendido</h1>
      <p>Contacta al administrador para reactivar tu acceso.</p>
      <Button variant="outline" onClick={() => signOut({ redirectUrl: '/user-login' })}>Cerrar sesión</Button>
    </div>
  );
  return children;
}
