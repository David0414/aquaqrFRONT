import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const DispenseButton = ({ 
  selectedLiters, 
  totalCost, 
  currentBalance, 
  connectionStatus,
  onDispenseStart,
  isLoading = false,
  className = '' 
}) => {
  const navigate = useNavigate();
  const hasInsufficientFunds = currentBalance < totalCost;
  const isDisconnected = connectionStatus !== 'connected';
  const isDisabled = hasInsufficientFunds || isDisconnected || isLoading || selectedLiters <= 0;

  const handleDispenseClick = async () => {
    if (isDisabled) return;

    try {
      // Trigger dispensing start callback
      if (onDispenseStart) {
        await onDispenseStart({
          liters: selectedLiters,
          cost: totalCost,
          timestamp: new Date()?.toISOString()
        });
      }

      // Navigate to filling progress
      navigate('/filling-progress', {
        state: {
          liters: selectedLiters,
          cost: totalCost,
          startTime: Date.now()
        }
      });
    } catch (error) {
      console.error('Error starting dispensing:', error);
      // Show error toast
      if (window.showToast) {
        window.showToast('Error al iniciar el dispensado. Inténtalo de nuevo.', 'error');
      }
    }
  };

  const handleRechargeClick = () => {
    navigate('/balance-recharge', {
      state: {
        returnTo: '/water-dispensing-control',
        requiredAmount: totalCost - currentBalance,
        selectedLiters
      }
    });
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Icon name="Loader" size={20} className="animate-spin" />
          Iniciando dispensado...
        </>
      );
    }

    if (hasInsufficientFunds) {
      return (
        <>
          <Icon name="CreditCard" size={20} />
          Recargar saldo
        </>
      );
    }

    if (isDisconnected) {
      return (
        <>
          <Icon name="WifiOff" size={20} />
          Conectando...
        </>
      );
    }

    return (
      <>
        <Icon name="Play" size={20} />
        Dispensar {selectedLiters}L
      </>
    );
  };

  const getButtonVariant = () => {
    if (hasInsufficientFunds) return 'warning';
    if (isDisconnected) return 'secondary';
    return 'default';
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Button
        variant={getButtonVariant()}
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={isDisconnected && !hasInsufficientFunds}
        onClick={hasInsufficientFunds ? handleRechargeClick : handleDispenseClick}
        className="h-14 text-lg font-semibold"
      >
        {getButtonContent()}
      </Button>

      {/* Status Messages */}
      {isDisconnected && !hasInsufficientFunds && (
        <div className="flex items-center justify-center space-x-2 text-text-secondary">
          <Icon name="Loader" size={16} className="animate-spin" />
          <span className="text-sm">
            Estableciendo conexión con el dispensador...
          </span>
        </div>
      )}

      {selectedLiters <= 0 && (
        <p className="text-center text-sm text-text-secondary">
          Selecciona una cantidad para continuar
        </p>
      )}

      {connectionStatus === 'connected' && !hasInsufficientFunds && selectedLiters > 0 && (
        <div className="flex items-center justify-center space-x-2 text-success">
          <Icon name="Shield" size={16} />
          <span className="text-sm font-medium">
            Conexión segura verificada
          </span>
        </div>
      )}
    </div>
  );
};

export default DispenseButton;