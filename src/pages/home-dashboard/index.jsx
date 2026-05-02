import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';

import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import BalanceCard from './components/BalanceCard';
import PromotionalBanner from './components/PromotionalBanner';
import WaterDropAvatar from './components/WaterDropAvatar';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';

import Icon from '../../components/AppIcon';
import Agua24Brand from '../../components/Agua24Brand';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

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
  const [dispenseLoading, setDispenseLoading] = useState(false);

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

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
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
    } catch (error) {
      console.error(error);
      window.showToast?.(error.message || 'Error cargando dashboard', 'error');
      setDashboard(null);
    } finally {
      setDashboardLoading(false);
    }
  };

  useEffect(() => {
    if (isClerkLoaded && isSignedIn) {
      fetchDashboard();
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
    const onFocus = () => {
      fetchDashboard();
      if (isClerkLoaded && isSignedIn) {
        pollInputs({ force: true }).catch(() => {});
      }
    };

    const onWalletUpdated = () => {
      fetchDashboard();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('wallet:updated', onWalletUpdated);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('wallet:updated', onWalletUpdated);
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

  if (!isClerkLoaded || !isSignedIn || dashboardLoading || !dashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-body-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const totalBalance = Number(dashboard.wallet?.totalAvailableCents || dashboard.wallet?.balanceCents || 0);
  const realBalance = Number(dashboard.wallet?.realBalanceCents || 0);
  const bonusBalance = Number(dashboard.wallet?.bonusBalanceCents || 0);
  const totalLiters = Number(dashboard.stats?.totalLitersDispensed || 0);
  const activePromotions = (dashboard.promotions || []).filter((promotion) => promotion.isActive && promotion.key !== 'premium_membership');

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
                <p className="text-xs text-text-secondary">Saldo real + bonificacion separados</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceCard
              totalBalance={totalBalance / 100}
              realBalance={realBalance / 100}
              bonusBalance={bonusBalance / 100}
              onRecharge={handleRecharge}
              onDispense={handleDispense}
              dispenseLoading={dispenseLoading}
            />
            <WaterDropAvatar
              title="Promociones activas"
              subtitle={`${activePromotions.length} promociones disponibles y ${moneyFromCents(dashboard.bonusSummary?.totalBonusEarnedCents)} MXN ganados en bonificacion`}
            />
          </div>

          <PromotionalBanner
            promotions={activePromotions}
            monthlyProgress={dashboard.monthlyProgress}
            recentBonusCredits={dashboard.recentBonusCredits}
          />

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Saldo de regalo</p>
              <p className="mt-2 text-2xl font-black text-[#0F9F6E]">${moneyFromCents(bonusBalance)}</p>
              <p className="mt-1 text-sm text-text-secondary">Disponible para usar en dispensados.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Bonificacion ganada</p>
              <p className="mt-2 text-2xl font-black text-[#1E3F7A]">
                ${moneyFromCents(dashboard.bonusSummary?.totalBonusEarnedCents)}
              </p>
              <p className="mt-1 text-sm text-text-secondary">{dashboard.bonusSummary?.bonusRewardsCount || 0} recompensas acreditadas.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Consumo del mes</p>
              <p className="mt-2 text-2xl font-black text-[#42B9D4]">{Number(dashboard.monthlyProgress?.liters || 0).toFixed(1)} L</p>
              <p className="mt-1 text-sm text-text-secondary">{Number(dashboard.monthlyProgress?.garrafones || 0).toFixed(2)} garrafones equivalentes.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Puntos del mes</p>
              <p className="mt-2 text-2xl font-black text-[#E59E0D]">{dashboard.monthlyProgress?.points || 0}</p>
              <p className="mt-1 text-sm text-text-secondary">{dashboard.monthlyProgress?.pointsLabel || 'Sin beneficio'}</p>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Un vistazo general</p>
                <h2 className="mt-2 text-2xl font-black text-text-primary">Tu resumen de recompensas</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/user-profile-settings')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#1E3F7A]"
              >
                Ver detalle completo <Icon name="ArrowRight" size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-text-primary">Cashback mensual estimado</p>
                <p className="mt-2 text-3xl font-black text-[#0F9F6E]">
                  ${moneyFromCents(dashboard.monthlyProgress?.estimatedCashbackCents)}
                </p>
                <p className="mt-2 text-sm text-text-secondary">{dashboard.monthlyProgress?.cashbackLabel}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-text-primary">Saldo extra por puntos</p>
                <p className="mt-2 text-3xl font-black text-[#42B9D4]">
                  ${moneyFromCents(dashboard.monthlyProgress?.estimatedPointsBonusCents)}
                </p>
                <p className="mt-2 text-sm text-text-secondary">
                  {dashboard.monthlyProgress?.bonusPercent || 0}% sobre tu consumo completado del mes.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-text-primary">Actividad acumulada</p>
                <p className="mt-2 text-3xl font-black text-[#1E3F7A]">{totalLiters.toFixed(0)} L</p>
                <p className="mt-2 text-sm text-text-secondary">{dashboard.stats?.transactionCount || 0} movimientos registrados.</p>
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
