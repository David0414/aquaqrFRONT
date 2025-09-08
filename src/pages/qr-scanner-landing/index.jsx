import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import QRScannerInterface from './components/QRScannerInterface';
import ManualMachineInput from './components/ManualMachineInput';
import RecentMachinesCard from './components/RecentMachinesCard';
import ConnectionStatusIndicator from './components/ConnectionStatusIndicator';
import InstructionsPanel from './components/InstructionsPanel';

const QRScannerLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [activeTab, setActiveTab] = useState('scanner');
  const [isScanning, setIsScanning] = useState(false);
  const [machineInfo, setMachineInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('idle');
  
  // Check if came from dashboard dispense action
  const fromDashboard = location?.state?.fromDashboard;
  const redirectAfterScan = location?.state?.redirectAfterScan || '/water-dispensing-control';

  // Check for deep link parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const machineId = urlParams?.get('machine');
    const signature = urlParams?.get('sig');
    
    if (machineId && signature) {
      handleDeepLink(machineId, signature);
    }
  }, [location]);

  const handleDeepLink = async (machineId, signature) => {
    setConnectionStatus('validating');
    setIsLoading(true);
    
    try {
      // Simulate HMAC signature validation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation - in real app, verify signature
      const isValidSignature = signature?.length > 10; // Simple mock validation
      
      if (isValidSignature) {
        const mockMachineData = {
          machineId,
          location: `Máquina ${machineId}`,
          qrData: `AQUA_MACHINE_${machineId}_DEEPLINK`,
          timestamp: new Date()?.toISOString(),
          method: 'deeplink'
        };
        
        handleMachineConnection(mockMachineData);
      } else {
        throw new Error('Firma de seguridad inválida');
      }
    } catch (error) {
      setConnectionStatus('error');
      setError('Enlace inválido o expirado. Intenta escanear el código QR nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = (scanData) => {
    setMachineInfo(scanData);
    handleMachineConnection(scanData);
  };

  const handleScanError = (errorMessage) => {
    setError(errorMessage);
    
    // Auto-clear error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
  };

  const handleMachineConnection = async (machineData) => {
    setMachineInfo(machineData);
    setIsLoading(true);
    
    try {
      // Simulate QR validation and machine connection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Store machine info for session
      localStorage.setItem('currentMachine', JSON.stringify(machineData));
      
      // Add to recent machines
      const recentMachines = JSON.parse(localStorage.getItem('recentMachines') || '[]');
      const updatedRecent = [
        machineData,
        ...recentMachines?.filter(m => m?.machineId !== machineData?.machineId)
      ]?.slice(0, 5);
      localStorage.setItem('recentMachines', JSON.stringify(updatedRecent));
      
      // Check authentication status
      const isAuthenticated = localStorage.getItem('authToken');
      
      if (window.showToast) {
        window.showToast('¡Máquina conectada exitosamente!', 'success', 2000);
      }
      
      setTimeout(() => {
        if (isAuthenticated) {
          navigate(redirectAfterScan, { 
            state: { machineData } 
          });
        } else {
          navigate('/user-login', { 
            state: { 
              machineData,
              from: redirectAfterScan
            } 
          });
        }
      }, 1000);
      
    } catch (error) {
      setError('No se pudo conectar con la máquina. Verifica que el código QR sea válido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetryConnection = () => {
    setError(null);
    setMachineInfo(null);
  };

  const tabs = [
    { id: 'scanner', label: 'Escanear QR', icon: 'QrCode' },
    { id: 'manual', label: 'ID Manual', icon: 'Hash' },
    { id: 'recent', label: 'Recientes', icon: 'Clock' }
  ];

  return (
    <>
      <Helmet>
        <title>Escanear QR - AquaQR</title>
        <meta name="description" content="Escanea el código QR de tu máquina dispensadora AquaQR para comenzar a dispensar agua purificada de forma segura." />
        <meta name="keywords" content="QR, escanear, agua, dispensador, AquaQR" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <ConnectionStatusIndicator 
          status={connectionStatus}
          machineInfo={machineInfo}
          onRetry={handleRetryConnection}
        />

        {/* Header */}
        <div className="bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto px-4 pt-8 pb-6">
            {/* Back Navigation */}
            {fromDashboard && (
              <div className="flex items-center mb-6">
                <button
                  onClick={() => navigate('/home-dashboard')}
                  className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  <Icon name="ArrowLeft" size={20} />
                  <span className="font-medium">Volver al Dashboard</span>
                </button>
              </div>
            )}
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Icon name="QrCode" size={32} className="text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                {fromDashboard ? 'Escanear para Dispensar' : 'Conectar a Dispensador'}
              </h1>
              <p className="text-text-secondary max-w-md mx-auto">
                {fromDashboard 
                  ? 'Escanea el código QR de la máquina para comenzar a dispensar agua' 
                  : 'Escanea el código QR o ingresa el ID de la máquina para comenzar tu sesión de dispensado'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-8">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-muted p-1 rounded-xl inline-flex">
              {tabs?.map((tab) => (
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${activeTab === tab?.id
                      ? 'bg-background text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                    }
                  `}
                >
                  <Icon name={tab?.icon} size={16} />
                  <span>{tab?.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="max-w-2xl mx-auto">
            {activeTab === 'scanner' && (
              <div className="space-y-8">
                <QRScannerInterface
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                  isScanning={isScanning}
                  setIsScanning={setIsScanning}
                />
                
                <div className="lg:hidden">
                  <InstructionsPanel />
                </div>
              </div>
            )}

            {activeTab === 'manual' && (
              <div className="space-y-8">
                <ManualMachineInput
                  onMachineSubmit={handleMachineConnection}
                  isLoading={isLoading}
                />
                
                <div className="lg:hidden">
                  <InstructionsPanel />
                </div>
              </div>
            )}

            {activeTab === 'recent' && (
              <div className="space-y-8">
                <RecentMachinesCard
                  onMachineSelect={handleMachineConnection}
                  isLoading={isLoading}
                />
                
                <div className="lg:hidden">
                  <InstructionsPanel />
                </div>
              </div>
            )}
          </div>

          {/* Desktop Instructions Panel */}
          <div className="hidden lg:block max-w-md mx-auto mt-8">
            <InstructionsPanel />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="max-w-md mx-auto mt-6">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <div>
                    <h4 className="font-medium text-primary text-sm">Conectando...</h4>
                    <p className="text-primary/80 text-sm">Estableciendo conexión con la máquina</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="max-w-md mx-auto mt-6">
              <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Icon name="AlertTriangle" size={20} className="text-error flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-error text-sm mb-1">Error de Conexión</h4>
                    <p className="text-error/80 text-sm">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRetryConnection}
                      className="mt-3"
                      iconName="RefreshCw"
                      iconPosition="left"
                    >
                      Reintentar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="max-w-md mx-auto mt-8 text-center">
            <p className="text-sm text-text-secondary mb-4">
              ¿Necesitas ayuda para conectarte?
            </p>
            <Button
              variant="ghost"
              size="sm"
              iconName="HelpCircle"
              iconPosition="left"
              onClick={() => {
                window.showToast?.('Soporte técnico: +1 (555) 123-4567', 'info', 8000);
              }}
            >
              Contactar Soporte
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default QRScannerLanding;