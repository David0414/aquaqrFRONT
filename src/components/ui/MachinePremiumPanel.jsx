import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { managementRequest } from '../../lib/management';
import Icon from '../AppIcon';
import { checkoutRequestId } from '../../lib/checkout.mjs';
import ClipCardPayment from './ClipCardPayment';

const money = (cents) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(cents || 0) / 100);
export default function MachinePremiumPanel({ machineId, isAdmin, darkMode, onBusyChange, onPremiumChange }) {
  const { getToken } = useAuth();
  const location = useLocation(), navigate = useNavigate();
  const [premium, setPremium] = useState(null), [stats, setStats] = useState(null);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const [showCheckout, setShowCheckout] = useState(Boolean(new URLSearchParams(location.search).get('premiumPayment')));
  const requestId = useRef(null), loadSequence = useRef(0), controller = useRef(null), callbacks = useRef({ onPremiumChange });
  callbacks.current = { onPremiumChange };
  const paymentId = new URLSearchParams(location.search).get('premiumPayment');
  const returnMachine = new URLSearchParams(location.search).get('machineId');
  const path = `/api/monitor-admin/machines/${encodeURIComponent(machineId)}`;
  const request = useCallback((target, options) => managementRequest(target, getToken, options), [getToken]);
  const load = useCallback(async () => {
    if (!machineId) return;
    const sequence = ++loadSequence.current;
    controller.current?.abort();
    const abort = new AbortController(); controller.current = abort;
    setBusy(true); setError('');
    try {
      if (paymentId && returnMachine === machineId) {
        const result = await request(`${path}/premium/payments/${encodeURIComponent(paymentId)}`, { signal: abort.signal });
        if (abort.signal.aborted) return;
        setMessage(result.status === 'SUCCEEDED' ? 'Pago confirmado. Premium está activo para esta máquina.'
          : result.status === 'PENDING' ? 'Tu pago sigue pendiente. Completa el pago y verifica su estado.' : 'El pago no se completó. Puedes realizar un nuevo intento.');
        if (result.status === 'SUCCEEDED') navigate(`${location.pathname}?machineId=${encodeURIComponent(machineId)}&section=premium`, { replace: true });
      }
      const info = await request(`${path}/premium`, { signal: abort.signal });
      if (abort.signal.aborted || sequence !== loadSequence.current) return;
      setPremium(info); callbacks.current.onPremiumChange?.(machineId, info);
      if (isAdmin || info.active) {
        const result = await request(`${path}/statistics`, { signal: abort.signal });
        if (!abort.signal.aborted && sequence === loadSequence.current) setStats(result.sales);
      } else setStats(null);
    } catch (failure) { if (!abort.signal.aborted && sequence === loadSequence.current) { setStats(null); setError(failure.message); } }
    finally { if (sequence === loadSequence.current) setBusy(false); }
  }, [request, machineId, path, isAdmin, paymentId, returnMachine, navigate, location.pathname]);
  useEffect(() => { load(); return () => { controller.current?.abort(); loadSequence.current++; }; }, [load]);
  const prepare = async ({ newAttempt } = {}) => {
    if (newAttempt || !requestId.current) requestId.current = checkoutRequestId();
    try { return await request(`${path}/premium/prepare`, { method: 'POST', body: JSON.stringify({ expectedPriceCents: premium.quote.amountCents, requestId: requestId.current }) }); }
    catch (failure) { if (failure.code === 'PRICE_CHANGED') { requestId.current = null; await load(); } throw failure; }
  };
  if (!machineId) return <p className="m-notice">Abre una máquina para consultar su Premium.</p>;
  return <section className="m-premium-content">
    <div className="m-section-heading"><div><p className="m-kicker">PREMIUM POR MÁQUINA</p><h2>{isAdmin ? 'Premium y estadísticas' : 'Conoce mejor tu máquina'}</h2><p>{isAdmin ? 'Consulta las ventas y el acceso Premium del socio responsable.' : 'Activa las estadísticas de ventas, ingresos y consumo de esta máquina.'}</p></div><button className="m-button" type="button" disabled={busy} onClick={load}><Icon name="RefreshCw" size={16} />{busy ? 'Actualizando…' : 'Actualizar / verificar pago'}</button></div>
    {error && <p role="alert" className="m-notice m-error">{error}</p>}{message && <p role="status" className="m-notice m-success">{message}</p>}
    {!premium && !error && <div className="m-empty" role="status">Consultando Premium de {machineId}…</div>}
    {premium && <div className="m-premium-layout"><div className="m-premium-offer"><div className="m-premium-offer-top"><span className="m-premium-mark"><Icon name="Crown" size={27} /></span><span className={`m-badge ${premium.active ? 'm-green' : 'm-gold'}`}>{premium.active ? 'Premium activo' : 'Acceso normal'}</span></div>
      <h3>Premium de {machineId}</h3><p>Estadísticas para administrar con más información.</p><div className="m-premium-price"><strong>{money(premium.quote.amountCents)}</strong><span>MXN / mes</span></div>
      <div className="m-premium-volume"><span>Segmento {premium.quote.segment}</span><strong>{Number(premium.quote.volumeGarrafones).toLocaleString('es-MX', { maximumFractionDigits: 2 })} garrafones</strong><small>Vendidos en el último mes completo. Ese volumen determina tu tarifa.</small></div>
      <p className="m-premium-expiry">{premium.active ? `Activo hasta ${new Date(premium.endsAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Premium todavía no está activo en esta máquina.'}</p>
      {isAdmin ? <div className="m-notice"><Icon name="ShieldCheck" size={18} />La administración tiene acceso a las estadísticas sin contratar Premium.</div>
        : !showCheckout && <button className="m-button m-primary m-full" type="button" disabled={busy} onClick={() => setShowCheckout(true)}><Icon name="Crown" size={17} />{premium.active ? 'Renovar con Clip' : 'Activar Premium con Clip'}</button>}
      {!isAdmin && <p className="m-caption">Un mes de acceso, sin renovación automática. Una renovación anticipada se suma a la vigencia actual.</p>}
    </div><div className="m-surface m-premium-benefits"><p className="m-kicker">TU ACCESO, SIN CONFUSIONES</p><h3>¿Qué puedes hacer?</h3><div className="m-benefit-group"><h4>Incluido en tu acceso normal</h4>{['Controlar bomba, llenado y enjuague', 'Corregir el desfase en mililitros', 'Cambiar datos y precio de tu máquina', 'Generar su código QR'].map((text) => <p key={text}><Icon name="Check" size={16} />{text}</p>)}</div><div className="m-benefit-group m-benefit-premium"><h4><Icon name="Crown" size={16} /> Con Premium en esta máquina</h4>{['Ventas y litros vendidos', 'Ingresos registrados', 'Paquetes de agua vendidos'].map((text) => <p key={text}><Icon name="Check" size={16} />{text}</p>)}</div><p className="m-caption">Cada máquina tiene su propia membresía Premium.</p></div></div>}
    {!isAdmin && premium && showCheckout && <div className="m-premium-checkout"><ClipCardPayment request={request} darkMode={darkMode} onBusyChange={onBusyChange}
      amountCents={premium.quote.amountCents} prepare={prepare} resumeId={returnMachine === machineId ? paymentId : null}
      submit={(id, cardToken, customer) => request(`${path}/premium/payments/${encodeURIComponent(id)}/pay`, { method: 'POST', body: JSON.stringify({ cardToken, customer }) })}
      verify={(id) => request(`${path}/premium/payments/${encodeURIComponent(id)}`)}
      onPaymentChange={(value) => { if (value.paymentId && value.paymentId !== paymentId) navigate(`${location.pathname}?premiumPayment=${encodeURIComponent(value.paymentId)}&machineId=${encodeURIComponent(machineId)}&section=premium`, { replace: true }); }}
      onSuccess={async () => { setShowCheckout(false); setMessage('Pago confirmado. Premium está activo para esta máquina.'); await load(); }} /></div>}
    {stats ? <div className="m-statistics"><div className="m-section-heading"><div><h3>El rendimiento de esta máquina</h3><p>Últimos 30 días · {machineId}</p></div><span className="m-badge m-green"><Icon name="BarChart3" size={14} />Estadísticas disponibles</span></div><div className="m-stat-grid">
      {[['Ventas de agua', stats.transactions, 'ShoppingBag'], ['Litros vendidos', Number(stats.liters).toLocaleString('es-MX'), 'Droplets'], ['Garrafones equivalentes', (Number(stats.liters) / 20).toLocaleString('es-MX', { maximumFractionDigits: 2 }), 'Package'], ['Ingresos registrados', money(stats.revenueCents), 'Wallet'], ['Paquetes de agua vendidos', stats.membershipPurchases, 'BadgeCheck']].map(([label, value, icon]) => <div key={label} className="m-surface m-stat-card"><Icon name={icon} size={20} /><span>{label}</span><strong>{value}</strong></div>)}
    </div></div> : premium && !isAdmin && <div className="m-locked-statistics"><Icon name="LockKeyhole" size={26} /><div><h3>Tus estadísticas estarán aquí</h3><p>Activa Premium en {machineId} para consultar su rendimiento. Sus controles siguen disponibles.</p></div></div>}
  </section>;
}
