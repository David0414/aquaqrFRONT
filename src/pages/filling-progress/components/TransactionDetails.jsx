import React from 'react';
import Icon from '../../../components/AppIcon';

const TransactionDetails = ({
  selectedLiters = 0,
  pricePerLiter = 0,
  totalCost = 0,
  currentBalance = 0,
  remainingBalance = 0,
  className = '',
}) => {
  const money = (n) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);

  const liters = Number(selectedLiters) || 0;
  const ppl = Number(pricePerLiter) || 0;
  const cost = Number(totalCost) || liters * ppl;
  const prev = Number(currentBalance) || 0;
  const rest = Number.isFinite(remainingBalance) ? Number(remainingBalance) : prev - cost;

  return (
    <div className={`bg-card rounded-2xl border border-border p-6 space-y-4 ${className}`}>
      <h3 className="text-heading-sm font-semibold text-text-primary mb-2">
        Detalles de la Transacción
      </h3>

      {/* Item */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="Droplets" size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-body-sm font-medium text-text-primary">Agua Purificada</p>
            <p className="text-body-xs text-text-secondary">
              {liters}L × {money(ppl)}/L
            </p>
          </div>
        </div>
        <span className="text-body-sm font-semibold text-text-primary">
          {money(cost)}
        </span>
      </div>

      <div className="border-t border-border my-4" />

      {/* Balance */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-body-sm text-text-secondary">Saldo anterior</span>
          <span className="text-body-sm font-medium text-text-primary">{money(prev)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-body-sm text-text-secondary">Costo del servicio</span>
          <span className="text-body-sm font-medium text-error">-{money(cost)}</span>
        </div>

        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-body-sm font-semibold text-text-primary">Saldo restante</span>
          <span className="text-body-sm font-bold text-success">{money(rest)}</span>
        </div>
      </div>

      {rest < 10 && (
        <div className="mt-4 flex items-center space-x-2 p-3 bg-warning/10 rounded-lg border border-warning/20">
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
