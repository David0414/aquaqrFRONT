import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAccountAccess } from '../../components/ui/AccountAccess';
import { accountHome } from '../../lib/management';

function pendingQr() {
  try {
    const raw = window.sessionStorage.getItem('agua24.pendingDispense')
      || window.localStorage.getItem('pendingDispense');
    if (!raw) return null;
    const { machineId, machineLocation, hardwareId, at } = JSON.parse(raw);
    if (!machineId || !Number.isFinite(Number(at)) || Date.now() - Number(at) > 10 * 60 * 1000) return null;
    return { machineId, machineLocation: machineLocation || 'Desconocida', hardwareId, fromQR: true };
  } catch { return null; }
}

export default function AccountRedirect() {
  const { access } = useAccountAccess();
  const pending = access.role === 'CUSTOMER' ? pendingQr() : null;
  if (pending) return <Navigate to="/water/choose" state={pending} replace />;
  return <Navigate to={accountHome(access)} replace />;
}
