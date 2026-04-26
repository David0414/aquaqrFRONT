// src/components/PendingDispenseWatcher.jsx
import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

/**
 * Reanuda el flujo hacia /water/choose si el usuario
 * se acaba de loguear y existe una intención guardada en localStorage.
 */
export default function PendingDispenseWatcher() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const raw = localStorage.getItem('pendingDispense');
    if (!raw) return;

    localStorage.removeItem('pendingDispense');
    try {
      const { machineId, machineLocation } = JSON.parse(raw);
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
  }, [isLoaded, isSignedIn, navigate]);

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return undefined;
    const skipResume =
      location.pathname.startsWith('/water')
      || location.pathname === '/filling-progress'
      || location.pathname === '/transaction-complete'
      || location.pathname === '/balance-recharge';
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
  }, [getToken, isLoaded, isSignedIn, location.pathname, navigate]);

  return null;
}
