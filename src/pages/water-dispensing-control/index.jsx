import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import MachineInfoCard from './components/MachineInfoCard';
import LiterSelector from './components/LiterSelector';
import PricingCalculator from './components/PricingCalculator';
import DispenseButton from './components/DispenseButton';
import SecurityVerification from './components/SecurityVerification';

const WaterDispensingControl = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [selectedLiters, setSelectedLiters] = useState(1);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Mock data - in real app this would come from props/context/API
  const mockMachineData = {
    id: 'AQ-2024-001',
    location: 'Centro Comercial Plaza Norte, Local 15',
    pricePerLiter: 2.50,
    maxLiters: 50
  };

  const mockUserData = {
    currentBalance: 45.75,
    name: 'María González'
  };

  // Calculate pricing
  const totalCost = selectedLiters * mockMachineData?.pricePerLiter;
  const hasInsufficientFunds = mockUserData?.currentBalance < totalCost;

  // Simulate connection establishment
  useEffect(() => {
    const connectTimer = setTimeout(() => {
      setConnectionStatus('connected');
      setIsVerified(true);
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  // Handle dispensing start
  const handleDispenseStart = async (dispensingData) => {
    setIsLoading(true);
    
    try {
      // Simulate API call to start dispensing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store dispensing data in localStorage for progress tracking
      localStorage.setItem('currentDispensing', JSON.stringify({
        ...dispensingData,
        machineId: mockMachineData?.id,
        startTime: Date.now()
      }));
      
      // Show success toast
      if (window.showToast) {
        window.showToast('Dispensado iniciado correctamente', 'success');
      }
    } catch (error) {
      console.error('Error starting dispensing:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/home-dashboard');
  };

  const handleHelpClick = () => {
    if (window.showToast) {
      window.showToast('Soporte: Si necesitas ayuda, contacta al +1-800-AQUAQR', 'info', 8000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBackClick}
            className="h-10 w-10"
          >
            <Icon name="ArrowLeft" size={20} />
          </Button>
          
          <div className="text-center">
            <h1 className="text-lg font-semibold text-text-primary">
              Control de Dispensado
            </h1>
            <p className="text-sm text-text-secondary">
              Selecciona y dispensa agua purificada
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleHelpClick}
            className="h-10 w-10"
          >
            <Icon name="HelpCircle" size={20} />
          </Button>
        </div>
      </header>
      {/* Main Content */}
      <main className="px-4 py-6 pb-20 space-y-6">
        {/* Machine Information */}
        <MachineInfoCard
          machineId={mockMachineData?.id}
          location={mockMachineData?.location}
          connectionStatus={connectionStatus}
          pricePerLiter={mockMachineData?.pricePerLiter}
        />

        {/* Security Verification */}
        <SecurityVerification
          machineId={mockMachineData?.id}
          isVerified={isVerified}
        />

        {/* Liter Selection */}
        <LiterSelector
          selectedLiters={selectedLiters}
          onLiterChange={setSelectedLiters}
          maxLiters={mockMachineData?.maxLiters}
        />

        {/* Pricing Calculator */}
        <PricingCalculator
          selectedLiters={selectedLiters}
          pricePerLiter={mockMachineData?.pricePerLiter}
          currentBalance={mockUserData?.currentBalance}
        />

        {/* Dispense Button */}
        <DispenseButton
          selectedLiters={selectedLiters}
          totalCost={totalCost}
          currentBalance={mockUserData?.currentBalance}
          connectionStatus={connectionStatus}
          onDispenseStart={handleDispenseStart}
          isLoading={isLoading}
        />

        {/* Additional Information */}
        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Icon name="Info" size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-text-primary">
                Información importante
              </h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• El agua se dispensa en tiempo real</li>
                <li>• Puedes cancelar el proceso en cualquier momento</li>
                <li>• El saldo se descuenta al completar el dispensado</li>
                <li>• Mantén tu recipiente en posición durante el proceso</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="text-center">
          <p className="text-sm text-text-secondary mb-2">
            ¿Problemas con el dispensador?
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.showToast) {
                window.showToast('Contactando soporte técnico...', 'info');
              }
            }}
          >
            <Icon name="Phone" size={16} />
            Contactar soporte
          </Button>
        </div>
      </main>
      {/* Bottom Navigation */}
      <BottomTabNavigation />
    </div>
  );
};

export default WaterDispensingControl;