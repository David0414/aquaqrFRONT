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

function formatCurrency(amountCents) {
  return `$${moneyFromCents(amountCents)}`;
}

function getSimplePromotionExplanation(promotion, monthlyProgress) {
  switch (promotion.key) {
    case 'welcome_first_garrafon':
      return 'Se activa una sola vez al registrarte y te regala tu primer garrafon.';
    case 'topup_bonus':
      return 'Cuando recargas ciertos montos, el sistema te deposita saldo extra automaticamente.';
    case 'monthly_cashback':
      return `Este mes llevas ${Number(monthlyProgress?.garrafones || 0).toFixed(1)} garrafones. Tu cashback se calcula por garrafones consumidos.`;
    case 'monthly_consumption_points':
      return `Tus puntos salen de tu consumo del mes: ${monthlyProgress?.points || 0} puntos acumulados hasta ahora.`;
    default:
      return promotion.summary || promotion.description;
  }
}

const PromotionalBanner = ({
  promotions = [],
  monthlyProgress = null,
  welcomeReward = null,
  bonusBalanceCents = 0,
  recentBonusCredits = [],
}) => {
  const featuredPromotions = promotions.slice(0, 4);
  const lastBonus = recentBonusCredits[0] || null;
  const cashbackPerGarrafon = Number(monthlyProgress?.cashbackPerGarrafonCents || 0) / 100;

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      {welcomeReward?.available ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
              <Icon name="Gift" size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Felicidades</p>
              <h3 className="mt-1 text-lg font-black text-text-primary">Tienes 1 garrafon gratis</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Tu recompensa de primera vez ya esta disponible para usarla.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">Promociones activas</p>
          <h2 className="mt-2 text-2xl font-black text-text-primary">Tus promociones, en simple</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
            Aqui solo te mostramos lo importante: que ya tienes hoy y como se calculan los beneficios del mes.
          </p>
        </div>
        <div className="rounded-2xl bg-sky-50 px-4 py-3 md:max-w-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">Hoy ya tienes</p>
          <p className="mt-1 text-lg font-bold text-text-primary">
            {formatCurrency(bonusBalanceCents)} de saldo promocional
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            Es el saldo de regalo que ya fue abonado a tu cuenta y ya puedes usar.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0F9F6E] shadow-sm">
              <Icon name="Wallet" size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-text-primary">De donde sale tu saldo de regalo</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Sale de promociones ya aplicadas a tu cuenta, como bienvenida, recargas con bono o recompensas mensuales.
              </p>
              <p className="mt-3 text-sm font-semibold text-[#1E3F7A]">
                {lastBonus
                  ? `Ultimo abono registrado: ${lastBonus.description || 'Promocion aplicada'} por ${formatCurrency(lastBonus.amountCents)}.`
                  : 'Todavia no tienes un abono promocional registrado.'}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-slate-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1E3F7A] shadow-sm">
              <Icon name="Calculator" size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-text-primary">Como se calculan los numeros del mes</h3>
              <p className="mt-2 text-sm text-text-secondary">
                Llevas {Number(monthlyProgress?.garrafones || 0).toFixed(1)} garrafones y {monthlyProgress?.points || 0} puntos este mes.
              </p>
              <p className="mt-3 text-sm font-semibold text-[#1E3F7A]">
                Cashback estimado: {Number.isFinite(cashbackPerGarrafon) ? `$${cashbackPerGarrafon.toFixed(2)}` : '$0.00'} por garrafon.
              </p>
              <p className="mt-1 text-sm font-semibold text-[#1E3F7A]">
                Bono por puntos: {monthlyProgress?.bonusPercent || 0}% segun tu nivel actual.
              </p>
            </div>
          </div>
        </article>

        {featuredPromotions.map((promotion) => (
          <article key={promotion.key} className="rounded-2xl border border-border bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1E3F7A] shadow-sm">
                <Icon name={PROMOTION_ICONS[promotion.key] || 'Gift'} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text-primary">{promotion.title}</h3>
                  {promotion.key === 'welcome_first_garrafon' && promotion.status?.used ? (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700">
                      Usada
                    </span>
                  ) : (
                    <span className="rounded-full bg-[#0F9F6E]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#0F9F6E]">
                      {promotion.key === 'welcome_first_garrafon' && promotion.status?.available ? 'Disponible' : 'Activa'}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-text-secondary">
                  {getSimplePromotionExplanation(promotion, monthlyProgress)}
                </p>
                {promotion.key === 'monthly_cashback' ? (
                  <p className="mt-3 text-sm font-semibold text-[#1E3F7A]">
                    Ahorita vas acumulando {formatCurrency(monthlyProgress?.estimatedCashbackCents)}.
                  </p>
                ) : null}
                {promotion.key === 'monthly_consumption_points' ? (
                  <p className="mt-3 text-sm font-semibold text-[#1E3F7A]">
                    Si hoy cerrara el mes, tu bono extra seria de {formatCurrency(monthlyProgress?.estimatedPointsBonusCents)}.
                  </p>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default PromotionalBanner;
