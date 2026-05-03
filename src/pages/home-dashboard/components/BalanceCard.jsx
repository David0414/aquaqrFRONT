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
    <div className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-[linear-gradient(140deg,_#0f172a_0%,_#16315f_38%,_#1d4ed8_100%)] p-6 text-white shadow-[0_28px_70px_rgba(30,63,122,0.26)]">
      <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-cyan-300/20 blur-2xl" />
      <div className="absolute -left-8 bottom-0 h-32 w-32 rounded-full bg-emerald-300/20 blur-2xl" />
      <div className="absolute right-16 top-16 h-16 w-16 rounded-[40%] border border-white/15 bg-white/10 rotate-12" />

      <div className="relative flex items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Tu saldo</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="text-4xl font-black tracking-tight">${safeTotal.toFixed(2)}</span>
            <span className="pb-1 text-sm font-semibold text-white/70">disponible</span>
          </div>
          <p className="mt-2 text-sm text-white/75">Usa tu saldo real y tu saldo de promociones.</p>
        </div>
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.4rem] bg-white/12 backdrop-blur">
          <Icon name="Wallet" size={24} className="text-white" />
        </div>
      </div>

      <div className="relative grid gap-3 md:grid-cols-2">
        <div className="rounded-[1.6rem] border border-white/15 bg-white/12 px-4 py-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Saldo real</p>
          <p className="mt-2 text-2xl font-black text-white">${safeReal.toFixed(2)}</p>
        </div>
        <div className="rounded-[1.6rem] border border-white/15 bg-[linear-gradient(135deg,_rgba(16,185,129,0.26),_rgba(45,212,191,0.12))] px-4 py-4 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-50/90">Saldo de promociones</p>
          <p className="mt-2 text-2xl font-black text-white">${safeBonus.toFixed(2)}</p>
        </div>
      </div>

      <div className="relative mt-5 flex space-x-3">
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
