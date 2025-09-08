import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import SuccessConfirmation from './components/SuccessConfirmation';
import TransactionReceipt from './components/TransactionReceipt';
import SocialImpactSection from './components/SocialImpactSection';
import ShareSection from './components/ShareSection';
import ActionButtons from './components/ActionButtons';
import RecentTransactions from './components/RecentTransactions';

const TransactionComplete = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [transactionData, setTransactionData] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);

  // Mock transaction data - in real app this would come from state/API
  const mockTransactionData = {
    transactionId: 'TXN-2025-001234',
    timestamp: new Date('2025-01-05T18:15:00'),
    liters: 2.5,
    totalCost: '12.50',
    remainingBalance: '87.50',
    pricePerLiter: '5.00',
    machineId: 'AQ-MX-001',
    machineLocation: 'Centro Comercial Plaza Norte, Local 15',
    paymentMethod: 'Saldo Prepagado',
    status: 'completed'
  };

  const mockImpactData = {
    co2Reduced: '0.8',
    plasticAvoided: '5',
    totalDonation: '2.15',
    monthlyProgress: 68,
    monthlyDonated: '34.50',
    monthlyGoal: '50.00',
    newAchievement: true,
    achievementText: 'Eco Warrior - 50L dispensados este mes'
  };

  const mockRecentTransactions = [
    {
      id: 'TXN-2025-001234',
      type: 'dispensing',
      description: 'Dispensado de Agua',
      amount: '12.50',
      liters: '2.5',
      timestamp: new Date('2025-01-05T18:15:00'),
      status: 'completed'
    },
    {
      id: 'TXN-2025-001233',
      type: 'recharge',
      description: 'Recarga de Saldo',
      amount: '50.00',
      timestamp: new Date('2025-01-05T14:30:00'),
      status: 'completed'
    },
    {
      id: 'TXN-2025-001232',
      type: 'dispensing',
      description: 'Dispensado de Agua',
      amount: '10.00',
      liters: '2.0',
      timestamp: new Date('2025-01-04T16:45:00'),
      status: 'completed'
    },
    {
      id: 'TXN-2025-001231',
      type: 'dispensing',
      description: 'Dispensado de Agua',
      amount: '15.00',
      liters: '3.0',
      timestamp: new Date('2025-01-04T12:20:00'),
      status: 'completed'
    }
  ];

  useEffect(() => {
    // Simulate loading transaction data
    const loadTransactionData = async () => {
      try {
        // Get transaction data from location state or API
        const stateData = location?.state?.transactionData;
        
        if (stateData) {
          setTransactionData(stateData);
        } else {
          // Use mock data if no state data
          setTransactionData(mockTransactionData);
        }

        setImpactData(mockImpactData);
        setRecentTransactions(mockRecentTransactions);

        // Update balance in localStorage
        const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');
        if (currentUser) {
          currentUser.balance = mockTransactionData?.remainingBalance;
          localStorage.setItem('userData', JSON.stringify(currentUser));
        }

        // Show success toast
        setTimeout(() => {
          if (window.showToast) {
            window.showToast('¡Transacción completada exitosamente!', 'success');
          }
        }, 1000);

      } catch (error) {
        console.error('Error loading transaction data:', error);
        if (window.showToast) {
          window.showToast('Error al cargar los datos de la transacción', 'error');
        }
        navigate('/home-dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactionData();
  }, [location?.state, navigate]);

  const handleGeneratePDF = () => {
    // Mock PDF generation
    if (window.showToast) {
      window.showToast('Generando recibo PDF...', 'info');
    }
    
    setTimeout(() => {
      if (window.showToast) {
        window.showToast('Recibo PDF descargado exitosamente', 'success');
      }
    }, 2000);
  };

  const handleDispenseMore = () => {
    navigate('/water-dispensing-control', {
      state: { 
        fromComplete: true,
        machineId: transactionData?.machineId 
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-body-sm">Procesando transacción...</p>
        </div>
      </div>
    );
  }

  if (!transactionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-text-primary text-body-base">No se encontraron datos de la transacción</p>
          <button
            onClick={() => navigate('/home-dashboard')}
            className="text-primary hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="pb-20">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
          {/* Success Confirmation */}
          <SuccessConfirmation 
            transactionData={transactionData}
            className="animate-scale-in"
          />

          {/* Transaction Receipt */}
          <TransactionReceipt 
            transactionData={transactionData}
            onGeneratePDF={handleGeneratePDF}
            className="animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          />

          {/* Social Impact Section */}
          <SocialImpactSection 
            impactData={impactData}
            className="animate-slide-up"
            style={{ animationDelay: '0.4s' }}
          />

          {/* Share Section */}
          <ShareSection 
            transactionData={transactionData}
            impactData={impactData}
            className="animate-slide-up"
            style={{ animationDelay: '0.6s' }}
          />

          {/* Recent Transactions */}
          <RecentTransactions 
            transactions={recentTransactions}
            className="animate-slide-up"
            style={{ animationDelay: '0.8s' }}
          />

          {/* Action Buttons */}
          <ActionButtons 
            onDispenseMore={handleDispenseMore}
            className="animate-slide-up"
            style={{ animationDelay: '1.0s' }}
          />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomTabNavigation />

      {/* Toast Notifications */}
      <NotificationToast />
    </div>
  );
};

export default TransactionComplete;