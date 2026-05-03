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

function getPointsTierInfo(points, promotion) {
  const tiers = Array.isArray(promotion?.config?.tiers) ? [...promotion.config.tiers] : [];
  const current = tiers
    .filter((tier) => points >= Number(tier.minPoints || 0))
    .sort((a, b) => Number(b.minPoints || 0) - Number(a.minPoints || 0))[0] || null;
  const next = tiers
    .filter((tier) => Number(tier.minPoints || 0) > points)
    .sort((a, b) => Number(a.minPoints || 0) - Number(b.minPoints || 0))[0] || null;
  return { current, next };
}

function getCashbackTierInfo(garrafones, promotion) {
  const tiers = Array.isArray(promotion?.config?.tiers) ? [...promotion.config.tiers] : [];
  const current = tiers.find((tier) => tier.maxGarrafones == null || garrafones <= Number(tier.maxGarrafones)) || null;
  const next = tiers.find((tier) => tier.maxGarrafones != null && garrafones < Number(tier.maxGarrafones)) || null;
  return { current, next };
}

function getNextAction(promotions, monthlyProgress) {
  const topup = promotions.find((promotion) => promotion.key === 'topup_bonus');
  const pointsPromo = promotions.find((promotion) => promotion.key === 'monthly_consumption_points');
  const cashbackPromo = promotions.find((promotion) => promotion.key === 'monthly_cashback');
  const points = Number(monthlyProgress?.points || 0);
  const garrafones = Number(monthlyProgress?.garrafones || 0);

  if (pointsPromo?.isActive) {
    const { next } = getPointsTierInfo(points, pointsPromo);
    if (next) {
      const missing = Math.max(0, Number(next.minPoints || 0) - points);
      return {
        title: 'Tu siguiente recompensa',
        message: `Te faltan ${missing} puntos para llegar a ${next.bonusPercent}% extra.`,
        helper: `Cada litro te da ${Number(pointsPromo.config?.pointsPerLiter || 0)} puntos.`,
      };
    }
  }

  if (cashbackPromo?.isActive && garrafones < 10) {
    const missing = Math.max(0, 10 - garrafones);
    return {
      title: 'Tu siguiente recompensa',
      message: `Te faltan ${missing.toFixed(1)} garrafones para mejorar tu cashback.`,
      helper: 'El cashback se deposita al cierre del mes.',
    };
  }

  if (topup?.isActive) {
    const recommendedTier = Array.isArray(topup.config?.tiers)
      ? [...topup.config.tiers].sort((a, b) => Number(a.bonusCents || 0) - Number(b.bonusCents || 0))[1] || topup.config.tiers[0]
      : null;
    if (recommendedTier) {
      return {
        title: 'Tu siguiente mejor accion',
        message: recommendedTier.label,
        helper: 'El saldo extra se abona en cuanto se confirme tu recarga.',
      };
    }
  }

  return null;
}

function WelcomePromotionCard({ promotion }) {
  const available = promotion?.status?.available;
  const used = promotion?.status?.used;

  return (
    <article className="rounded-2xl border border-border bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1E3F7A] shadow-sm">
          <Icon name={PROMOTION_ICONS.welcome_first_garrafon} size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-text-primary">Garrafon gratis</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#1E3F7A]">
              {available ? 'Disponible' : used ? 'Usado' : 'Activo'}
            </span>
          </div>
          <p className="mt-2 text-sm text-text-primary">
            {available ? 'Ya puedes usar tu regalo de bienvenida.' : 'Tu regalo de bienvenida aplica una sola vez.'}
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            {used ? 'Esta promocion ya fue utilizada.' : 'Se activa solo en tu primera compra.'}
          </p>
        </div>
      </div>
    </article>
  );
}

