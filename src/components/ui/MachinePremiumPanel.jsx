import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { managementRequest } from '../../lib/management';
import Button from './Button';
import Icon from '../AppIcon';
import { checkoutRequestId } from '../../lib/checkout.mjs';
import ClipCardPayment from './ClipCardPayment';

const money = (cents) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(cents / 100);
export default function MachinePremiumPanel({ machineId, isAdmin, darkMode }) {
  const { getToken } = useAuth();
  const location = useLocation(), navigate = useNavigate();
  const [premium, setPremium] = useState(null), [stats, setStats] = useState(null);
  const [prices, setPrices] = useState([]);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const [showCheckout, setShowCheckout] = useState(Boolean(new URLSearchParams(location.search).get('premiumPayment')));
  const requestId = useRef(null), inFlight = useRef(false);
  const card = darkMode ? 'border-slate-500 bg-slate-800 text-white' : 'border-sky-200 bg-white text-slate-900';
  const paymentId = new URLSearchParams(location.search).get('premiumPayment');
  const returnMachine = new URLSearchParams(location.search).get('machineId');
  const path = `/api/monitor-admin/machines/${encodeURIComponent(machineId)}`;
  const request = useCallback((target, options) => managementRequest(target, getToken, options), [getToken]);
  const load = useCallback(async () => {
    if (!machineId) return;
    setBusy(true); setError('');
    try {
      if (paymentId && returnMachine === machineId) {
        const result = await managementRequest(`${path}/premium/payments/${encodeURIComponent(paymentId)}`, getToken);
        setMessage(result.status === 'SUCCEEDED' ? 'Pago confirmado. Premium está activo para esta máquina.'
          : result.status === 'PENDING' ? 'Tu pago sigue pendiente. Verifica de nuevo después de completar el pago en Clip.' : 'El pago fue cancelado o venció.');
        if (result.status === 'SUCCEEDED') navigate(location.pathname, { replace: true });
      }
      const info = await managementRequest(`${path}/premium`, getToken);
      setPremium(info);
      setPrices(info.quote.plans.map((plan) => ({ ...plan, price: (plan.monthlyPriceCents / 100).toFixed(2) })));
      if (isAdmin || info.active) setStats((await managementRequest(`${path}/statistics`, getToken)).sales);
      else setStats(null);
    } catch (failure) { setStats(null); setError(failure.message); }
    finally { setBusy(false); }
  }, [getToken, machineId, path, isAdmin, paymentId, returnMachine, navigate, location.pathname]);
  useEffect(() => { load(); }, [load]);

  const prepare = async ({ newAttempt } = {}) => {
    if (newAttempt || !requestId.current) requestId.current = checkoutRequestId();
    try {
      return await request(`${path}/premium/prepare`, { method: 'POST',
        body: JSON.stringify({ expectedPriceCents: premium.quote.amountCents, requestId: requestId.current }) });
    } catch (failure) {
      if (failure.code === 'PRICE_CHANGED') { requestId.current = null; await load(); }
      throw failure;
    }
  };
  const savePrices = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      await managementRequest('/api/monitor-admin/premium/plans', getToken, { method: 'PUT',
        body: JSON.stringify({ prices: prices.map((p) => ({ key: p.key, monthlyPriceCents: Math.round(Number(p.price) * 100) })) }) });
      setMessage('Tarifas guardadas. Los pagos anteriores conservan su importe y vigencia.');
      await load();
    } catch (failure) { setError(failure.message); }
    finally { inFlight.current = false; setBusy(false); }
  };
  if (!machineId) return <p className="text-lg">Selecciona una máquina para consultar Premium.</p>;
  return <section className={`rounded-3xl border p-6 ${card}`}>
    <div className="flex flex-wrap items-center justify-between gap-4"><div>
      <p className={`font-semibold ${darkMode ? 'text-cyan-300' : 'text-sky-800'}`}>Premium por máquina</p>
      <h2 className="mt-2 text-3xl font-black">{machineId}</h2>
      <p className="mt-2 text-base">{isAdmin ? 'Consulta estadísticas y administra las tarifas de tus socios.' : 'Los controles y el desfase están incluidos. Premium habilita las estadísticas de esta máquina.'}</p>
    </div><Button variant="outline" loading={busy} onClick={load}>Actualizar / verificar pago</Button></div>
    {error && <p role="alert" className={`mt-4 rounded-xl border p-3 ${darkMode ? 'border-red-400 bg-red-950 text-red-100' : 'border-red-300 bg-red-50 text-red-900'}`}>{error}</p>}
    {message && <p role="status" className={`mt-4 rounded-xl p-3 ${darkMode ? 'bg-sky-950 text-sky-100' : 'bg-sky-50 text-sky-900'}`}>{message}</p>}
    {premium && <div className={`mt-5 rounded-2xl border p-5 ${darkMode ? 'border-cyan-500 bg-slate-900' : 'border-sky-300 bg-sky-50'}`}>
      <div className="flex flex-wrap items-start justify-between gap-5"><div>
        <h3 className="text-xl font-bold">Segmento {premium.quote.segment}</h3>
        <p className="mt-2">Volumen del último mes completo: <strong>{premium.quote.volumeGarrafones.toLocaleString('es-MX', { maximumFractionDigits: 2 })} garrafones de 20 L</strong>.</p>
        <p className="mt-2 text-3xl font-black">{money(premium.quote.amountCents)} <span className="text-base font-medium">MXN / mes</span></p>
        <p className="mt-2">{premium.active ? `Activo hasta ${new Date(premium.endsAt).toLocaleDateString('es-MX')}` : 'Esta máquina todavía no tiene Premium activo.'}</p>
      </div>{!isAdmin && !showCheckout && <Button loading={busy} disabled={busy} onClick={() => setShowCheckout(true)} iconName="Crown">{premium.active ? 'Renovar con Clip' : 'Activar Premium con Clip'}</Button>}</div>
      {!isAdmin && <p className="mt-3 text-sm">Pago por un mes, sin renovación automática. Si renuevas antes de vencer, el mes se agrega a tu vigencia actual.</p>}
      {!isAdmin && showCheckout && <div className="mx-auto mt-4 max-w-xl"><ClipCardPayment request={request} darkMode={darkMode}
        amountCents={premium.quote.amountCents} prepare={prepare} resumeId={returnMachine === machineId ? paymentId : null}
        submit={(id, cardToken, customer) => request(`${path}/premium/payments/${encodeURIComponent(id)}/pay`, { method: 'POST', body: JSON.stringify({ cardToken, customer }) })}
        verify={(id) => request(`${path}/premium/payments/${encodeURIComponent(id)}`)}
        onPaymentChange={(value) => { if (value.paymentId && value.paymentId !== paymentId) navigate(`${location.pathname}?premiumPayment=${encodeURIComponent(value.paymentId)}&machineId=${encodeURIComponent(machineId)}`, { replace: true }); }}
        onSuccess={async () => { setShowCheckout(false); setMessage('Pago confirmado. Premium está activo para esta máquina.'); await load(); }} />
      </div>}
    </div>}
    {stats ? <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {[['Ventas', stats.transactions], ['Litros vendidos', Number(stats.liters).toLocaleString('es-MX')], ['Garrafones equivalentes', (Number(stats.liters) / 20).toLocaleString('es-MX', { maximumFractionDigits: 2 })],
        ['Ingresos registrados', money(stats.revenueCents)], ['Paquetes de agua vendidos', stats.membershipPurchases]].map(([label, value]) =>
        <div key={label} className={`rounded-2xl border p-4 ${card}`}><p className="text-base">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p><p className="mt-2 text-sm">Últimos 30 días · {machineId}</p></div>)}
    </div> : premium && !isAdmin && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed p-5"><Icon name="LockKeyhole" size={24} /><div><h3 className="text-xl font-bold">Estadísticas Premium</h3><p className="mt-2">Activa la membresía de esta máquina para ver ventas, ingresos y consumo. Puedes seguir usando sus controles y ajustar el desfase desde Operación.</p></div></div>}
    {isAdmin && prices.length > 0 && <div className="mt-7"><h3 className="text-2xl font-bold">Tarifas por volumen mensual</h3>
      <p className="mt-2">Cada máquina toma el precio del rango que le corresponde. Los pagos ya confirmados mantienen su vigencia.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">{prices.map((p, i) => <label key={p.key} className={`rounded-2xl border p-4 ${card}`}>
        <span className="block font-semibold">{p.label} · {i === 0 ? '0' : prices[i - 1].maxGarrafones + 1}{p.maxGarrafones === null ? '+' : `–${p.maxGarrafones}`} garrafones</span>
        <span className="mt-2 block text-sm">Precio mensual (MXN)</span>
        <input type="number" min="1" step="0.01" value={p.price} onChange={(e) => setPrices((items) => items.map((item) => item.key === p.key ? { ...item, price: e.target.value } : item))} className="mt-2 h-12 w-full rounded-xl border px-3" />
      </label>)}</div><Button className="mt-4" loading={busy} onClick={savePrices}>Guardar tarifas Premium</Button></div>}
  </section>;
}
