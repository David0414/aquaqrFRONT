import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import BalanceCard from './components/BalanceCard';
import SocialImpactCard from './components/SocialImpactCard';
import QuickActionCards from './components/QuickActionCards';
import PromotionalBanner from './components/PromotionalBanner';
import RecentTransactions from './components/RecentTransactions';
import BalanceTopUpShortcuts from './components/BalanceTopUpShortcuts';
import MachineStatusIndicators from './components/MachineStatusIndicators';
import Icon from '../../components/AppIcon';

const HomeDashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock user data
  const mockUserData = {
    id: "user_12345",
    name: "María González",
    email: "maria.gonzalez@email.com",
    phone: "+1234567890",
    balance: 127.50,
    totalDonations: 45.75,
    impactMetrics: {
      familiesHelped: 12,
      litersProvided: 156
    }
  };

  // Mock recent transactions
  const mockTransactions = [
    {
      id: "txn_001",
      type: "dispensing",
      description: "Dispensado de Agua - 2.5L",
      amount: -5.00,
      date: "2025-01-05T14:30:00Z",
      status: "completed",
      machineId: "AQ-001",
      location: "Plaza Central",
      liters: 2.5
    },
    {
      id: "txn_002",
      type: "recharge",
      description: "Recarga de Saldo",
      amount: 50.00,
      date: "2025-01-05T10:15:00Z",
      status: "completed"
    },
    {
      id: "txn_003",
      type: "dispensing",
      description: "Dispensado de Agua - 1L",
      amount: -2.00,
      date: "2025-01-04T16:45:00Z",
      status: "completed",
      machineId: "AQ-002",
      location: "Centro Comercial Norte",
      liters: 1.0
    },
    {
      id: "txn_004",
      type: "donation",
      description: "Donación Social",
      amount: -1.50,
      date: "2025-01-04T16:45:00Z",
      status: "completed"
    },
    {
      id: "txn_005",
      type: "recharge",
      description: "Recarga de Saldo",
      amount: 100.00,
      date: "2025-01-03T09:20:00Z",
      status: "completed"
    }
  ];

  // Mock recent machines
  const mockRecentMachines = [
    {
      id: "AQ-001",
      name: "AquaQR Plaza Central",
      location: "Plaza Central, Local 15",
      lastUsed: "2025-01-05T14:30:00Z"
    },
    {
      id: "AQ-002",
      name: "AquaQR Centro Norte",
      location: "Centro Comercial Norte",
      lastUsed: "2025-01-04T16:45:00Z"
    },
    {
      id: "AQ-003",
      name: "AquaQR Universidad",
      location: "Campus Universitario",
      lastUsed: "2025-01-02T11:20:00Z"
    }
  ];

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setUserData(mockUserData);
      } catch (error) {
        console.error('Error loading user data:', error);
        if (window.showToast) {
          window.showToast('Error al cargar los datos del usuario', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Handle navigation actions
  const handleRecharge = () => {
    navigate('/balance-recharge');
  };

  // Modified dispense handler to go to QR scanner first
  const handleDispense = () => {
    navigate('/qr-scanner-landing', {
      state: { 
        fromDashboard: true,
        action: 'dispense',
        redirectAfterScan: '/water-dispensing-control'
      }
    });
  };

  const handleViewAllTransactions = () => {
    navigate('/transaction-history');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-body-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

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
                <h1 className="text-heading-sm font-bold text-text-primary">
                  AquaQR
                </h1>
                <p className="text-caption text-text-secondary">
                  ¡Hola, {userData?.name?.split(' ')?.[0]}!
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
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        <div className="space-y-6">
          {/* Balance and Social Impact Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BalanceCard
              balance={userData?.balance}
              onRecharge={handleRecharge}
              onDispense={handleDispense}
            />
            <SocialImpactCard
              totalDonations={userData?.totalDonations}
              impactMetrics={userData?.impactMetrics}
            />
          </div>

          {/* Quick Actions */}
          <QuickActionCards />

          {/* Promotional Banner */}
          <PromotionalBanner />

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Transactions - Takes 2 columns on large screens */}
            <div className="lg:col-span-2">
              <RecentTransactions
                transactions={mockTransactions}
                onViewAll={handleViewAllTransactions}
              />
            </div>

            {/* Sidebar Content */}
            <div className="space-y-6">
              <BalanceTopUpShortcuts />
              <MachineStatusIndicators recentMachines={mockRecentMachines} />
            </div>
          </div>
        </div>
      </main>
      {/* Bottom Navigation */}
      <BottomTabNavigation />
      {/* Toast Notifications */}
      <NotificationToast />
    </div>
  );
};

export default HomeDashboard;