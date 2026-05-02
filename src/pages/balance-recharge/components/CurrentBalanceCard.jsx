import React from 'react';
import Icon from '../../../components/AppIcon';

const CurrentBalanceCard = ({
  totalBalance = 0,
  realBalance = 0,
  bonusBalance = 0,
  currency = 'MXN',
  className = '',
}) => {
  return (
    <div className={`bg-gradient-to-br from-primary/5 via-accent/5 to-success/10 rounded-2xl p-6 border border-primary/10 ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <span className="text-text-secondary text-body-sm font-medium">Saldo disponible</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-3xl font-bold text-text-primary">${Number(totalBalance || 0).toFixed(2)}</span>
            <span className="text-text-secondary text-body-sm">{currency.toUpperCase()}</span>
          </div>
          <p className="text-text-secondary text-body-sm mt-2">
            Separado entre dinero real y saldo de regalo.
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center">
          <Icon name="Wallet" size={22} className="text-primary" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">Saldo real</p>
          <p className="mt-1 text-xl font-bold text-text-primary">${Number(realBalance || 0).toFixed(2)}</p>
        </div>
        <div className="rounded-xl bg-white/80 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-secondary">Saldo regalo</p>
          <p className="mt-1 text-xl font-bold text-success">${Number(bonusBalance || 0).toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export default CurrentBalanceCard;
