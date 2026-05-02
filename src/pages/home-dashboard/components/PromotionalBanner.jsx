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

const PromotionalBanner = ({ promotions = [], monthlyProgress = null, recentBonusCredits = [] }) => {
  const featuredPromotions = promotions.slice(0, 4);

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Promociones activas</p>
          <h2 className="mt-2 text-2xl font-black text-text-primary">Tu motor de recompensas</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Todas estas promociones se administran desde monitoreo y tu saldo de regalo se separa del dinero real.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">Proyeccion del mes</p>
          <p className="mt-1 text-lg font-bold text-text-primary">
            ${moneyFromCents(monthlyProgress?.estimatedCashbackCents)} cashback + ${moneyFromCents(monthlyProgress?.estimatedPointsBonusCents)} extra
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {featuredPromotions.map((promotion) => (
          <article key={promotion.key} className="rounded-2xl border border-border bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1E3F7A] shadow-sm">
                <Icon name={PROMOTION_ICONS[promotion.key] || 'Gift'} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text-primary">{promotion.title}</h3>
                  <span className="rounded-full bg-[#0F9F6E]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#0F9F6E]">
                    Activa
                  </span>
                </div>
                <p className="mt-2 text-sm text-text-secondary">{promotion.summary || promotion.description}</p>
                {promotion.key === 'monthly_cashback' ? (
                  <p className="mt-3 text-sm font-semibold text-[#1E3F7A]">
                    Estimado actual: ${moneyFromCents(monthlyProgress?.estimatedCashbackCents)}.
                  </p>
                ) : null}
                {promotion.key === 'monthly_consumption_points' ? (
                  <p className="mt-3 text-sm font-semibold text-[#1E3F7A]">
                    {monthlyProgress?.points || 0} puntos acumulados este mes.
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-slate-50 p-4">
        <div className="flex items-center gap-2">
          <Icon name="ReceiptText" size={18} className="text-[#42B9D4]" />
          <h3 className="text-sm font-bold text-text-primary">Ultimas bonificaciones acreditadas</h3>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {(recentBonusCredits.length > 0 ? recentBonusCredits : [{ id: 'empty', description: 'Aun no tienes bonificaciones acreditadas', amount: 0, createdAt: null }]).slice(0, 3).map((item) => (
            <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-text-primary">{item.description || 'Sin bonificacion registrada'}</p>
              <p className="mt-2 text-2xl font-black text-[#0F9F6E]">${Number(item.amount || 0).toFixed(2)}</p>
              <p className="mt-1 text-xs text-text-secondary">
                {item.createdAt ? new Date(item.createdAt).toLocaleDateString('es-MX') : 'Cuando ganes una, aparecera aqui.'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromotionalBanner;
