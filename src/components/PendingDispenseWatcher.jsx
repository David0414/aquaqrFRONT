// src/components/PendingDispenseWatcher.jsx
import React from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

/**
 * Reanuda el flujo hacia /water-dispensing-control si el usuario
 * se acaba de loguear y existe una intención guardada en localStorage.
 */
export default function PendingDispenseWatcher() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const raw = localStorage.getItem('pendingDispense');
    if (!raw) return;

    localStorage.removeItem('pendingDispense');
    try {
      const { machineId, machineLocation } = JSON.parse(raw);
      if (machineId) {
        navigate('/water-dispensing-control', {
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

  return null;
}
