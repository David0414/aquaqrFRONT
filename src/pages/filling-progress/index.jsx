import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressHeader from './components/ProgressHeader';
import WaterAnimation from './components/WaterAnimation';
import ProgressIndicator from './components/ProgressIndicator';
import SocialImpactMessage from './components/SocialImpactMessage';
import TransactionDetails from './components/TransactionDetails';
import HelpModal from './components/HelpModal';
import CancelConfirmationModal from './components/CancelConfirmationModal';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import { showSuccessToast, showErrorToast, showWarningToast } from '../../components/ui/NotificationToast';

const FillingProgress = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get dispensing data from previous screen
  const dispensingData = location?.state || {
    selectedLiters: 2.0,
    pricePerLiter: 1.50,
    totalCost: 3.00,
    currentBalance: 25.50,
    machineId: "AQ-001",
    location: "Centro Comercial Plaza Norte"
  };

  // State management
  const [progress, setProgress] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [remainingTime, setRemainingTime] = useState(120); // seconds
  const [flowRate, setFlowRate] = useState(0);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDispensing, setIsDispensing] = useState(false);

  // Calculated values
  const remainingBalance = dispensingData?.currentBalance - dispensingData?.totalCost;
  const donationAmount = dispensingData?.totalCost * 0.05; // 5% donation
  const refundAmount = dispensingData?.totalCost * (1 - progress / 100);

  // Simulate WebSocket connection and dispensing progress
  useEffect(() => {
    // Simulate connection establishment
    const connectionTimer = setTimeout(() => {
      setConnectionStatus('connected');
      setIsDispensing(true);
      showSuccessToast('Conexión establecida con la máquina');
    }, 2000);

    return () => clearTimeout(connectionTimer);
  }, []);

  // Simulate dispensing progress
  useEffect(() => {
    if (!isDispensing || connectionStatus !== 'connected') return;

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (Math.random() * 3 + 1); // 1-4% increment
        
        if (newProgress >= 100) {
          // Dispensing complete
          setIsDispensing(false);
          setFlowRate(0);
          setRemainingTime(0);
          
          setTimeout(() => {
            navigate('/transaction-complete', {
              state: {
                ...dispensingData,
                progress: 100,
                donationAmount,
                completedAt: new Date()?.toISOString()
              }
            });
          }, 1500);
          
          return 100;
        }
        
        return newProgress;
      });
    }, 800);

    return () => clearInterval(progressInterval);
  }, [isDispensing, connectionStatus, navigate, dispensingData, donationAmount]);

  // Update flow rate and remaining time based on progress
  useEffect(() => {
    if (isDispensing && progress < 100) {
      const baseFlowRate = 1.2; // L/min
      const variation = (Math.random() - 0.5) * 0.3;
      setFlowRate(baseFlowRate + variation);
      
      const remainingLiters = dispensingData?.selectedLiters * (1 - progress / 100);
      const estimatedTime = Math.ceil((remainingLiters / (baseFlowRate + variation)) * 60);
      setRemainingTime(Math.max(0, estimatedTime));
    }
  }, [progress, isDispensing, dispensingData?.selectedLiters]);

  // Handle cancel dispensing
  const handleCancelClick = useCallback(() => {
    if (progress > 0 && progress < 100) {
      setIsCancelModalOpen(true);
    } else {
      navigate('/water-dispensing-control');
    }
  }, [progress, navigate]);

  const handleConfirmCancel = useCallback(() => {
    setIsDispensing(false);
    setConnectionStatus('disconnected');
    
    showWarningToast(`Dispensado cancelado. Reembolso de $${refundAmount?.toFixed(2)} procesado.`);
    
    setTimeout(() => {
      navigate('/home-dashboard', {
        state: {
          refundAmount,
          cancelledAt: new Date()?.toISOString()
        }
      });
    }, 1000);
  }, [refundAmount, navigate]);

  // Handle connection errors
  useEffect(() => {
    if (connectionStatus === 'disconnected' && isDispensing) {
      showErrorToast('Conexión perdida con la máquina. Reintentando...');
      
      const reconnectTimer = setTimeout(() => {
        setConnectionStatus('connecting');
        
        setTimeout(() => {
          setConnectionStatus('connected');
          showSuccessToast('Conexión restablecida');
        }, 3000);
      }, 2000);

      return () => clearTimeout(reconnectTimer);
    }
  }, [connectionStatus, isDispensing]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <ProgressHeader
        machineId={dispensingData?.machineId}
        location={dispensingData?.location}
        connectionStatus={connectionStatus}
        onCancel={handleCancelClick}
      />
      {/* Main Content */}
      <div className="px-4 py-6 pb-20 space-y-8">
        {/* Water Animation */}
        <div className="text-center">
          <WaterAnimation isActive={isDispensing} />
        </div>

        {/* Progress Indicator */}
        <ProgressIndicator
          progress={progress}
          remainingTime={remainingTime}
          flowRate={flowRate}
          isActive={isDispensing}
        />

        {/* Social Impact Message */}
        <SocialImpactMessage donationAmount={donationAmount} />

        {/* Transaction Details */}
        <TransactionDetails
          selectedLiters={dispensingData?.selectedLiters}
          pricePerLiter={dispensingData?.pricePerLiter}
          totalCost={dispensingData?.totalCost}
          currentBalance={dispensingData?.currentBalance}
          remainingBalance={remainingBalance}
        />

        {/* Help Button */}
        <div className="text-center">
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-muted rounded-full hover:bg-muted/80 transition-colors duration-200"
          >
            <span className="text-body-sm font-medium text-text-primary">
              ¿Necesitas ayuda?
            </span>
          </button>
        </div>
      </div>
      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
      {/* Cancel Confirmation Modal */}
      <CancelConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        progress={progress}
        totalCost={dispensingData?.totalCost}
        refundAmount={refundAmount}
      />
      {/* Bottom Navigation */}
      <BottomTabNavigation isVisible={false} />
    </div>
  );
};

export default FillingProgress;