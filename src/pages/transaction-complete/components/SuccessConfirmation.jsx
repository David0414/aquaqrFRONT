import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';

const SuccessConfirmation = ({ transactionData, className = '' }) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAnimation(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`text-center space-y-6 ${className}`}>
      {/* Success Animation */}
      <div className="flex justify-center">
        <div className={`
          relative w-24 h-24 rounded-full bg-success/10 border-2 border-success/20
          flex items-center justify-center transition-all duration-500 ease-out
          ${showAnimation ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}
        `}>
          <div className={`
            absolute inset-0 rounded-full bg-success/5 animate-ping
            ${showAnimation ? 'animate-ping' : ''}
          `} />
          <Icon 
            name="CheckCircle" 
            size={48} 
            className="text-success relative z-10"
            strokeWidth={2}
          />
        </div>
      </div>
      {/* Success Message */}
      <div className="space-y-2">
        <h1 className="text-heading-lg font-bold text-text-primary">
          ¡Dispensado Exitoso!
        </h1>
        <p className="text-body-base text-text-secondary">
          Tu agua purificada ha sido dispensada correctamente
        </p>
      </div>
      {/* Transaction Summary */}
      <div className="bg-surface rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-body-base text-text-secondary">Cantidad dispensada</span>
          <span className="text-heading-sm font-semibold text-primary">
            {transactionData?.liters}L
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-body-base text-text-secondary">Costo total</span>
          <span className="text-heading-sm font-semibold text-text-primary">
            ${transactionData?.totalCost}
          </span>
        </div>
        
        <div className="h-px bg-border" />
        
        <div className="flex items-center justify-between">
          <span className="text-body-base text-text-secondary">Saldo restante</span>
          <span className="text-heading-sm font-bold text-success">
            ${transactionData?.remainingBalance}
          </span>
        </div>
      </div>
      {/* Machine Info */}
      <div className="bg-muted/50 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="MapPin" size={20} className="text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-body-sm font-medium text-text-primary">
              {transactionData?.machineLocation}
            </p>
            <p className="text-body-xs text-text-secondary">
              ID: {transactionData?.machineId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessConfirmation;