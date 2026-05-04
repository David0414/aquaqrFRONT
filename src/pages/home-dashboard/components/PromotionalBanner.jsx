import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

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
  return { current, next, tiers };
}

function getCashbackTierInfo(garrafones, promotion) {
  const tiers = Array.isArray(promotion?.config?.tiers) ? [...promotion.config.tiers] : [];
  const current = tiers.find((tier) => tier.maxGarrafones == null || garrafones <= Number(tier.maxGarrafones)) || null;
  return { current, tiers };
}

function StatusPill({ children, tone = 'slate' }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${styles[tone] || styles.slate}`}>
      {children}
    </span>
  );
}

function StepRow({ icon, title, text, tone = 'sky' }) {
  const tones = {
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="flex items-start gap-3 rounded-[1.4rem] bg-white p-3 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone] || tones.sky}`}>
        <Icon name={icon} size={18} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{text}</p>
      </div>
    </div>
  );
}

function SimpleTable({ columns, rows, accent = 'sky' }) {
  const accents = {
    sky: 'bg-sky-50 text-sky-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  };

  return (
    <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white">
      <div className="grid grid-cols-2 border-b border-slate-100 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {columns.map((column) => (
          <div key={column} className="px-4 py-3">{column}</div>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row[0]} className="grid grid-cols-2 border-b border-slate-100 last:border-b-0">
          <div className="px-4 py-3 text-sm font-semibold text-slate-900">{row[0]}</div>
          <div className="px-4 py-3">
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${accents[accent] || accents.sky}`}>{row[1]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function SelectionChooser({
  selection,
  selectablePromotions,
  selectedPromotionKeys,
  onToggleSelection,
  onSaveSelection,
  savingSelection,
}) {
  const requiredCount = Number(selection?.requiredCount || 0);
  const canSave = requiredCount === 0 || selectedPromotionKeys.length === requiredCount;

  if (requiredCount === 0) {
    return null;
  }

  return (
    <section className="rounded-[1.9rem] border border-sky-100 bg-[linear-gradient(135deg,_#eff6ff_0%,_#ffffff_100%)] p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">Tus promociones del mes</p>
          <h3 className="mt-2 text-2xl font-black text-slate-900">Elige {requiredCount} promociones</h3>
          <p className="mt-2 text-sm text-slate-500">
            Estas serán las que funcionen para ti durante este mes.
          </p>
        </div>
        <div className="rounded-[1.3rem] bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Elegidas</p>
          <p className="mt-1 text-2xl font-black text-[#1E3F7A]">{selectedPromotionKeys.length}/{requiredCount}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {selectablePromotions.map((promotion) => {
          const selected = selectedPromotionKeys.includes(promotion.key);
          const disabled = !selected && selectedPromotionKeys.length >= requiredCount;

          return (
            <button
              key={promotion.key}
              type="button"
              onClick={() => onToggleSelection?.(promotion.key)}
              disabled={disabled}
              className={`rounded-[1.6rem] border p-4 text-left transition-all duration-200 ${
                selected
                  ? 'border-[#1E3F7A] bg-[#1E3F7A] text-white shadow-[0_14px_30px_rgba(30,63,122,0.18)]'
                  : disabled
                    ? 'border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-white bg-white text-slate-900 shadow-sm hover:-translate-y-0.5'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-[1.2rem] ${selected ? 'bg-white/15 text-white' : 'bg-sky-50 text-[#1E3F7A]'}`}>
                  <Icon name={PROMOTION_ICONS[promotion.key] || 'Gift'} size={20} />
                </div>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${selected ? 'border-white bg-white text-[#1E3F7A]' : 'border-slate-300 bg-white text-transparent'}`}>
                  <Icon name="Check" size={14} />
                </div>
              </div>
              <p className="mt-4 text-lg font-black">{promotion.title}</p>
              <p className={`mt-2 text-sm ${selected ? 'text-white/80' : 'text-slate-500'}`}>
                {promotion.summary || promotion.description}
              </p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {selection.complete
            ? 'Ya tienes promociones activas para este mes.'
            : 'Elige tus promociones para activar sus beneficios.'}
        </p>
        <Button onClick={onSaveSelection} disabled={!canSave} loading={savingSelection}>
          Guardar mis promociones
        </Button>
      </div>
    </section>
  );
}

function WelcomePromotionCard({ promotion }) {
  const available = promotion?.status?.available;
  const used = promotion?.status?.used;

  return (
    <article className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,_#fff7ed_0%,_#ffffff_100%)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-white text-amber-600 shadow-sm">
          <Icon name={PROMOTION_ICONS.welcome_first_garrafon} size={20} />
        </div>
        <StatusPill tone="amber">{available ? 'Disponible' : used ? 'Usada' : 'Activa'}</StatusPill>
      </div>
      <h3 className="mt-4 text-xl font-black text-slate-900">Garrafón gratis</h3>
      <p className="mt-2 text-sm text-slate-600">
        {available ? 'Tu primera compra puede salir gratis.' : 'Es una promo de una sola vez.'}
      </p>
      <div className="mt-4 rounded-[1.3rem] bg-white/90 p-4">
        <p className="text-sm font-semibold text-slate-900">Cómo funciona</p>
        <p className="mt-1 text-sm text-slate-500">1. Haces tu primera compra. 2. La promo se aplica una sola vez.</p>
      </div>
    </article>
  );
}

function TopupPromotionCard({ promotion }) {
  const tiers = Array.isArray(promotion?.config?.tiers) ? promotion.config.tiers : [];

  return (
    <article className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,_#eff6ff_0%,_#ffffff_100%)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-white text-sky-700 shadow-sm">
          <Icon name={PROMOTION_ICONS.topup_bonus} size={20} />
        </div>
        <StatusPill tone="sky">Elegida</StatusPill>
      </div>
      <h3 className="mt-4 text-xl font-black text-slate-900">Bono por recarga</h3>
      <p className="mt-2 text-sm text-slate-600">Recargas saldo y recibes más dinero en ese momento.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StepRow icon="Wallet" title="1. Recarga" text="Elige un monto." tone="sky" />
        <StepRow icon="BadgePlus" title="2. Ganas extra" text="Te damos saldo adicional." tone="emerald" />
        <StepRow icon="CreditCard" title="3. Lo usas" text="Tu saldo sube al confirmarse." tone="amber" />
      </div>
      <div className="mt-4">
        <SimpleTable
          columns={['Recarga', 'Recibes']}
          rows={tiers.map((tier) => [`$${moneyFromCents(tier.amountCents)}`, `$${moneyFromCents(Number(tier.amountCents || 0) + Number(tier.bonusCents || 0))}`])}
          accent="sky"
        />
      </div>
    </article>
  );
}

function CashbackPromotionCard({ promotion, monthlyProgress }) {
  const garrafones = Number(monthlyProgress?.garrafones || 0);
  const estimatedCashbackCents = Number(monthlyProgress?.estimatedCashbackCents || 0);
  const { current, tiers } = getCashbackTierInfo(garrafones, promotion);
  const currentRate = Number(current?.cashbackPerGarrafonCents || 0);
  const nextThreshold = garrafones < 5 ? 5 : garrafones < 10 ? 10 : null;
  const progressTarget = nextThreshold || 10;
  const progress = Math.max(0, Math.min(100, (garrafones / progressTarget) * 100));

  return (
    <article className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,_#ecfdf5_0%,_#ffffff_100%)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-white text-emerald-600 shadow-sm">
          <Icon name={PROMOTION_ICONS.monthly_cashback} size={20} />
        </div>
        <StatusPill tone="emerald">Elegida</StatusPill>
      </div>
      <h3 className="mt-4 text-xl font-black text-slate-900">Cashback mensual</h3>
      <p className="mt-2 text-sm text-slate-600">Compras agua durante el mes y al final del mes recibes saldo extra.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StepRow icon="Droplets" title="1. Compras agua" text="Cada garrafón cuenta." tone="emerald" />
        <StepRow icon="BarChart3" title="2. Acumulas" text="Sumas garrafones en el mes." tone="sky" />
        <StepRow icon="Wallet" title="3. Recibes saldo" text="Se deposita al cierre del mes." tone="amber" />
      </div>

      <div className="mt-4 rounded-[1.35rem] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Llevas {garrafones.toFixed(1)} garrafones</p>
            <p className="mt-1 text-sm text-slate-500">Has acumulado {formatCurrency(estimatedCashbackCents)}</p>
          </div>
          <StatusPill tone="emerald">{formatCurrency(currentRate)} por garrafón</StatusPill>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,_#10b981_0%,_#34d399_100%)]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {nextThreshold
            ? `Te faltan ${(nextThreshold - garrafones).toFixed(1)} garrafones para subir.`
            : 'Ya estás en el nivel más alto.'}
        </p>
      </div>

      <div className="mt-4">
        <SimpleTable
          columns={['Si llegas a', 'Recibes']}
          rows={tiers.map((tier) => {
            const label = tier.maxGarrafones == null ? 'Más de 10 garrafones' : `Hasta ${tier.maxGarrafones} garrafones`;
            return [label, `${formatCurrency(tier.cashbackPerGarrafonCents)} por garrafón`];
          })}
          accent="emerald"
        />
      </div>
    </article>
  );
}

function PointsPromotionCard({ promotion, monthlyProgress }) {
  const points = Number(monthlyProgress?.points || 0);
  const estimatedPointsBonusCents = Number(monthlyProgress?.estimatedPointsBonusCents || 0);
  const pointsPerLiter = Number(promotion?.config?.pointsPerLiter || 0);
  const { current, next, tiers } = getPointsTierInfo(points, promotion);
  const currentPercent = Number(current?.bonusPercent || 0);
  const nextTarget = Number(next?.minPoints || current?.minPoints || points || 0);
  const missing = next ? Math.max(0, nextTarget - points) : 0;
  const progress = next ? Math.max(0, Math.min(100, (points / nextTarget) * 100)) : 100;

  return (
    <article className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,_#f0f9ff_0%,_#ffffff_100%)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-white text-sky-700 shadow-sm">
          <Icon name={PROMOTION_ICONS.monthly_consumption_points} size={20} />
        </div>
        <StatusPill tone="sky">Elegida</StatusPill>
      </div>
      <h3 className="mt-4 text-xl font-black text-slate-900">Puntos del mes</h3>
      <p className="mt-2 text-sm text-slate-600">Cada litro que compras te da puntos. Entre más puntos, más porcentaje extra ganas.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StepRow icon="Droplets" title="1. Compras agua" text={`1 litro = ${pointsPerLiter} puntos`} tone="sky" />
        <StepRow icon="Sparkles" title="2. Subes puntos" text="Tus puntos se suman en el mes." tone="emerald" />
        <StepRow icon="Wallet" title="3. Ganas extra" text="Al cierre del mes recibes el bono." tone="amber" />
      </div>

      <div className="mt-4 rounded-[1.35rem] bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Tienes {points} puntos</p>
            <p className="mt-1 text-sm text-slate-500">Ya desbloqueaste {currentPercent}% extra</p>
          </div>
          <StatusPill tone="sky">Si hoy cerrara el mes: {formatCurrency(estimatedPointsBonusCents)}</StatusPill>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-[linear-gradient(90deg,_#2563eb_0%,_#22d3ee_100%)]" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-500">
          {next ? `Te faltan ${missing} puntos para subir a ${next.bonusPercent}% extra.` : 'Ya estás en el nivel más alto.'}
        </p>
      </div>

      <div className="mt-4">
        <SimpleTable
          columns={['Puntos', 'Bono']}
          rows={tiers.filter((tier) => Number(tier.bonusPercent || 0) > 0).map((tier) => [`${tier.minPoints} puntos`, `${tier.bonusPercent}% extra`])}
          accent="sky"
        />
      </div>
    </article>
  );
}

export default function PromotionalBanner({
  promotions = [],
  monthlyProgress = null,
  bonusBalanceCents = 0,
  selection = null,
  selectedPromotionKeys = [],
  onToggleSelection,
  onSaveSelection,
  savingSelection = false,
}) {
  const selectablePromotions = (selection?.selectablePromotions || []).slice().sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
  const visiblePromotions = promotions
    .filter((promotion) => !promotion.requiresMonthlySelection || promotion.isSelectedForMonth)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Promociones</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Elige tus 2 promociones del mes</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Lo que elijas aquí será lo que sí funcione para ti durante este mes.
          </p>
        </div>

        <div className="rounded-[1.6rem] bg-emerald-50 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Saldo de promociones</p>
          <p className="mt-1 text-3xl font-black text-emerald-700">{formatCurrency(bonusBalanceCents)}</p>
        </div>
      </div>

      <div className="mt-5">
        <SelectionChooser
          selection={selection}
          selectablePromotions={selectablePromotions}
          selectedPromotionKeys={selectedPromotionKeys}
          onToggleSelection={onToggleSelection}
          onSaveSelection={onSaveSelection}
          savingSelection={savingSelection}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {visiblePromotions.map((promotion) => {
          if (promotion.key === 'welcome_first_garrafon') {
            return <WelcomePromotionCard key={promotion.key} promotion={promotion} />;
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
