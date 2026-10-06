import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import Button from './Button';
import StartupStatus from '../StartupStatus';
import PartnerAccessNotice from './PartnerAccessNotice';
import { accountHome, clearAdminSession, getAdminSession, saveAdminSession, managementRequest } from '../../lib/management';

const AccountContext = createContext(null);
export const useAccountAccess = () => useContext(AccountContext);

export function AccountAccessProvider({ children }) {
  const { getToken, userId, isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [adminSession, setAdminSession] = useState(getAdminSession);
  const previousAccount = useRef(undefined);
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState(null);
  const [revision, setRevision] = useState(0);
  const owner = adminSession ? `admin:${adminSession}` : isSignedIn ? userId : null;

  useEffect(() => {
    const syncSession = () => setAdminSession(getAdminSession());
    window.addEventListener('agua24-admin-session', syncSession);
    // Discard credentials saved by older versions without an explicit admin login.
    if (!getAdminSession()) clearAdminSession();
    return () => window.removeEventListener('agua24-admin-session', syncSession);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    // A new email account must never inherit an administrator session.
    if (userId && previousAccount.current !== userId) clearAdminSession();
    previousAccount.current = userId || null;
  }, [userId, isLoaded]);

  useEffect(() => {
    setResult(null);
    setFailure(null);
    if (!owner || (!adminSession && !isLoaded)) return undefined;
    let cancelled = false;
    managementRequest('/api/management/me', getToken).then((access) => {
      if (!cancelled) setResult({ owner, access });
    }).catch((error) => {
      if (!cancelled) setFailure({ owner, message: error.message });
    });
    return () => { cancelled = true; };
  }, [getToken, owner, adminSession, isLoaded, revision]);

  const access = owner && result?.owner === owner ? result.access : null;
  const error = owner && failure?.owner === owner ? failure.message : '';
  const startAdminSession = async (token) => {
    if (isSignedIn) await signOut();
    saveAdminSession(token);
    setAdminSession(token);
  };
  const logout = async () => {
    clearAdminSession();
    setAdminSession(null);
    if (isSignedIn) await signOut();
  };
  return (
    <AccountContext.Provider value={{ access, error, isLoaded: Boolean(adminSession) || isLoaded,
      isSignedIn: Boolean(adminSession) || isSignedIn, startAdminSession, logout,
      retry: () => setRevision((value) => value + 1) }}>
      {children}
    </AccountContext.Provider>
  );
}

export function AccountGuard({ children, roles }) {
  const { access, error, isLoaded, isSignedIn, retry, logout } = useAccountAccess();
  const loginPath = roles?.includes('ADMIN') ? '/user-login?panel=1&access=admin'
    : roles?.includes('PARTNER') ? '/partner-login' : '/user-login';
  if (!isLoaded) return <StartupStatus />;
  if (!isSignedIn) return <Navigate to={loginPath} replace />;
  if (error) return (
    <div className="mx-auto max-w-md space-y-4 p-8 text-center">
      <p role="alert">{error}</p>
      <Button onClick={retry}>Reintentar</Button>
      <Button variant="outline" onClick={logout}>Cerrar sesión</Button>
    </div>
  );
  if (!access) return <StartupStatus />;
  if (roles?.includes('PARTNER') && access.role === 'CUSTOMER') return <PartnerAccessNotice onRetry={retry} onLogout={logout} />;
  if (roles && !roles.includes(access.role)) return <Navigate to={accountHome(access)} replace />;
  if (roles && access.role !== 'CUSTOMER' && !access.canManage) return (
    <div className="mx-auto max-w-md space-y-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Acceso al panel suspendido</h1>
      <p>Contacta al administrador para reactivar tu acceso.</p>
      <Button variant="outline" onClick={logout}>Cerrar sesión</Button>
    </div>
  );
  return children;
}
