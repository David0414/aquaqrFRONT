import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Button from './Button';
import { loadClipSdk } from '../../lib/clipSdk.mjs';

export default function ClipCardPayment({ request, amountCents, prepare, submit, verify, onSuccess,
  onPaymentChange, onBusyChange, resumeId, darkMode = false }) {
  const { user } = useUser();
  const mountId = `clip-card-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [config, setConfig] = useState(null), [ready, setReady] = useState(false);
  const [setupStatus, setSetupStatus] = useState('loading'), [setupError, setSetupError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [payment, setPayment] = useState(null), [action, setAction] = useState(null);
  const [email, setEmail] = useState(user?.primaryEmailAddress?.emailAddress || '');
  const [phone, setPhone] = useState(user?.primaryPhoneNumber?.phoneNumber || '');
  const [address, setAddress] = useState({ postal_code: '', street: '', exterior_number: '' });
  const [billing, setBilling] = useState(false);
  const card = useRef(null), mount = useRef(null), submitting = useRef(false), checking = useRef(false), completed = useRef(null);
  const latest = useRef({ verify, onSuccess, onPaymentChange });
  latest.current = { verify, onSuccess, onPaymentChange };
  const paymentId = (value) => value?.rechargeId || value?.paymentId;
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => () => onBusyChange?.(false), [onBusyChange]);

  useEffect(() => {
    const node = mount.current;
    if (!node) return undefined;
    let cancelled = false, frame, resize;
    const controller = new AbortController();
    const failed = (failure) => {
      if (cancelled) return;
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
      resize?.disconnect();
      frame?.removeEventListener('load', loaded);
      card.current = null;
      node.replaceChildren();
      setReady(false); setSetupStatus('error');
      setSetupError(failure.status === 404
        ? 'El servicio de pagos no está disponible en este momento. Intenta nuevamente más tarde.'
        : failure.message || 'No se pudo cargar el formulario de Clip. Intenta nuevamente.');
    };
    const loaded = () => {
      if (cancelled) return;
      clearTimeout(timeout); setReady(true); setSetupStatus('ready');
    };
    const timeout = setTimeout(() => failed(new Error('El formulario de Clip tardó demasiado en cargar. Revisa tu conexión e intenta nuevamente.')), 30000);
    setConfig(null); setReady(false); setSetupStatus('loading'); setSetupError('');
    (async () => {
      const value = await request('/api/payments/clip/config', { signal: controller.signal });
      if (cancelled) return;
      if (typeof value?.apiKey !== 'string' || !value.apiKey.trim()) throw new Error('No se pudo preparar el formulario de Clip. Intenta nuevamente más tarde.');
      setConfig(value);
      const SDK = await loadClipSdk();
      if (cancelled) return;
      const sdk = new SDK(value.apiKey);
      const element = sdk.element.create('Card', { locale: 'es', theme: darkMode ? 'dark' : 'light' });
      card.current = element;
      element.mount(mountId);
      frame = node.querySelector('iframe');
      if (frame) {
        frame.title = 'Datos de tarjeta protegidos por Clip';
        frame.addEventListener('load', loaded, { once: true });
        const size = () => node.parentElement?.style.setProperty('--clip-card-height', `${parseFloat(frame.style.height) || frame.offsetHeight || 258}px`);
        resize = new ResizeObserver(size); resize.observe(frame); size();
      } else throw new Error('No se pudo abrir el formulario de tarjeta de Clip. Intenta nuevamente.');
    })().catch(failed);
    return () => {
      cancelled = true; clearTimeout(timeout); controller.abort(); resize?.disconnect();
      frame?.removeEventListener('load', loaded); card.current = null; node.replaceChildren();
    };
  }, [request, darkMode, mountId, loadAttempt]);

  const accept = useCallback((value) => {
    setPayment(value);
    latest.current.onPaymentChange?.(value);
    if (value.status === 'SUCCEEDED') {
      setAction(null);
      if (completed.current !== paymentId(value)) { completed.current = paymentId(value); latest.current.onSuccess(value); }
    } else {
      setAction((current) => value.pendingAction ? { ...value.pendingAction,
        opened: Boolean(current?.opened && current.url === value.pendingAction.url) } : null);
      if (['FAILED', 'CANCELED'].includes(value.status)) setError('El pago no fue aprobado. Puedes corregir tus datos y hacer un nuevo intento.');
    }
  }, []);

  const check = useCallback(async (id, silent = false) => {
    if (!id || checking.current || submitting.current) return;
    checking.current = true;
    if (!silent) { setBusy(true); setError(''); }
    try { accept(await latest.current.verify(id)); }
    catch (failure) { if (!silent) setError(failure.message); }
    finally { checking.current = false; if (!silent) setBusy(false); }
  }, [accept]);

  useEffect(() => { if (resumeId && paymentId(payment) !== resumeId) check(resumeId); }, [resumeId, check]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!payment || payment.status !== 'PENDING' || payment.canPay) return undefined;
    const id = paymentId(payment);
    const poll = setInterval(() => check(id, true), 5000);
    const focused = () => check(id, true);
    window.addEventListener('focus', focused);
    return () => { clearInterval(poll); window.removeEventListener('focus', focused); };
  }, [payment, check]);

  const pay = async (event) => {
    event.preventDefault();
    if (submitting.current || checking.current || !ready || !card.current) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || phone.replace(/\D/g, '').length < 10) {
      setError('Escribe tu correo y teléfono de 10 dígitos para continuar.'); return;
    }
    submitting.current = true; setBusy(true); setError('');
    let prepared = payment;
    let started = false;
    try {
      if (!prepared || ['FAILED', 'CANCELED'].includes(prepared.status)) prepared = await prepare({ newAttempt: Boolean(prepared) });
      accept(prepared);
      if (prepared.status === 'SUCCEEDED' || !prepared.canPay) return;
      const token = await card.current.cardToken();
      if (!token?.id) throw new Error('Clip no devolvió el token de tarjeta. Revisa los datos ingresados.');
      started = true;
      // The browser sends only Clip's one-use token, never the card number or CVV.
      const result = await submit(paymentId(prepared), token.id, { email: email.trim(), phone,
        ...(billing ? { address } : {}) });
      accept(result);
    } catch (failure) {
      if (failure.data?.rechargeId || failure.data?.paymentId) accept(failure.data);
      else if (started && prepared) accept({ ...prepared, canPay: false, status: 'PENDING' });
      setError(started && !failure.data ? 'No se recibió la confirmación. Verifica el pago antes de hacer otro cargo.'
        : failure.message || 'Revisa los datos de tu tarjeta e intenta nuevamente.');
    } finally { submitting.current = false; setBusy(false); }
  };
  const pending = payment?.status === 'PENDING' && !payment.canPay;
  const payableCents = payment?.status === 'PENDING' ? Number(payment.amountCents) : Number(amountCents);
  const field = `min-w-0 rounded-lg border px-3 py-2 text-base ${darkMode ? 'border-slate-500 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-900'}`;
  return <div className={`clip-payment ${darkMode ? 'text-white' : 'text-slate-900'}`}>
    {config?.environment === 'sandbox' && <p role="status" className="clip-sandbox rounded-lg border border-amber-400 bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-950">Modo de prueba · sin cargos reales</p>}
    {error && <p role="alert" className={`rounded-lg px-3 py-2 text-sm font-semibold ${darkMode ? 'bg-red-950 text-red-100' : 'bg-red-50 text-red-900'}`}>{error}</p>}
    {pending ? <div className="space-y-3">
      <p role="status" className="text-base">Tu pago está pendiente. El saldo o Premium se habilitará al confirmarlo Clip.</p>
      {action && <Button fullWidth disabled={busy} onClick={() => setAction({ ...action, opened: true })}>Completar validación bancaria</Button>}
      <Button fullWidth loading={busy} onClick={() => check(paymentId(payment))}>Verificar pago</Button>
      {payment.checkoutUrl && <Button fullWidth variant="outline" onClick={() => {
        const url = new URL(payment.checkoutUrl);
        if (url.protocol === 'https:' && (url.hostname === 'pago.clip.mx' || url.hostname.endsWith('.payclip.com'))) window.location.assign(url.href);
      }}>Volver al pago anterior en Clip</Button>}
    </div> : null}
    <form className={`clip-card-form ${pending ? 'hidden' : ''}`} onSubmit={pay}>
      <div className={`clip-card-frame ${setupStatus === 'error' ? 'hidden' : ''}`}><div id={mountId} ref={mount} className="clip-card-mount" /></div>
      {setupStatus === 'loading' && <p role="status" className="text-sm">Cargando formulario de Clip…</p>}
      {setupStatus === 'error' && <div className="col-span-full space-y-2">
        <p role="alert" className={`rounded-lg px-3 py-2 text-sm font-semibold ${darkMode ? 'bg-red-950 text-red-100' : 'bg-red-50 text-red-900'}`}>{setupError}</p>
        <Button type="button" fullWidth variant="outline" disabled={busy} iconName="RefreshCw" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Reintentar cargar formulario</Button>
      </div>}
      <div className="clip-customer grid grid-cols-2 gap-2">
        <input aria-label="Correo para el recibo" autoComplete="email" type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} className={field} required />
        <input aria-label="Teléfono para el pago" autoComplete="tel" type="tel" placeholder="Teléfono (10 dígitos)" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} required />
      </div>
      <details className="clip-billing text-xs" onToggle={(e) => setBilling(e.currentTarget.open)}>
        <summary>Dirección de facturación para American Express</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">{[['postal_code', 'Código postal'], ['street', 'Calle'], ['exterior_number', 'Número exterior']].map(([key, label]) =>
          <input key={key} aria-label={label} placeholder={label} value={address[key]} onChange={(e) => setAddress((current) => ({ ...current, [key]: e.target.value }))} className={field} required={billing} />)}</div>
      </details>
      <Button type="submit" fullWidth loading={busy} disabled={busy || !ready || !config || !Number.isFinite(payableCents) || payableCents <= 0 || payment?.status === 'SUCCEEDED'} iconName="CreditCard">
        {config?.environment === 'sandbox' ? 'Probar pago' : 'Pagar'} ${(payableCents / 100).toFixed(2)} con Clip
      </Button>
    </form>
    {action?.opened && <div role="dialog" aria-modal="true" aria-label="Validación bancaria del pago" className="fixed inset-0 z-[100] flex flex-col bg-white p-3 text-slate-900">
      <h2 className="mb-2 text-lg font-bold">Confirma el pago con tu banco</h2>
      <iframe src={action.url} title="Autenticación bancaria" className="min-h-0 flex-1 border-0" allow="payment" />
      <Button className="mt-2" onClick={() => { setAction(null); check(paymentId(payment)); }}>Cerrar y verificar pago</Button>
    </div>}
  </div>;
}
