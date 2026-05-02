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
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
          <Icon name="BarChart3" size={20} className="text-accent" />
        </div>
        <div>
          <h2 className="text-heading-base font-semibold text-text-primary">
            Estadisticas de Cuenta
          </h2>
          <p className="text-body-sm text-text-secondary">
            Tu actividad, tus promociones y tu bonificacion acumulada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {statistics.map((stat) => (
          <div key={stat.title} className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bgColor}`}>
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

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-6 border-t border-border pt-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-body-base font-semibold text-text-primary">
                  Un vistazo general de promociones
                </h3>
                <p className="text-body-sm text-text-secondary">
                  {activePromotions.length} promociones activas para tu cuenta.
                </p>
              </div>
              <div className="rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                {activePromotions.length} activas
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activePromotions.map((promotion) => (
                <div key={promotion.key} className="rounded-xl bg-card border border-border p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
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

          <div className="rounded-xl border border-success/20 bg-success/5 p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-success/15 flex items-center justify-center">
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

        <div className="rounded-xl border border-border bg-muted/20 p-4">
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
              <div key={credit.id} className="rounded-xl bg-card border border-border p-3">
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
