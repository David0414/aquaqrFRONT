import React from 'react';
import Icon from '../../../components/AppIcon';

const PROMOTION_ICONS = {
  welcome_first_garrafon: 'Gift',
  topup_bonus: 'WalletCards',
  monthly_cashback: 'BadgePercent',
  monthly_consumption_points: 'Sparkles',
};

export default function PromotionalBanner({ promotions = [] }) {
  const activePromotions = promotions
    .filter((promotion) => promotion.isActive && promotion.key !== 'premium_membership')
    .slice(0, 4);

  if (activePromotions.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">Promociones</p>
        <h2 className="mt-2 text-xl font-black text-text-primary">Beneficios disponibles</h2>
      </div>

      <div className="space-y-3">
        {activePromotions.map((promotion) => (
          <div
            key={promotion.key}
            className="rounded-xl border border-border bg-gradient-to-r from-white to-sky-50/70 p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="rounded-lg bg-white p-2 text-primary shadow-sm">
                <Icon name={PROMOTION_ICONS[promotion.key] || 'Gift'} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-text-primary">{promotion.title}</h3>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-success">
                    {promotion.key === 'welcome_first_garrafon' && promotion.status?.used
                      ? 'Usada'
                      : promotion.key === 'welcome_first_garrafon' && promotion.status?.available
                        ? 'Disponible'
                        : 'Activa'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  {promotion.summary || promotion.description}
                </p>

                {promotion.key === 'topup_bonus' && Array.isArray(promotion.config?.tiers) ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {promotion.config.tiers.map((tier) => (
                      <span
                        key={`${promotion.key}-${tier.amountCents}`}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                      >
                        {tier.label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
