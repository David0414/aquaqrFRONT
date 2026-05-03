import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BalanceCard = ({
  totalBalance,
  realBalance,
  bonusBalance,
  onRecharge,
  onDispense,
  dispenseLoading = false,
}) => {
  const safeTotal = Number(totalBalance || 0);
  const safeReal = Number(realBalance || 0);
  const safeBonus = Number(bonusBalance || 0);

  return (
    <div className="bg-gradient-to-br from-primary/5 via-accent/5 to-[#0F9F6E]/10 rounded-2xl p-6 border border-primary/10">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <p className="text-text-secondary text-body-sm font-medium">Saldo total disponible</p>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-bold text-primary">${safeTotal.toFixed(2)}</span>
            <span className="text-text-secondary text-body-sm">MXN</span>
          </div>
          <div className="mt-3 rounded-xl bg-white/80 px-4 py-3">
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-secondary">
              <span>Recargado: <span className="font-semibold text-text-primary">${safeReal.toFixed(2)}</span></span>
              <span>Promociones: <span className="font-semibold text-[#0F9F6E]">${safeBonus.toFixed(2)}</span></span>
            </div>
          </div>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon name="Wallet" size={24} className="text-primary" />
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          variant="default"
          size="sm"
          iconName="Plus"
          iconPosition="left"
          onClick={onRecharge}
          className="flex-1"
        >
          Recargar
        </Button>

        <Button
          variant="default"
          size="sm"
          iconName="Droplets"
          iconPosition="left"
          onClick={onDispense}
          loading={dispenseLoading}
          disabled={dispenseLoading}
          className="
            flex-1
            bg-accent text-white border-accent
            hover:bg-accent/90
            focus:outline-none focus:ring-4 focus:ring-accent/30
            shadow-sm
          "
        >
          Dispensar
        </Button>
      </div>
    </div>
  );
};

export default BalanceCard;
