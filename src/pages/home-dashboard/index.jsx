import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';

import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import BalanceCard from './components/BalanceCard';
import PromotionalBanner from './components/PromotionalBanner';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';

import Icon from '../../components/AppIcon';
import Agua24Brand from '../../components/Agua24Brand';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';
const DASHBOARD_CACHE_KEY = 'agua24-home-dashboard-cache';

function moneyFromCents(amountCents) {
  return (Number(amountCents || 0) / 100).toFixed(2);
}

function clampPercent(value, max) {
  if (!max) return 0;
  return Math.max(0, Math.min(100, (Number(value || 0) / Number(max)) * 100));
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
  const activePromotions = (dashboard.promotions || []).filter((promotion) => promotion.isActive && promotion.key !== 'premium_membership');
  const currentMonthPoints = dashboard.monthlyProgress?.points || 0;
  const currentMonthGarrafones = Number(dashboard.monthlyProgress?.garrafones || 0);
  const nextPointsGoal = currentMonthPoints >= 500 ? 1000 : currentMonthPoints >= 200 ? 500 : 200;
  const pointsPercent = clampPercent(currentMonthPoints, nextPointsGoal);
  const cashbackPercent = clampPercent(currentMonthGarrafones, 10);

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
          <section className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.15),_transparent_32%),linear-gradient(135deg,_#ffffff_0%,_#f1f9ff_42%,_#f8fcff_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
            <div className="absolute -right-12 -top-10 h-36 w-36 rounded-full bg-sky-200/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-emerald-200/30 blur-2xl" />

            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
              <div className="grid grid-cols-1 gap-6">
            <BalanceCard
              totalBalance={totalBalance / 100}
              realBalance={realBalance / 100}
              bonusBalance={bonusBalance / 100}
              onRecharge={handleRecharge}
              onDispense={handleDispense}
              dispenseLoading={dispenseLoading}
            />

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Saldo de promociones</p>
                    <p className="mt-2 text-3xl font-black text-emerald-600">${moneyFromCents(bonusBalance)}</p>
                    <p className="mt-1 text-sm text-slate-500">Ya disponible en tu saldo.</p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Puntos actuales</p>
                    <p className="mt-2 text-3xl font-black text-sky-700">{currentMonthPoints}</p>
                    <p className="mt-1 text-sm text-slate-500">Meta siguiente: {nextPointsGoal}</p>
                  </div>
                  <div className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Bonos recibidos</p>
                    <p className="mt-2 text-3xl font-black text-indigo-700">${moneyFromCents(dashboard.bonusSummary?.totalBonusEarnedCents)}</p>
                    <p className="mt-1 text-sm text-slate-500">{dashboard.bonusSummary?.bonusRewardsCount || 0} bonos aplicados.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-sm backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Avance del mes</p>
                <h2 className="mt-2 text-2xl font-black text-slate-900">Lo que ya llevas</h2>

                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Cashback</p>
                        <p className="mt-1 text-sm text-slate-500">{currentMonthGarrafones.toFixed(1)} de 10 garrafones</p>
                      </div>
                      <Icon name="BadgePercent" size={18} className="text-emerald-600" />
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,_#10b981_0%,_#2dd4bf_100%)]" style={{ width: `${cashbackPercent}%` }} />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Puntos</p>
                        <p className="mt-1 text-sm text-slate-500">{currentMonthPoints} de {nextPointsGoal} puntos</p>
                      </div>
                      <Icon name="Sparkles" size={18} className="text-sky-700" />
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full rounded-full bg-[linear-gradient(90deg,_#2563eb_0%,_#22d3ee_100%)]" style={{ width: `${pointsPercent}%` }} />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/user-profile-settings')}
                    className="flex w-full items-center justify-between rounded-2xl bg-[#1E3F7A] px-4 py-4 text-left text-white shadow-sm transition-colors duration-200 hover:bg-[#17325f]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white/80">Mas detalle</p>
                      <p className="mt-1 text-lg font-black">Ver tu cuenta</p>
                    </div>
                    <Icon name="ArrowRight" size={18} className="text-white" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <PromotionalBanner
            promotions={activePromotions}
            monthlyProgress={dashboard.monthlyProgress}
            welcomeReward={dashboard.welcomeReward}
            bonusBalanceCents={bonusBalance}
            recentBonusCredits={dashboard.recentBonusCredits}
          />

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Resumen rapido</p>
                <h2 className="mt-2 text-2xl font-black text-text-primary">Lo importante de tu mes</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  Un resumen corto para entender tu avance sin complicarlo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/user-profile-settings')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E3F7A]"
              >
                Ver estadisticas <Icon name="ArrowRight" size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(16,185,129,0.08)_0%,_rgba(255,255,255,1)_100%)] p-5">
                <p className="text-sm font-semibold text-text-primary">Consumo del mes</p>
                <p className="mt-2 text-3xl font-black text-[#0F9F6E]">
                  {currentMonthGarrafones.toFixed(1)} garrafones
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Base para tu cashback mensual.
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,_rgba(14,165,233,0.08)_0%,_rgba(255,255,255,1)_100%)] p-5">
                <p className="text-sm font-semibold text-text-primary">Puntos del mes</p>
                <p className="mt-2 text-3xl font-black text-[#42B9D4]">
                  {currentMonthPoints}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  Nivel actual: {dashboard.monthlyProgress?.pointsLabel || 'Sin beneficio'}.
                </p>
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
