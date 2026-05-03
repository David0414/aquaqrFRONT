import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import Icon from '../../components/AppIcon';
import PromotionalBanner from '../home-dashboard/components/PromotionalBanner';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

function moneyFromCents(amountCents) {
  return (Number(amountCents || 0) / 100).toFixed(2);
}

export default function PromotionsCenter() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const token = await getToken({ template: CLERK_JWT_TEMPLATE });
        const res = await fetch(`${API}/api/rewards/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) throw new Error(data?.error || 'No se pudo cargar promociones');
        setDashboard(data);
      } catch (error) {
        window.showToast?.(error?.message || 'No se pudo cargar promociones', 'error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [getToken]);

  const displayName = useMemo(() => {
    const base =
      user?.firstName ||
      user?.fullName ||
      user?.username ||
      user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
      'AGUA/24';
    return base.split(' ')[0];
  }, [user]);

  const monthlyProgress = dashboard?.monthlyProgress || {};
  const bonusBalance = Number(dashboard?.wallet?.bonusBalanceCents || 0);
  const activePromotions = (dashboard?.promotions || []).filter((promotion) => promotion.isActive && promotion.key !== 'premium_membership');

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body-sm">Cargando promociones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text-primary">Promociones de {displayName}</p>
            <p className="text-xs text-text-secondary">Beneficios, avance y siguiente recompensa</p>
          </div>
          <button
            onClick={() => navigate('/user-profile-settings')}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors duration-200"
            aria-label="Perfil"
          >
            <Icon name="User" size={20} className="text-text-primary" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Saldo de promociones</p>
              <p className="mt-2 text-3xl font-black text-emerald-600">${moneyFromCents(bonusBalance)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Promociones activas</p>
              <p className="mt-2 text-3xl font-black text-[#1E3F7A]">{activePromotions.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Cashback del mes</p>
              <p className="mt-2 text-3xl font-black text-emerald-600">${moneyFromCents(monthlyProgress?.estimatedCashbackCents)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Puntos del mes</p>
              <p className="mt-2 text-3xl font-black text-sky-700">{monthlyProgress?.points || 0}</p>
            </div>
          </div>
        </section>

        <PromotionalBanner
          promotions={activePromotions}
          monthlyProgress={dashboard?.monthlyProgress}
          welcomeReward={dashboard?.welcomeReward}
          bonusBalanceCents={bonusBalance}
          recentBonusCredits={dashboard?.recentBonusCredits}
        />
      </main>

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
}
