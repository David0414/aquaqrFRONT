import React, { useEffect, useState } from 'react';
import Icon from '../../components/AppIcon';

const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

export default function MembershipPlans({ promotions, machine, walletCents, preferredKey, purchasingKey,
  onPurchase, onRecharge, onScan, onDispense, error }) {
  const plans = promotions.filter((promotion) => promotion.kind === 'membership');
  const active = plans.find((plan) => plan.status?.purchased);
  const [chosenKey, setChosenKey] = useState(preferredKey || active?.key || plans[0]?.key || '');
  useEffect(() => { if (active?.key) setChosenKey(active.key); }, [active?.key]);
  const selected = plans.find((plan) => plan.key === chosenKey) || plans[0];
  if (!selected) return <p className="rounded-2xl bg-white p-4 text-sm text-slate-600">No hay membresías disponibles.</p>;
  const config = selected.config || {};
  const paid = Boolean(selected.status?.purchased);
  const availablePrice = Boolean(machine && Number(config.purchasePriceCents) > 0);
  const price = paid ? selected.status.pricePaidCents : config.purchasePriceCents;
  const busy = Boolean(purchasingKey);
  const enoughBalance = availablePrice && Number(walletCents) >= Number(price);
  return (
    <section className="space-y-3 pb-28" aria-label="Membresías">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-900">{active ? 'Tu membresía' : 'Elige tu membresía'}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{active ? '1/1 activada' : '0/1 activadas'}</span>
      </div>
      <div className="grid grid-cols-3 gap-2" aria-label="Paquetes disponibles">
        {plans.map((plan) => <button key={plan.key} type="button" aria-pressed={plan.key === selected.key}
          disabled={busy || Boolean(active && active.key !== plan.key)} onClick={() => setChosenKey(plan.key)}
          className={`rounded-xl border px-2 py-3 text-sm font-semibold disabled:opacity-50 ${plan.key === selected.key ? 'border-sky-600 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-600'}`}>
          {plan.config.garrafones} garrafones
        </button>)}
      </div>
      <article className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div><h2 className="text-lg font-bold text-slate-900">{config.garrafones} garrafones de 20 litros</h2>
            <p className="mt-1 text-sm text-slate-500">{config.garrafones * 20} litros incluidos · Hasta agotarlos</p></div>
          <Icon name="Crown" size={22} className="shrink-0 text-sky-600" />
        </div>
        {paid ? <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-emerald-900">
          <p className="text-sm font-semibold">Tu membresía está pagada y activa</p>
          <p className="mt-1 text-2xl font-bold">{selected.status.litersRemaining} litros disponibles</p>
          <p className="mt-1 text-sm">Equivalen a {Number(selected.status.garrafonesRemaining).toLocaleString('es-MX')} garrafones.</p>
          <p className="mt-2 text-xs">Válida en {selected.status.machineId || 'las máquinas compatibles'}.</p>
        </div> : availablePrice ? <>
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-sky-50 p-3">
            <div><p className="text-xs text-slate-600">Total del paquete</p><p className="mt-1 text-2xl font-bold text-sky-900">{money(price)}</p></div>
            <div><p className="text-xs text-slate-600">Por garrafón</p><p className="mt-1 text-2xl font-bold text-sky-900">{money(config.costPerGarrafonCents)}</p></div>
          </div>
          <p className="mt-3 text-sm text-slate-600">Precio normal: {money(config.pricePerGarrafonCents)} por garrafón.</p>
          <p className="mt-1 text-sm font-semibold text-emerald-700">Ahorras {money(config.savingsCents)} en este paquete.</p>
          <p className="mt-1 text-xs text-slate-500">Precio de {machine.name || machine.id} · {machine.id}</p>
        </> : <p className="mt-4 rounded-xl bg-sky-50 p-3 text-sm text-sky-900">Escanea el QR de la máquina para ver su precio y el ahorro de cada paquete.</p>}
        <p className="mt-4 text-sm font-semibold text-slate-700">Sin vencimiento de 30 días: termina al agotar los litros.</p>
        <details className="mt-3 text-sm text-slate-600">
          <summary className="cursor-pointer font-medium text-sky-800">Cómo se usa y diferencia con cashback</summary>
          <p className="mt-2">La membresía se activa al pagar. Cada llenado descuenta los litros del paquete. Al agotarlo, puedes comprar otro o seguir comprando al precio normal, sin bloquearte.</p>
          <p className="mt-2">La membresía da un descuento al comprar el paquete. Cashback devuelve saldo después de tus compras y se paga al cierre del mes. Elige una opción; no se combinan.</p>
          <p className="mt-2">Si quedan menos litros de los que pides, se usan esos litros y se cobra únicamente la diferencia con tu saldo.</p>
        </details>
      </article>
      <aside className="fixed inset-x-0 bottom-14 z-40 border-t border-sky-100 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] md:bottom-16" aria-label="Pago de membresía">
        <div className="mx-auto max-w-2xl">
          {error && <p role="alert" className="mb-2 rounded-xl bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          {paid ? <button onClick={onDispense} className="h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white">Dispensar con mi membresía</button>
            : !availablePrice ? <button onClick={onScan} className="h-11 w-full rounded-xl bg-sky-700 text-sm font-semibold text-white">Escanear máquina para ver precios</button>
              : <>
                <div className="flex items-center justify-between gap-3 text-xs text-slate-600"><span>Saldo disponible: {money(walletCents)}</span><span>{enoughBalance ? 'Pago único' : `Te faltan ${money(Number(price) - Number(walletCents))}`}</span></div>
                <button disabled={busy} onClick={() => enoughBalance ? onPurchase(selected) : onRecharge(selected)}
                  className="mt-2 h-11 w-full rounded-xl bg-sky-700 text-sm font-semibold text-white disabled:opacity-60">
                  {busy ? 'Confirmando compra…' : enoughBalance ? `Pagar ${money(price)} y activar` : 'Recargar saldo para activar'}
                </button>
                {enoughBalance && <button disabled={busy} onClick={() => onRecharge(selected)} className="mt-2 w-full text-center text-xs font-medium text-sky-700">Recargar primero con tarjeta</button>}
              </>}
        </div>
      </aside>
    </section>
  );
}
