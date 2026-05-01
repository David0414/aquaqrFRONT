// src/components/PendingDispenseWatcher.jsx
import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';
const PENDING_DISPENSE_STORAGE_KEY = 'agua24.pendingDispense';
const PENDING_DISPENSE_MAX_AGE_MS = 10 * 60 * 1000;

/**
 * Reanuda el flujo hacia /water/choose si el usuario
 * se acaba de loguear y existe una intención guardada en localStorage.
 */
export default function PendingDispenseWatcher() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const resumeKeyRef = React.useRef('');

  React.useEffect(() => {
    resumeKeyRef.current = '';
  }, [userId]);

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const raw =
      window.sessionStorage.getItem(PENDING_DISPENSE_STORAGE_KEY)
      || window.localStorage.getItem('pendingDispense');
    if (!raw) return;

    window.sessionStorage.removeItem(PENDING_DISPENSE_STORAGE_KEY);
    window.localStorage.removeItem('pendingDispense');
    try {
      const { machineId, machineLocation, at } = JSON.parse(raw);
      const createdAt = Number(at);
      if (!Number.isFinite(createdAt) || Date.now() - createdAt > PENDING_DISPENSE_MAX_AGE_MS) {
        return;
      }
      if (machineId) {
        navigate('/water/choose', {
          state: {
            machineId,
            machineLocation: machineLocation || 'Desconocida',
            fromQR: true,
          },
          replace: true,
        });
      }
    } catch {
      // no-op
    }
  }, [isLoaded, isSignedIn, navigate, userId]);

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return undefined;
    const skipResume =
      location.pathname.startsWith('/water')
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
        });
        const data = await res.json().catch(() => null);
        if (cancelled || !res.ok || !data?.active) return;

        const nextPath = data.nextPath || '/water/choose';
        const resumeKey = `${nextPath}:${data.tx?.txId || data.machineId || ''}:${data.stageCode || ''}`;
        if (resumeKeyRef.current === resumeKey) return;
        resumeKeyRef.current = resumeKey;

        navigate(nextPath, {
          replace: true,
          state: {
            machineId: data.machineId,
            machineLocation: data.machineLocation || 'Desconocida',
            hardwareId: data.hardwareId,
            selectedLiters: data.selectedLiters,
            tx: data.tx || undefined,
            fromActiveSession: true,
          },
        });
      } catch {
        // no-op: no bloqueamos la app si la consulta de reanudacion falla.
      }
    };

    resumeActiveDispense();
    return () => {
      cancelled = true;
    };
  }, [getToken, isLoaded, isSignedIn, location.pathname, navigate, userId]);

  return null;
}
