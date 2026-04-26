// src/pages/home-dashboard/index.jsx
import React, { useState, useEffect, useMemo } from 'react';
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

const HomeDashboard = () => {
  const navigate = useNavigate();

  // Clerk
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const { balanceCents, setTelemetryEnabled, pollInputs } = useDispenseFlow();

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

  // Saldo real
  const [walletBalanceCents, setWalletBalanceCents] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [dispenseLoading, setDispenseLoading] = useState(false);

  // Traer saldo real
  const fetchWallet = async () => {
    try {
      setWalletLoading(true);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      if (!token) throw new Error('No se pudo obtener token de sesión');

      const res = await fetch(`${API}/api/me/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo obtener el saldo');
      const data = await res.json();
      setWalletBalanceCents(Number(data.balanceCents ?? 0));
    } catch (e) {
      console.error(e);
      window.showToast?.(e.message || 'Error cargando saldo', 'error');
      setWalletBalanceCents(0);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    if (isClerkLoaded && isSignedIn) fetchWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClerkLoaded, isSignedIn]);

  useEffect(() => {
    if (!Number.isFinite(balanceCents)) return;
    setWalletBalanceCents(balanceCents);
    setWalletLoading(false);
  }, [balanceCents]);

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
      fetchWallet();
      if (isClerkLoaded && isSignedIn) {
        pollInputs({ force: true }).catch(() => {});
      }
    };
    const onWalletUpdated = (event) => {
      const nextBalanceCents = Number(event?.detail?.balanceCents);
      if (Number.isFinite(nextBalanceCents)) {
        setWalletBalanceCents(nextBalanceCents);
        setWalletLoading(false);
        return;
      }
      fetchWallet();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('wallet:updated', onWalletUpdated);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('wallet:updated', onWalletUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClerkLoaded, isSignedIn, pollInputs]);

  // Navegaciones
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
      }
    });
  };
  const handleViewAllTransactions = () => navigate('/transaction-history');

  // Loading
  if (!isClerkLoaded || !isSignedIn || walletLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-body-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const balanceMXN = (walletBalanceCents || 0) / 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Icon name="Droplets" size={24} className="text-primary" />
              </div>
              <div>
                <Agua24Brand className="h-8" showTagline={false} />
                <p className="text-caption text-text-secondary">¡Hola, {displayName}!</p>
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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <div className="space-y-6">
          {/* Balance + Gota */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceCard
              balance={balanceMXN}
              onRecharge={handleRecharge}
              onDispense={handleDispense}
              dispenseLoading={dispenseLoading}
            />
            <WaterDropAvatar title="Tu gota AGUA/24" />
          </div>

          {/* Banners promocionales (se mantienen) */}
          <PromotionalBanner />

          {/* Grid de contenido futuro */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* contenido adicional aquí */}
          </div>
        </div>
      </main>

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
};

export default HomeDashboard;
