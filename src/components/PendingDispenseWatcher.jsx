// src/components/PendingDispenseWatcher.jsx
import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccountAccess } from './ui/AccountAccess';
import { canResumeDispense, resumedDispenseState } from '../lib/dispenseSession.mjs';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';
const PENDING_DISPENSE_STORAGE_KEY = 'agua24.pendingDispense';
const ACTIVE_WATER_MACHINE_KEY = 'agua24.activeWaterMachine';
const PENDING_DISPENSE_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Reanuda el flujo hacia /water/choose si el usuario
 * se acaba de loguear y existe una intención guardada en localStorage.
 */
export default function PendingDispenseWatcher() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const { access } = useAccountAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const managementAccess = location.pathname.startsWith('/partner-login')
    || location.pathname === '/partner-panel'
    || location.pathname === '/water-monitor'
    || (location.pathname.startsWith('/user-login') && new URLSearchParams(location.search).get('panel') === '1');
  const resumeKeyRef = React.useRef('');
  const returnedFromLoginRef = React.useRef(false);

  React.useEffect(() => {
    if (isLoaded && !isSignedIn) returnedFromLoginRef.current = true;
  }, [isLoaded, isSignedIn]);

  React.useEffect(() => {
    resumeKeyRef.current = '';
  }, [userId]);

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn || access?.role !== 'CUSTOMER' || managementAccess) return;

    const raw =
      window.sessionStorage.getItem(PENDING_DISPENSE_STORAGE_KEY)
      || window.localStorage.getItem('pendingDispense');
    if (!raw) return;

    window.sessionStorage.removeItem(PENDING_DISPENSE_STORAGE_KEY);
    window.localStorage.removeItem('pendingDispense');
    const isLoginReturn = returnedFromLoginRef.current
      || location.pathname.startsWith('/user-login')
      || location.pathname.startsWith('/sign-in')
      || location.pathname === '/account-redirect'
      || location.pathname === '/qr-resolver';
    if (!isLoginReturn) return;
    try {
      const { machineId, machineLocation, hardwareId, at } = JSON.parse(raw);
      const createdAt = Number(at);
      if (!Number.isFinite(createdAt) || Date.now() - createdAt > PENDING_DISPENSE_MAX_AGE_MS) {
        return;
      }
      if (machineId) {
        window.sessionStorage.setItem(ACTIVE_WATER_MACHINE_KEY, JSON.stringify({
          machineId,
          machineLocation: machineLocation || 'Desconocida',
          hardwareId,
          at: Date.now(),
        }));
        navigate('/water/choose', {
          state: {
            machineId,
            machineLocation: machineLocation || 'Desconocida',
            hardwareId,
            fromQR: true,
          },
          replace: true,
        });
      }
    } catch {
      // no-op
    }
  }, [isLoaded, isSignedIn, navigate, userId, access?.role, managementAccess, location.pathname]);

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn || access?.role !== 'CUSTOMER' || managementAccess) return undefined;
    const skipResume =
      location.state?.skipAutoDispenseResume
      || location.pathname.startsWith('/water')
      || location.pathname === '/account-redirect'
      || location.pathname === '/partner-panel'
      || location.pathname === '/filling-progress'
      || location.pathname === '/transaction-complete'
      || location.pathname === '/balance-recharge'
      || location.pathname === '/qr-scanner-landing'
      || location.pathname === '/qr-resolver';
    if (skipResume) return undefined;

    let cancelled = false;
    const resumeActiveDispense = async () => {
      try {
        const token = await getToken({ template: CLERK_JWT_TEMPLATE });
        const res = await fetch(`${API}/api/dispense/active`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await res.json().catch(() => null);
        if (cancelled || !res.ok || !canResumeDispense(data)) return;

        const nextPath = '/filling-progress';
        const resumeKey = `${nextPath}:${data.tx?.txId || data.machineId || ''}:${data.stageCode || ''}`;
        if (resumeKeyRef.current === resumeKey) return;
        resumeKeyRef.current = resumeKey;

        window.sessionStorage.setItem(ACTIVE_WATER_MACHINE_KEY, JSON.stringify({
          machineId: data.machineId,
          machineLocation: data.machineLocation || 'Desconocida',
          hardwareId: data.hardwareId,
          at: Date.now(),
        }));

        navigate(nextPath, {
          replace: true,
          state: resumedDispenseState(data),
        });
      } catch {
        // no-op: no bloqueamos la app si la consulta de reanudacion falla.
      }
    };

    resumeActiveDispense();
    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, location.pathname, location.state?.skipAutoDispenseResume, navigate, userId, access?.role, managementAccess]);

  return null;
}
