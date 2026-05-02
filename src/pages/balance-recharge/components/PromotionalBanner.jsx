import React from 'react';
import Icon from '../../../components/AppIcon';

const PROMOTION_ICONS = {
  welcome_first_garrafon: 'Gift',
  topup_bonus: 'WalletCards',
  monthly_cashback: 'BadgePercent',
  monthly_consumption_points: 'Sparkles',
};

const PromotionalBanner = ({ promotions = [] }) => {
  const activePromotions = promotions
    .filter((promotion) => promotion.isActive && promotion.key !== 'premium_membership')
    .slice(0, 4);

  if (activePromotions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {activePromotions.map((promotion) => (
        <div
          key={promotion.key}
          className="p-4 rounded-xl border border-border bg-gradient-to-r from-white to-sky-50/70"
        >
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-white shadow-sm text-primary">
              <Icon name={PROMOTION_ICONS[promotion.key] || 'Gift'} size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-text-primary">
                  {promotion.title}
                </h3>
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-success">
                  Activa
                </span>
              </div>
              <p className="text-text-secondary text-body-sm mt-1">
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
  );
};

export default PromotionalBanner;
