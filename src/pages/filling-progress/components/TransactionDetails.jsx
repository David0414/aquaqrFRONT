import React from 'react';
import Icon from '../../../components/AppIcon';

const TransactionDetails = ({ 
  selectedLiters = 0, 
  pricePerLiter = 0, 
  totalCost = 0, 
  currentBalance = 0,
  remainingBalance = 0 
}) => {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <h3 className="text-heading-sm font-semibold text-text-primary mb-4">
        Detalles de la Transacción
      </h3>
      {/* Transaction Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Icon name="Droplets" size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-text-primary">
                Agua Purificada
              </p>
              <p className="text-body-xs text-text-secondary">
                {selectedLiters}L × ${pricePerLiter?.toFixed(2)}/L
              </p>
            </div>
          </div>
          <span className="text-body-sm font-semibold text-text-primary">
            ${totalCost?.toFixed(2)}
          </span>
        </div>
      </div>
      {/* Divider */}
      <div className="border-t border-border my-4" />
      {/* Balance Information */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-body-sm text-text-secondary">
            Saldo anterior
          </span>
          <span className="text-body-sm font-medium text-text-primary">
            ${currentBalance?.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-body-sm text-text-secondary">
            Costo del servicio
          </span>
          <span className="text-body-sm font-medium text-error">
            -${totalCost?.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-body-sm font-semibold text-text-primary">
            Saldo restante
          </span>
          <span className="text-body-sm font-bold text-success">
            ${remainingBalance?.toFixed(2)}
          </span>
        </div>
      </div>
      {/* Low Balance Warning */}
      {remainingBalance < 10 && (
        <div className="flex items-center space-x-2 p-3 bg-warning/10 rounded-lg border border-warning/20 mt-4">
          <Icon name="AlertTriangle" size={16} className="text-warning flex-shrink-0" />
          <p className="text-body-xs text-warning">
            Tu saldo está bajo. Considera recargar después de completar esta transacción.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionDetails;