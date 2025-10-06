import React from 'react';
import Icon from '../../../components/AppIcon';

const CurrentBalanceCard = ({ balance = 0, currency = 'MXN', className = '' }) => {
  return (
    <div className={`bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-text-secondary text-body-sm font-medium">Saldo Actual</span>
        <Icon name="Wallet" size={20} className="text-primary" />
      </div>
      <div className="flex items-baseline space-x-2">
        <span className="text-3xl font-bold text-text-primary">${Number(balance || 0).toFixed(2)}</span>
        <span className="text-text-secondary text-body-sm">{currency.toUpperCase()}</span>
      </div>
      <p className="text-text-secondary text-body-sm mt-2">
        Disponible para dispensar agua
      </p>
    </div>
  );
};

export default CurrentBalanceCard;
