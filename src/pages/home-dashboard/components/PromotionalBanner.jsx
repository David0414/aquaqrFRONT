import React from 'react';
import Icon from '../../../components/AppIcon';

const PROMOTION_ICONS = {
  welcome_first_garrafon: 'Gift',
  topup_bonus: 'WalletCards',
  monthly_cashback: 'BadgePercent',
  monthly_consumption_points: 'Sparkles',
};

function moneyFromCents(amountCents) {
  return (Number(amountCents || 0) / 100).toFixed(2);
}

function formatCurrency(amountCents) {
  return `$${moneyFromCents(amountCents)}`;
}

function getPointsGoal(points) {
  const current = Number(points || 0);
  if (current >= 500) return 1000;
  if (current >= 200) return 500;
  return 200;
}

function getPromotionSummary(promotion, monthlyProgress) {
  const points = Number(monthlyProgress?.points || 0);
  const garrafones = Number(monthlyProgress?.garrafones || 0);

  switch (promotion.key) {
    case 'welcome_first_garrafon':
      return {
        title: 'Garrafon gratis',
        badge: promotion.status?.used ? 'Usado' : 'Disponible',
        message: promotion.status?.used
          ? 'Tu regalo de bienvenida ya fue usado.'
          : 'Ya puedes usar tu primer garrafon gratis.',
        helper: 'Aplica una sola vez.',
      };
    case 'topup_bonus':
      return {
        title: 'Bono por recarga',
        badge: 'Disponible',
        message: 'Recarga saldo y recibe saldo extra en montos participantes.',
        helper: Array.isArray(promotion.config?.tiers) && promotion.config.tiers.length
          ? promotion.config.tiers.map((tier) => tier.label).join(' · ')
          : 'Consulta montos con bono.',
      };
    case 'monthly_cashback':
      return {
        title: 'Cashback mensual',
        badge: `${formatCurrency(monthlyProgress?.estimatedCashbackCents)} acumulado`,
        message: `Llevas ${garrafones.toFixed(1)} de 10 garrafones este mes.`,
        helper: 'Al cierre del mes se calcula tu cashback.',
      };
    case 'monthly_consumption_points':
      return {
        title: 'Puntos del mes',
        badge: `${points} puntos`,
        message: `Tu siguiente meta es ${getPointsGoal(points)} puntos.`,
        helper: `Nivel actual: ${monthlyProgress?.pointsLabel || 'Sin beneficio'}.`,
      };
    default:
      return {
        title: promotion.title,
        badge: 'Activa',
        message: promotion.summary || promotion.description || 'Promocion disponible.',
        helper: '',
      };
  }
}

export default function PromotionalBanner({
  promotions = [],
  monthlyProgress = null,
  welcomeReward = null,
  bonusBalanceCents = 0,
}) {
  const featuredPromotions = promotions.slice(0, 4);
  const points = Number(monthlyProgress?.points || 0);
  const pointsGoal = getPointsGoal(points);
  const pointsPercent = Math.max(0, Math.min(100, (points / pointsGoal) * 100));
  const garrafones = Number(monthlyProgress?.garrafones || 0);
  const cashbackPercent = Math.max(0, Math.min(100, (garrafones / 10) * 100));

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Promociones</p>
          <h2 className="mt-2 text-2xl font-black text-text-primary">Tus beneficios disponibles</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Aqui ves que promocion tienes, si ya esta activa y que te falta para ganar mas.
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Saldo promocional</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{formatCurrency(bonusBalanceCents)}</p>
        </div>
      </div>

      {welcomeReward?.available ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
              <Icon name="Gift" size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-text-primary">Tienes un garrafon gratis</p>
              <p className="text-sm text-text-secondary">Ya esta disponible para usar.</p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {featuredPromotions.map((promotion) => {
          const summary = getPromotionSummary(promotion, monthlyProgress);
          return (
            <article key={promotion.key} className="rounded-2xl border border-border bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1E3F7A] shadow-sm">
                  <Icon name={PROMOTION_ICONS[promotion.key] || 'Gift'} size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-text-primary">{summary.title}</h3>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#1E3F7A]">
                      {summary.badge}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text-primary">{summary.message}</p>
                  {summary.helper ? (
                    <p className="mt-2 text-sm text-text-secondary">{summary.helper}</p>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">Avance a cashback</p>
              <p className="mt-1 text-sm text-text-secondary">{garrafones.toFixed(1)} de 10 garrafones</p>
            </div>
            <p className="text-lg font-black text-emerald-700">{formatCurrency(monthlyProgress?.estimatedCashbackCents)}</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,_#10b981_0%,_#2dd4bf_100%)]" style={{ width: `${cashbackPercent}%` }} />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-text-primary">Avance a puntos</p>
              <p className="mt-1 text-sm text-text-secondary">{points} de {pointsGoal} puntos</p>
            </div>
            <p className="text-lg font-black text-sky-700">{monthlyProgress?.pointsLabel || 'Sin beneficio'}</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,_#2563eb_0%,_#22d3ee_100%)]" style={{ width: `${pointsPercent}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
