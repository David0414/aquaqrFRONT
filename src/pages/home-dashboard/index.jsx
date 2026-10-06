import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

const HomeDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    if (!isClerkLoaded || !isSignedIn || !location.state?.walletUpdatedAt) return;

    const {
      balanceCents: nextTotalCents,
      realBalanceCents: nextRealCents,
      bonusBalanceCents: nextBonusCents,
    } = location.state;

    if (
      Number.isFinite(nextTotalCents)
      || Number.isFinite(nextRealCents)
      || Number.isFinite(nextBonusCents)
    ) {
      setDashboard((current) => (
        current
          ? {
              ...current,
              wallet: {
                ...current.wallet,
                ...(Number.isFinite(nextTotalCents)
                  ? {
                      balanceCents: nextTotalCents,
                      totalAvailableCents: nextTotalCents,
                    }
                  : {}),
                ...(Number.isFinite(nextRealCents) ? { realBalanceCents: nextRealCents } : {}),
                ...(Number.isFinite(nextBonusCents) ? { bonusBalanceCents: nextBonusCents } : {}),
              },
            }
          : current
      ));
    }

    fetchDashboard({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClerkLoaded, isSignedIn, location.state?.walletUpdatedAt]);

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

    const onWalletUpdated = (event) => {
      const nextTotalCents = event?.detail?.balanceCents;
      const nextRealCents = event?.detail?.realBalanceCents;
      const nextBonusCents = event?.detail?.bonusBalanceCents;

      if (
        Number.isFinite(nextTotalCents)
        || Number.isFinite(nextRealCents)
        || Number.isFinite(nextBonusCents)
      ) {
        setDashboard((current) => (
          current
            ? {
                ...current,
                wallet: {
                  ...current.wallet,
                  ...(Number.isFinite(nextTotalCents)
                    ? {
                        balanceCents: nextTotalCents,
                        totalAvailableCents: nextTotalCents,
                      }
                    : {}),
                  ...(Number.isFinite(nextRealCents) ? { realBalanceCents: nextRealCents } : {}),
                  ...(Number.isFinite(nextBonusCents) ? { bonusBalanceCents: nextBonusCents } : {}),
                },
              }
            : current
        ));
        return;
      }

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

  const dashboardSelection = dashboard?.selection || { requiredCount: 0, selectedPromotionKeys: [], complete: true };

  const handleRecharge = () => {
    navigate('/balance-recharge');
  };
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
  const selection = dashboardSelection;
  const selectedCount = Number(selection.activePromotionKeys?.length
    ?? dashboard.promotions?.filter((promotion) => promotion.requiresMonthlySelection && promotion.isEnabledForUserThisMonth).length ?? 0);

  return (
    <div className="home-dashboard bg-background">
      <header className="shrink-0 bg-card border-b border-border sticky top-0 z-30">
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

      <main className="home-dashboard-main mx-auto w-full max-w-7xl px-3 py-3 sm:px-5">
        <div className="h-full min-h-0">
          <section className="relative h-full overflow-hidden rounded-3xl bg-sky-50/60 p-2">
            <div className="absolute -left-10 top-10 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl" />
            <div className="absolute right-10 top-8 h-16 w-16 rounded-[38%] bg-amber-200/40 rotate-12 blur-xl" />
            <div className="absolute bottom-0 right-0 h-36 w-36 rounded-full bg-emerald-200/30 blur-3xl" />

            <div className="home-dashboard-grid relative grid h-full min-h-0 gap-3">
              <BalanceCard
                totalBalance={totalBalance / 100}
                realBalance={realBalance / 100}
                bonusBalance={bonusBalance / 100}
                onRecharge={handleRecharge}
                onDispense={handleDispense}
                dispenseLoading={dispenseLoading}
              />

              <div className="home-promotions-card rounded-2xl border border-sky-100 bg-white p-3 shadow-sm">
                <button
                  type="button"
                  onClick={() => navigate('/promotions')}
                  className="flex h-full w-full items-center justify-between gap-2 rounded-xl px-1 py-2 text-left text-[#1E3F7A] transition-colors hover:bg-sky-50"
                >
                  <div>
                    <p className="text-sm font-bold">Promociones y membresías</p>
                    <p className="mt-1 text-xs text-slate-500">{selectedCount}/{selection.requiredCount || 0} promociones activadas · Ver beneficios</p>
                  </div>
                  <Icon name="ArrowRight" size={18} className="shrink-0" />
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