function TopupPromotionCard({ promotion }) {
  const tiers = Array.isArray(promotion?.config?.tiers) ? promotion.config.tiers : [];

  return (
    <article className="rounded-2xl border border-border bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1E3F7A] shadow-sm">
          <Icon name={PROMOTION_ICONS.topup_bonus} size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-text-primary">Bono por recarga</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#1E3F7A]">
              Disponible
            </span>
          </div>
          <p className="mt-2 text-sm text-text-primary">
            Recarga saldo y recibe dinero extra.
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            El bono se deposita en cuanto se confirme tu recarga.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tiers.map((tier) => (
              <div key={`${promotion.key}-${tier.amountCents}`} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#1E3F7A]">
                {tier.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function CashbackPromotionCard({ promotion, monthlyProgress }) {
  const garrafones = Number(monthlyProgress?.garrafones || 0);
  const estimatedCashbackCents = Number(monthlyProgress?.estimatedCashbackCents || 0);
  const { current } = getCashbackTierInfo(garrafones, promotion);
  const currentRate = Number(current?.cashbackPerGarrafonCents || 0);
  const nextThreshold = garrafones < 5 ? 5 : garrafones < 10 ? 10 : null;
  const nextRate = garrafones < 5 ? 300 : garrafones < 10 ? 400 : null;
  const progressTarget = nextThreshold || 10;
  const progress = Math.max(0, Math.min(100, (garrafones / progressTarget) * 100));

  return (
    <article className="rounded-2xl border border-border bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
          <Icon name={PROMOTION_ICONS.monthly_cashback} size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-text-primary">Cashback mensual</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              {formatCurrency(estimatedCashbackCents)} acumulado
            </span>
          </div>
          <p className="mt-2 text-sm text-text-primary">
            Compras agua durante el mes y al final del mes te depositamos saldo extra.
          </p>
          <div className="mt-3 rounded-xl bg-white p-3">
            <p className="text-sm font-semibold text-text-primary">Hoy vas en {garrafones.toFixed(1)} garrafones</p>
            <p className="mt-1 text-sm text-text-secondary">
              Tu nivel actual paga {formatCurrency(currentRate)} por garrafon.
            </p>
            {nextThreshold ? (
              <p className="mt-1 text-sm text-text-secondary">
                Te faltan {(nextThreshold - garrafones).toFixed(1)} garrafones para subir a {formatCurrency(nextRate)} por garrafon.
              </p>
            ) : (
              <p className="mt-1 text-sm text-text-secondary">Ya estas en el nivel mas alto de cashback.</p>
            )}
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,_#10b981_0%,_#2dd4bf_100%)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}

function PointsPromotionCard({ promotion, monthlyProgress }) {
  const points = Number(monthlyProgress?.points || 0);
  const estimatedPointsBonusCents = Number(monthlyProgress?.estimatedPointsBonusCents || 0);
  const pointsPerLiter = Number(promotion?.config?.pointsPerLiter || 0);
  const { current, next } = getPointsTierInfo(points, promotion);
  const currentPercent = Number(current?.bonusPercent || 0);
  const nextTarget = Number(next?.minPoints || current?.minPoints || points || 0);
  const missing = next ? Math.max(0, nextTarget - points) : 0;
  const progress = next ? Math.max(0, Math.min(100, (points / nextTarget) * 100)) : 100;

  return (
    <article className="rounded-2xl border border-border bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
          <Icon name={PROMOTION_ICONS.monthly_consumption_points} size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-bold text-text-primary">Puntos del mes</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
              {points} puntos
            </span>
          </div>
          <p className="mt-2 text-sm text-text-primary">
            Cada litro que compras te da {pointsPerLiter} puntos.
          </p>
          <div className="mt-3 rounded-xl bg-white p-3">
            <p className="text-sm font-semibold text-text-primary">
              Ya desbloqueaste {currentPercent}% extra.
            </p>
            {next ? (
              <p className="mt-1 text-sm text-text-secondary">
                Te faltan {missing} puntos para llegar a {next.bonusPercent}% extra.
              </p>
            ) : (
              <p className="mt-1 text-sm text-text-secondary">Ya estas en el nivel mas alto.</p>
            )}
            <p className="mt-1 text-sm text-text-secondary">
              Si hoy cerrara el mes, recibirias {formatCurrency(estimatedPointsBonusCents)}.
            </p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,_#2563eb_0%,_#22d3ee_100%)]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PromotionalBanner({
  promotions = [],
  monthlyProgress = null,
  welcomeReward = null,
  bonusBalanceCents = 0,
}) {
  const orderedPromotions = promotions.slice(0, 4);
  const nextAction = getNextAction(orderedPromotions, monthlyProgress);

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Promociones</p>
          <h2 className="mt-2 text-2xl font-black text-text-primary">Tus beneficios explicados simple</h2>
          <p className="mt-2 text-sm text-text-secondary">
            Te mostramos que tienes, como funciona y que te falta para ganar mas.
          </p>
        </div>

        <div className="rounded-2xl bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Promociones ya ganadas</p>
          <p className="mt-1 text-2xl font-black text-emerald-700">{formatCurrency(bonusBalanceCents)}</p>
        </div>
      </div>

      {nextAction ? (
        <div className="mt-5 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">{nextAction.title}</p>
          <p className="mt-2 text-lg font-black text-text-primary">{nextAction.message}</p>
          <p className="mt-1 text-sm text-text-secondary">{nextAction.helper}</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {orderedPromotions.map((promotion) => {
          if (promotion.key === 'welcome_first_garrafon') {
            return <WelcomePromotionCard key={promotion.key} promotion={promotion} welcomeReward={welcomeReward} />;
          }
          if (promotion.key === 'topup_bonus') {
            return <TopupPromotionCard key={promotion.key} promotion={promotion} />;
          }
          if (promotion.key === 'monthly_cashback') {
            return <CashbackPromotionCard key={promotion.key} promotion={promotion} monthlyProgress={monthlyProgress} />;
          }
          if (promotion.key === 'monthly_consumption_points') {
            return <PointsPromotionCard key={promotion.key} promotion={promotion} monthlyProgress={monthlyProgress} />;
          }
          return null;
        })}
      </div>
    </section>
  );
}
