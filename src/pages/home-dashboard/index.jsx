// src/pages/home-dashboard/index.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';

import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import BalanceCard from './components/BalanceCard';
import SocialImpactCard from './components/SocialImpactCard';
import PromotionalBanner from './components/PromotionalBanner';

import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

const HomeDashboard = () => {
  const navigate = useNavigate();

  // Clerk
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const displayName = useMemo(() => {
    if (!user) return 'AquaQR';
    const base =
      user.firstName ||
      user.fullName ||
      user.username ||
      user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
      'AquaQR';
    return base.split(' ')[0];
  }, [user]);

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Saldo real
  const [walletBalanceCents, setWalletBalanceCents] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);


 

  // Cargar mock de usuario
  useEffect(() => {
    const loadUserData = async () => {
      try {
        await new Promise(r => setTimeout(r, 600));
        setUserData(mockUserData);
      } catch (err) {
        console.error('Error loading user data:', err);
        if (window.showToast) window.showToast('Error al cargar los datos del usuario', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, []);

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
      if (window.showToast) window.showToast(e.message || 'Error cargando saldo', 'error');
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
    const onFocus = () => fetchWallet();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClerkLoaded, isSignedIn]);

  // Navegaciones
  const handleRecharge = () => navigate('/balance-recharge');
  const handleDispense = () => {
    navigate('/qr-scanner-landing', {
      state: { fromDashboard: true, action: 'dispense', redirectAfterScan: '/water-dispensing-control' }
    });
  };
  const handleViewAllTransactions = () => navigate('/transaction-history');

  // Loading
  if (isLoading || !isClerkLoaded || !isSignedIn || walletLoading) {
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
                <h1 className="text-heading-sm font-bold text-text-primary">AquaQR</h1>
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
          {/* Balance + Impacto */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceCard
              balance={balanceMXN}
              onRecharge={handleRecharge}
              onDispense={handleDispense}
            />
            <SocialImpactCard
              totalDonations={userData?.totalDonations}
              impactMetrics={userData?.impactMetrics}
            />
          </div>



          {/* Banner */}
          <PromotionalBanner />

          {/* Grid de contenido */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ⬇️ Sustituto simple de “RecentTransactions” */}


          
          </div>
        </div>
      </main>

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
};

export default HomeDashboard;
