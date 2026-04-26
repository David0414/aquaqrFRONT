// src/pages/water-dispensing-control/WaterFlowLayout.jsx
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import { showErrorToast, showInfoToast } from '../../components/ui/NotificationToast';
import { useDispenseFlow } from './FlowProvider';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

export default function WaterFlowLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const { telemetry } = useDispenseFlow();
  const [exitPrompt, setExitPrompt] = React.useState({
    open: Boolean(location.state?.fromActiveSession),
    targetPath: '/home-dashboard',
    cancelling: false,
  });

  const currentStageCode = telemetry?.currentStageCode || '00';
  const isGuardedStep =
    location.pathname === '/water/position-down'
    || location.pathname === '/water/position-up';
  const shouldGuardExit = isGuardedStep && currentStageCode !== '00';

  const requestNavigation = (path = '/home-dashboard') => {
    if (!shouldGuardExit) return true;
    setExitPrompt({ open: true, targetPath: path, cancelling: false });
    return false;
  };

  const continueProcess = () => {
    setExitPrompt((current) => ({ ...current, open: false, cancelling: false }));
  };

  const cancelAndReset = async () => {
    try {
      setExitPrompt((current) => ({ ...current, cancelling: true }));
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      const res = await fetch(`${API}/api/dispense/active/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'No se pudo cancelar el proceso');
      }

      showInfoToast('Proceso cancelado. La maquina regreso a espera.');
      navigate(exitPrompt.targetPath || '/home-dashboard', {
        replace: true,
        state: { machineReleased: true, reason: 'user_cancelled' },
      });
    } catch (error) {
      showErrorToast(error?.message || 'No se pudo cancelar el proceso');
      setExitPrompt((current) => ({ ...current, cancelling: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (requestNavigation('/home-dashboard')) navigate(-1);
            }}
            className="h-10 w-10"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-text-primary">Dispensación de Agua</h1>
            <p className="text-sm text-text-secondary">Flujo guiado</p>
          </div>
          <div className="h-10 w-10" />
        </div>
      </header>

      <main className="px-4 py-6 pb-24">
        <Outlet />
      </main>

      {exitPrompt.open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-warning/10">
                <Icon name="AlertTriangle" size={21} className="text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-text-primary">Proceso activo</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Esta maquina sigue reservada para tu proceso. Puedes continuar o cancelar para reiniciar la maquina a espera.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={continueProcess} disabled={exitPrompt.cancelling}>
                Continuar proceso
              </Button>
              <Button variant="destructive" onClick={cancelAndReset} loading={exitPrompt.cancelling}>
                Cancelar y reiniciar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <BottomTabNavigation onNavigate={requestNavigation} />
      <NotificationToast />
    </div>
  );
}
