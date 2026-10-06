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
    <div className="home-balance-card relative overflow-hidden rounded-3xl border border-sky-100 bg-[linear-gradient(140deg,_#0f172a_0%,_#16315f_38%,_#1d4ed8_100%)] p-4 text-white shadow-lg sm:p-5">
      <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />
      <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-emerald-300/20 blur-2xl" />
      <div className="absolute right-16 top-16 h-16 w-16 rounded-[40%] border border-white/15 bg-white/10 rotate-12" />

      <div className="home-balance-heading relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/80">Saldo depositado + promociones</p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <span className="home-balance-total text-3xl font-black tracking-tight">${safeTotal.toFixed(2)}</span>
            <span className="pb-1 text-xs font-semibold text-white/70">MXN disponibles</span>
          </div>
        </div>
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
          <Icon name="Wallet" size={20} className="text-white" />
        </div>
      </div>

      <div className="home-balance-breakdown relative grid grid-cols-2 gap-2">
        <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-3">
          <p className="text-xs font-medium text-white/80">Saldo depositado</p>
          <p className="mt-1 text-xl font-bold text-white">${safeReal.toFixed(2)}</p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-emerald-400/20 px-3 py-3">
          <p className="text-xs font-medium text-emerald-50/90">Saldo de promociones</p>
          <p className="mt-1 text-xl font-bold text-white">${safeBonus.toFixed(2)}</p>
        </div>
      </div>

      <div className="home-balance-actions relative flex gap-2">
        <Button
          variant="default"
          size="sm"
          iconName="Plus"
          iconPosition="left"
          onClick={onRecharge}
          className="flex-1 border-white/10 bg-white text-slate-900 hover:bg-slate-100"
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
            border-white/10 bg-emerald-400 text-slate-950
            hover:bg-emerald-300
            focus:outline-none focus:ring-4 focus:ring-emerald-200/40
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
