import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccountAccess } from './ui/AccountAccess';
import {
  DISPENSE_BACKGROUND_LIMIT_MS, canResumeDispense, isDispenseRoute, resumedDispenseState,
} from '../lib/dispenseSession.mjs';

const API = import.meta.env.VITE_API_URL;

export default function DispenseSessionBoundary({ children }) {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { access } = useAccountAccess();
  const location = useLocation();
  const navigate = useNavigate();
  const [recovery, setRecovery] = useState(() => isDispenseRoute(location.pathname) ? { key: location.key } : null);
  const currentLocation = useRef(location);
  const hiddenAt = useRef(document.visibilityState === 'hidden' ? Date.now() : null);
  currentLocation.current = location;

  useEffect(() => {
    if (!recovery || !isLoaded || (isSignedIn && !access)) return undefined;
    if (!isSignedIn || access.role !== 'CUSTOMER' || recovery.key !== location.key) {
      setRecovery(null);
      return undefined;
    }

    let cancelled = false;
    let finished = false;
    const controller = new AbortController();
    const finishRecovery = (data) => {
      if (cancelled || finished) return;
      finished = true;
      window.clearTimeout(timeout);
      const hasStartedTransaction = canResumeDispense(data);
      if (!hasStartedTransaction) {
        try {
          sessionStorage.removeItem('agua24.pendingDispense');
          localStorage.removeItem('pendingDispense');
        } catch { /* Storage is optional. */ }
      }
      navigate(hasStartedTransaction ? '/filling-progress' : '/home-dashboard', {
        replace: true,
        state: hasStartedTransaction ? resumedDispenseState(data, location.state?.tx) : { skipAutoDispenseResume: true },
      });
      setRecovery(null);
    };
    const timeout = window.setTimeout(() => {
      finishRecovery();
      controller.abort();
    }, 10000);
    const recover = async () => {
      let data;
      try {
        const token = await getToken({ template: 'aquaqr-api' });
        if (cancelled || finished) return;
        const response = await fetch(`${API}/api/dispense/active`, {
          headers: { Authorization: `Bearer ${token}` }, cache: 'no-store', signal: controller.signal,
        });
        if (response.ok) data = await response.json();
      } catch {
        // A failed check must not revive a stale browser route or QR reservation.
      }
      finishRecovery(data);
    };
    recover();
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [recovery, getToken, isLoaded, isSignedIn, userId, access?.role, location.key, navigate]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || access?.role !== 'CUSTOMER') return undefined;
    if (document.visibilityState === 'hidden') hiddenAt.current ??= Date.now();
    const checkReturn = (force = false) => {
      if (document.visibilityState === 'hidden') return;
      const wasAway = hiddenAt.current !== null && Date.now() - hiddenAt.current >= DISPENSE_BACKGROUND_LIMIT_MS;
      hiddenAt.current = null;
      const current = currentLocation.current;
      if ((force || wasAway) && isDispenseRoute(current.pathname)) setRecovery({ key: current.key });
    };
    const visibilityChanged = () => {
      if (document.visibilityState === 'hidden') hiddenAt.current ??= Date.now();
      else checkReturn();
    };
    const pageHidden = () => { hiddenAt.current ??= Date.now(); };
    const pageShown = (event) => checkReturn(event.persisted);
    document.addEventListener('visibilitychange', visibilityChanged);
    window.addEventListener('pagehide', pageHidden);
    window.addEventListener('pageshow', pageShown);
    checkReturn();
    return () => {
      document.removeEventListener('visibilitychange', visibilityChanged);
      window.removeEventListener('pagehide', pageHidden);
      window.removeEventListener('pageshow', pageShown);
    };
  }, [isLoaded, isSignedIn, userId, access?.role]);

  if (recovery && isSignedIn && access?.role === 'CUSTOMER' && recovery.key === location.key) {
    return <div className="min-h-screen flex items-center justify-center bg-background" role="status">
      <p className="text-text-secondary">Actualizando tu sesión…</p>
    </div>;
  }
  return children;
}
