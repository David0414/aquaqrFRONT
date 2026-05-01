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

const WaterFlowNavigationContext = React.createContext({
  requestNavigation: () => true,
  shouldGuardExit: false,
});

export const useWaterFlowNavigation = () => React.useContext(WaterFlowNavigationContext);

export default function WaterFlowLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const {
    lastTx,
    hasActiveSession,
    cancelActiveSession,
    guidedTelemetry,
    telemetry,
  } = useDispenseFlow();
  const [exitPrompt, setExitPrompt] = React.useState({
    open: false,
    targetPath: '/home-dashboard',
    cancelling: false,
  });
  const [recoveredActiveSession, setRecoveredActiveSession] = React.useState(false);

  const isWaterStep = location.pathname.startsWith('/water');
  const hasActiveTx = Boolean(location.state?.tx || lastTx?.status === 'STARTED');
  const hasResumedSession = Boolean(location.state?.fromActiveSession);
  const displayTelemetry = guidedTelemetry || telemetry;
  const currentStageCode = displayTelemetry?.currentStageCode || '00';
  const hasRealTelemetry = Boolean(displayTelemetry?.lastSeenAt);
  const isReleasedIdleSession = hasRealTelemetry && currentStageCode === '00' && !hasActiveTx;
  const shouldGuardExit =
    isWaterStep
    && !isReleasedIdleSession
    && (hasActiveSession || hasActiveTx || hasResumedSession || recoveredActiveSession);

  React.useEffect(() => {
    if (!isWaterStep) return undefined;
    if (!isLoaded || !isSignedIn) return undefined;
    if (hasActiveSession || hasActiveTx || hasResumedSession || recoveredActiveSession) return undefined;

    let cancelled = false;

    const recoverWaterSession = async () => {
      try {
        const token = await getToken({ template: CLERK_JWT_TEMPLATE });
        const res = await fetch(`${API}/api/dispense/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => null);
        if (cancelled || !res.ok || !data?.active) return;

        setRecoveredActiveSession(true);

        const nextPath = data.nextPath || location.pathname;
        if (nextPath && nextPath !== location.pathname) {
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
          return;
        }
      } catch {
        // Si falla la consulta, dejamos que la pantalla actual siga sin interrumpir.
      }
    };

    recoverWaterSession();

    return () => {
      cancelled = true;
    };
  }, [
    getToken,
    hasActiveSession,
    hasActiveTx,
    hasResumedSession,
    isLoaded,
    isSignedIn,
    isWaterStep,
    location.pathname,
    navigate,
    recoveredActiveSession,
  ]);

  React.useEffect(() => {
    if (!isWaterStep) return;
    if (!isReleasedIdleSession) return;
    if (!hasActiveSession && !hasResumedSession && !exitPrompt.open && !location.state?.machineReleased) return;

    setExitPrompt({ open: false, targetPath: '/home-dashboard', cancelling: false });
    navigate('/home-dashboard', {
      replace: true,
      state: {
        machineReleased: true,
        reason: location.state?.reason || 'idle',
      },
    });
  }, [
    exitPrompt.open,
    hasActiveSession,
    hasResumedSession,
    isReleasedIdleSession,
    isWaterStep,
    location.state?.machineReleased,
    location.state?.reason,
    navigate,
  ]);

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
      const data = await cancelActiveSession();

      const refunded = Number(data?.refundedCents || 0) / 100;
      showInfoToast(
        refunded > 0
          ? `Llenado cancelado. Reembolso aplicado: $${refunded.toFixed(2)}.`
          : 'Llenado cancelado. La maquina regreso a espera.'
      );
      navigate('/home-dashboard', {
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
        <WaterFlowNavigationContext.Provider value={{ requestNavigation, shouldGuardExit }}>
          <Outlet />
        </WaterFlowNavigationContext.Provider>
      </main>

      {exitPrompt.open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-warning/10">
                <Icon name="AlertTriangle" size={21} className="text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-text-primary">Flujo iniciado</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Esta maquina ya esta siguiendo el flujo. Para salir, cancela el llenado y enviaremos el reinicio a espera.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" onClick={continueProcess} disabled={exitPrompt.cancelling}>
                Continuar flujo
              </Button>
              <Button variant="destructive" onClick={cancelAndReset} loading={exitPrompt.cancelling}>
                Cancelar llenado
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
