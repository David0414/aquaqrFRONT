import React from 'react';
import Icon from '../../../components/AppIcon';

function moneyFromCents(amountCents) {
  return (Number(amountCents || 0) / 100).toFixed(2);
}

const PROMOTION_ICONS = {
  welcome_first_garrafon: 'Gift',
  topup_bonus: 'WalletCards',
  monthly_cashback: 'BadgePercent',
  monthly_consumption_points: 'Sparkles',
};

const PROMOTION_LABELS = {
  welcome_first_garrafon: 'Bienvenida',
  topup_bonus: 'Top-Up',
  monthly_cashback: 'Cashback',
  monthly_consumption_points: 'Puntos',
};

const AccountStatistics = ({ user }) => {
  const activePromotions = (user?.promotions || []).filter(
    (promotion) => promotion.isActive && promotion.key !== 'premium_membership'
  );
  const recentBonusCredits = (user?.recentBonusCredits || []).slice(0, 4);
  const monthlyProgress = user?.monthlyProgress || null;
  const currentPoints = Number(monthlyProgress?.points || 0);
  const pointsGoal = currentPoints >= 1000 ? 1000 : currentPoints >= 500 ? 1000 : currentPoints >= 200 ? 500 : 200;
  const pointsProgress = Math.max(0, Math.min(100, (currentPoints / pointsGoal) * 100));
  const garrafones = Number(monthlyProgress?.garrafones || 0);
  const cashbackProgress = Math.max(0, Math.min(100, (garrafones / 10) * 100));
  const monthSummary = [
    {
      label: 'Cashback estimado',
      value: `$${moneyFromCents(monthlyProgress?.estimatedCashbackCents)}`,
      helper: monthlyProgress?.cashbackLabel || 'Sin cashback',
      color: 'from-emerald-500 to-teal-400',
      width: `${cashbackProgress}%`,
    },
    {
      label: 'Bono por puntos',
      value: `$${moneyFromCents(monthlyProgress?.estimatedPointsBonusCents)}`,
      helper: `${monthlyProgress?.bonusPercent || 0}% con tu nivel actual`,
      color: 'from-sky-600 to-cyan-400',
      width: `${pointsProgress}%`,
    },
  ];

  const statistics = [
    {
      title: 'Litros dispensados',
      value: `${Number(user?.totalLitersDispensed || 0).toFixed(0)}L`,
      subtitle: 'Total acumulado',
      icon: 'Droplets',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Transacciones',
      value: Number(user?.transactionCount || 0),
      subtitle: 'Movimientos registrados',
      icon: 'CreditCard',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Bonificacion ganada',
      value: `$${moneyFromCents(user?.totalBonusEarnedCents)}`,
      subtitle: `${Number(user?.bonusRewardsCount || 0)} recompensas acreditadas`,
      icon: 'Gift',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Antiguedad',
      value: `${Number(user?.membershipDays || 0)} dias`,
      subtitle: 'Tiempo usando la app',
      icon: 'Calendar',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] p-6 mb-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[linear-gradient(135deg,_#1e3f7a_0%,_#42b9d4_100%)] flex items-center justify-center shadow-sm">
          <Icon name="BarChart3" size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-heading-base font-semibold text-text-primary">
            Estadisticas de Cuenta
          </h2>
          <p className="text-body-sm text-text-secondary">
            Una vista mas visual de tu actividad, tus recompensas y tu progreso.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] mb-8">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resumen visual</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900">Tu mes en progreso</h3>
            </div>
            <div className="rounded-2xl bg-sky-50 px-4 py-3 text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Garrafones este mes</p>
              <p className="mt-1 text-2xl font-black text-sky-700">{garrafones.toFixed(1)}</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {monthSummary.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.helper}</p>
                  </div>
                  <p className="text-2xl font-black text-slate-900">{item.value}</p>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full bg-gradient-to-r ${item.color}`} style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(160deg,_#1e3f7a_0%,_#285ea5_45%,_#42b9d4_100%)] p-5 text-white shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Meta de puntos</p>
          <h3 className="mt-2 text-2xl font-black">{currentPoints} puntos</h3>
          <p className="mt-2 text-sm text-white/80">
            Tu siguiente referencia visible esta en {pointsGoal} puntos.
          </p>

          <div className="mt-5 rounded-3xl bg-white/10 p-4 backdrop-blur-sm">
            <div className="flex items-end justify-between gap-2">
              {[25, 45, 65, 90, 100].map((height, index) => (
                <div key={height} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={`w-full max-w-[34px] rounded-t-2xl rounded-b-md ${
                      index <= Math.floor(pointsProgress / 25) ? 'bg-white' : 'bg-white/25'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-[11px] font-semibold text-white/70">
                    {index === 0 ? '0' : index === 1 ? '200' : index === 2 ? '500' : index === 3 ? '800' : '1000'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/85">
            Nivel actual: <span className="font-bold text-white">{monthlyProgress?.pointsLabel || 'Sin beneficio'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {statistics.map((stat) => (
          <div key={stat.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                <Icon name={stat.icon} size={18} className={stat.color} />
              </div>
              <div className="min-w-0">
                <h3 className="text-body-sm font-medium text-text-secondary">
                  {stat.title}
                </h3>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-heading-sm font-bold text-text-primary">
                    {stat.value}
                  </span>
                  <span className="text-body-xs text-text-secondary">
                    {stat.subtitle}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 border-t border-slate-200 pt-6">
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-body-base font-semibold text-text-primary">
                  Un vistazo general de promociones
                </h3>
                <p className="text-body-sm text-text-secondary">
                  {activePromotions.length} promociones activas para tu cuenta.
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                {activePromotions.length} activas
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activePromotions.map((promotion) => (
                <div key={promotion.key} className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name={PROMOTION_ICONS[promotion.key] || 'Gift'} size={18} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-sm font-semibold text-text-primary">
                        {PROMOTION_LABELS[promotion.key] || promotion.title}
                      </p>
                      <p className="text-body-xs text-text-secondary mt-1">
                        {promotion.summary || promotion.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-emerald-200 bg-[linear-gradient(135deg,_rgba(16,185,129,0.08)_0%,_rgba(255,255,255,1)_100%)] p-4 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center">
                <Icon name="Coins" size={18} className="text-success" />
              </div>
              <div>
                <h3 className="text-body-base font-semibold text-text-primary">
                  Proyeccion de recompensas del mes
                </h3>
                <p className="text-body-sm text-text-secondary">
                  Cashback estimado: ${moneyFromCents(monthlyProgress?.estimatedCashbackCents)}
                </p>
                <p className="text-body-sm text-text-secondary">
                  Saldo extra por puntos: ${moneyFromCents(monthlyProgress?.estimatedPointsBonusCents)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-body-base font-semibold text-text-primary">
                Bonificaciones recientes
              </h3>
              <p className="text-body-sm text-text-secondary">
                Historial corto de saldo de regalo acreditado.
              </p>
            </div>
            <div className="rounded-lg bg-success/10 px-3 py-2 text-sm font-semibold text-success">
              ${moneyFromCents(user?.totalBonusEarnedCents)}
            </div>
          </div>

          <div className="space-y-3">
            {(recentBonusCredits.length > 0
              ? recentBonusCredits
              : [{ id: 'empty', description: 'Aun no tienes bonificaciones acreditadas', amountCents: 0, createdAt: null }]
            ).map((credit) => (
              <div key={credit.id} className="rounded-2xl bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-body-sm font-semibold text-text-primary">
                      {credit.description || 'Bonificacion registrada'}
                    </p>
                    <p className="text-body-xs text-text-secondary mt-1">
                      {credit.createdAt
                        ? new Date(credit.createdAt).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Aparecera aqui cuando ganes tu primera bonificacion.'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-body-base font-bold text-success">
                      +${moneyFromCents(credit.amountCents)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountStatistics;
