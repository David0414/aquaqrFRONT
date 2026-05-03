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
            <p className="text-xs text-text-secondary">Qué haces, qué ganas y cuándo lo recibes</p>
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
        <section className="relative overflow-hidden rounded-[2.2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(135deg,_#ffffff_0%,_#f5fbff_55%,_#ffffff_100%)] p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
          <div className="absolute -left-8 top-10 h-20 w-20 rounded-full bg-sky-200/40 blur-xl" />
          <div className="absolute right-8 top-5 h-16 w-16 rounded-[38%] bg-amber-200/40 rotate-12 blur-xl" />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Lo importante hoy</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Tus promociones sin enredos</h1>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.7rem] bg-white/90 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-700">Saldo de promociones</p>
                <p className="mt-2 text-3xl font-black text-emerald-600">${moneyFromCents(bonusBalance)}</p>
              </div>
              <div className="rounded-[1.7rem] bg-white/90 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-700">Cashback que llevas</p>
                <p className="mt-2 text-3xl font-black text-emerald-600">${moneyFromCents(monthlyProgress?.estimatedCashbackCents)}</p>
                <p className="mt-1 text-sm text-slate-500">Se deposita al final del mes.</p>
              </div>
              <div className="rounded-[1.7rem] bg-white/90 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-700">Puntos de este mes</p>
                <p className="mt-2 text-3xl font-black text-sky-700">{monthlyProgress?.points || 0}</p>
                <p className="mt-1 text-sm text-slate-500">{activePromotions.length} promociones activas.</p>
              </div>
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
