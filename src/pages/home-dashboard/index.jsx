import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';

import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import BalanceCard from './components/BalanceCard';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';

import Icon from '../../components/AppIcon';
import Agua24Brand from '../../components/Agua24Brand';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';
const DASHBOARD_CACHE_KEY = 'agua24-home-dashboard-cache';

function moneyFromCents(amountCents) {
  return (Number(amountCents || 0) / 100).toFixed(2);
}

const HomeDashboard = () => {
  const navigate = useNavigate();
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const { balanceCents, setTelemetryEnabled, pollInputs } = useDispenseFlow();

  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardRefreshing, setDashboardRefreshing] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [dispenseLoading, setDispenseLoading] = useState(false);
  const hasLoadedDashboardRef = useRef(false);
  const refreshTimeoutRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cached = window.sessionStorage.getItem(DASHBOARD_CACHE_KEY);
      if (!cached) return;
      const parsed = JSON.parse(cached);
      if (parsed?.wallet && parsed?.promotions) {
        setDashboard(parsed);
        setDashboardLoading(false);
        hasLoadedDashboardRef.current = true;
      }
    } catch {
      // Ignorado a proposito
    }
  }, []);

  const displayName = useMemo(() => {
    if (!user) return 'AGUA/24';
    const base =
      user.firstName ||
      user.fullName ||
      user.username ||
      user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
      'AGUA/24';
    return base.split(' ')[0];
  }, [user]);

  const fetchDashboard = async ({ silent = false } = {}) => {
    const shouldKeepCurrentView = silent || hasLoadedDashboardRef.current || Boolean(dashboard);

    try {
      setDashboardError('');
      if (shouldKeepCurrentView) {
        setDashboardRefreshing(true);
      } else {
        setDashboardLoading(true);
      }

      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      if (!token) throw new Error('No se pudo obtener token de sesion');

      const res = await fetch(`${API}/api/rewards/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error || 'No se pudo cargar tu resumen');
      }
      setDashboard(data);
      hasLoadedDashboardRef.current = true;
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data));
      }
    } catch (error) {
      console.error(error);
      const message = error.message || 'Error cargando dashboard';
      setDashboardError(message);
      if (!shouldKeepCurrentView) {
        setDashboard(null);
      } else {
        window.showToast?.(message, 'error');
      }
    } finally {
      setDashboardLoading(false);
      setDashboardRefreshing(false);
    }
  };

  useEffect(() => {
    if (isClerkLoaded && isSignedIn) {
      fetchDashboard({ silent: hasLoadedDashboardRef.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClerkLoaded, isSignedIn]);

  useEffect(() => {
    if (!Number.isFinite(balanceCents) || !dashboard?.wallet) return;
    setDashboard((current) => (
      current
        ? {
            ...current,
            wallet: {
              ...current.wallet,
              balanceCents,
              totalAvailableCents: balanceCents,
            },
          }
        : current
    ));
  }, [balanceCents, dashboard?.wallet]);

  useEffect(() => {
    if (!isClerkLoaded || !isSignedIn) return undefined;

    setTelemetryEnabled(true);
    pollInputs({ force: true }).catch(() => {});

    return () => {
      setTelemetryEnabled(false);
    };
  }, [isClerkLoaded, isSignedIn, pollInputs, setTelemetryEnabled]);

  useEffect(() => {
    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
      refreshTimeoutRef.current = window.setTimeout(() => {
        fetchDashboard({ silent: true });
      }, 250);
    };

    const onVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      scheduleRefresh();
      if (isClerkLoaded && isSignedIn) {
        pollInputs({ force: true }).catch(() => {});
      }
    };

    const onWalletUpdated = () => {
      scheduleRefresh();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('wallet:updated', onWalletUpdated);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('wallet:updated', onWalletUpdated);
      if (refreshTimeoutRef.current) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClerkLoaded, isSignedIn, pollInputs]);

  const handleRecharge = () => navigate('/balance-recharge');
  const handleDispense = () => {
    if (dispenseLoading) return;
    setDispenseLoading(true);
    navigate('/qr-scanner-landing', {
      state: {
        fromDashboard: true,
        action: 'dispense',
        redirectAfterScan: '/water/choose',
        prepareQrOnMount: true,
      },
    });
  };

  if (!isClerkLoaded || !isSignedIn || (dashboardLoading && !dashboard)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-body-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <Icon name="AlertTriangle" size={24} />
          </div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">No pudimos abrir tu dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">
            {dashboardError || 'Intenta de nuevo. Si estas en celular, esta pantalla ya no debe quedarse trabada cargando.'}
          </p>
          <button
            type="button"
            onClick={() => fetchDashboard()}
            className="mt-5 inline-flex items-center justify-center rounded-2xl bg-[#1E3F7A] px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#17325f]"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const totalBalance = Number(dashboard.wallet?.totalAvailableCents || dashboard.wallet?.balanceCents || 0);
  const realBalance = Number(dashboard.wallet?.realBalanceCents || 0);
  const bonusBalance = Number(dashboard.wallet?.bonusBalanceCents || 0);
  const selection = dashboard.selection || { requiredCount: 0, selectedPromotionKeys: [], complete: true };
  const selectedCount = Number(selection.selectedPromotionKeys?.length || 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex min-w-0 items-center gap-3">
              <Agua24Brand
                variant="mark"
                className="h-14 w-auto flex-shrink-0 object-contain"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">Hola, {displayName}</p>
                <p className="text-xs text-text-secondary">
                  {dashboardRefreshing ? 'Actualizando...' : 'Resumen de tu cuenta'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/user-profile-settings')}
              className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center hover:bg-muted/80 transition-colors duration-200"
              aria-label="Perfil de usuario"
            >
              <Icon name="User" size={20} className="text-text-primary" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-[2.25rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(135deg,_#f8fdff_0%,_#eef8ff_52%,_#ffffff_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
            <div className="absolute -left-10 top-10 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl" />
            <div className="absolute right-10 top-8 h-16 w-16 rounded-[38%] bg-amber-200/40 rotate-12 blur-xl" />
            <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-emerald-200/30 blur-3xl" />

            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
              <BalanceCard
                totalBalance={totalBalance / 100}
                realBalance={realBalance / 100}
                bonusBalance={bonusBalance / 100}
                onRecharge={handleRecharge}
                onDispense={handleDispense}
                dispenseLoading={dispenseLoading}
              />

              <div className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Promociones</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Entiende fácil lo que ya ganaste</h2>
                <div className="mt-5 space-y-3">
                  <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,_rgba(16,185,129,0.12),_rgba(45,212,191,0.08))] p-4">
                    <p className="text-sm font-semibold text-slate-700">Saldo de promociones</p>
                    <p className="mt-2 text-3xl font-black text-emerald-600">${moneyFromCents(bonusBalance)}</p>
                  </div>
                  <div className="rounded-[1.6rem] bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">Tus promos del mes</p>
                    <p className="mt-2 text-3xl font-black text-[#1E3F7A]">{selectedCount}/{selection.requiredCount || 0}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {selection.complete ? 'Ya elegiste tus promociones.' : 'Todavia te falta elegir tus promociones.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/promotions')}
                  className="mt-5 flex w-full items-center justify-between rounded-[1.5rem] bg-[#1E3F7A] px-4 py-4 text-left text-white shadow-sm transition-colors duration-200 hover:bg-[#17325f]"
                >
                  <div>
                    <p className="text-sm font-semibold text-white/75">Ver explicado</p>
                    <p className="mt-1 text-lg font-black">Ir a promociones</p>
                  </div>
                  <Icon name="ArrowRight" size={18} className="text-white" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
};

export default HomeDashboard;
