import React from 'react';
import Icon from '../../../components/AppIcon';

const PricingCalculator = ({
  selectedLiters,
  pricePerLiter,
  currentBalance,
  className = '',
}) => {
  const totalCost = selectedLiters * pricePerLiter;
  const remainingBalance = currentBalance - totalCost;
  const hasInsufficientFunds = remainingBalance < 0;

  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-text-primary mb-6">Resumen del pedido</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <Icon name="Droplets" size={18} className="text-primary" />
            <span className="text-text-secondary">Cantidad</span>
          </div>
          <span className="font-medium text-text-primary">{selectedLiters} L</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-2">
            <Icon name="DollarSign" size={18} className="text-primary" />
            <span className="text-text-secondary">Precio por litro</span>
          </div>
          <span className="font-medium text-text-primary">${pricePerLiter.toFixed(2)} MXN</span>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-lg font-semibold text-text-primary">Total a pagar</span>
            <span className="text-2xl font-bold text-primary">${totalCost.toFixed(2)} MXN</span>
          </div>
        </div>

        <div className="bg-surface rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Saldo actual</span>
            <span className="font-semibold text-text-primary">${currentBalance.toFixed(2)} MXN</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Saldo después</span>
            <span className={`font-semibold ${hasInsufficientFunds ? 'text-error' : 'text-success'}`}>
              ${remainingBalance.toFixed(2)} MXN
            </span>
          </div>
        </div>

        {hasInsufficientFunds && (
          <div className="flex items-start space-x-3 p-4 bg-error/10 border border-error/20 rounded-lg">
            <Icon name="AlertTriangle" size={20} className="text-error flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-error mb-1">Saldo insuficiente</p>
              <p className="text-sm text-error/80">
                Necesitas recargar ${Math.abs(remainingBalance).toFixed(2)} MXN adicionales.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PricingCalculator;
