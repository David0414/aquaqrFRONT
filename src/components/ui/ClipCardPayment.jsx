import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@clerk/clerk-react';
import Button from './Button';
import Icon from '../AppIcon';
import { loadClipSdk } from '../../lib/clipSdk.mjs';
import './clip-payment.css';

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
  const [billingOpen, setBillingOpen] = useState(false), [addressDraft, setAddressDraft] = useState(address);
  const billingDialog = useRef(null);
  const card = useRef(null), mount = useRef(null), submitting = useRef(false), checking = useRef(false), completed = useRef(null);
  const openedChallenges = useRef(new Set());
  const latest = useRef({ verify, onSuccess, onPaymentChange });
  latest.current = { verify, onSuccess, onPaymentChange };
  const paymentId = (value) => value?.rechargeId || value?.paymentId;
  const awaitingResume = Boolean(resumeId && paymentId(payment) !== resumeId);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => () => onBusyChange?.(false), [onBusyChange]);
  useEffect(() => {
    if (!billingOpen) return undefined;
    const dialog = billingDialog.current;
    const fitDialog = () => dialog.classList.toggle('clip-billing-compact', (window.visualViewport?.height || window.innerHeight) < 420);
    fitDialog(); dialog.showModal();
    window.addEventListener('resize', fitDialog);
    window.visualViewport?.addEventListener('resize', fitDialog);
    return () => {
      window.removeEventListener('resize', fitDialog);
      window.visualViewport?.removeEventListener('resize', fitDialog);
      if (dialog.open) dialog.close();
    };
  }, [billingOpen]);

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
        : 'No se pudo cargar el formulario de pago. Intenta nuevamente.');
    };
    const loaded = () => {
      if (cancelled) return;
      clearTimeout(timeout); setReady(true); setSetupStatus('ready');
    };
    const timeout = setTimeout(() => failed(new Error('El formulario de pago tardó demasiado en cargar. Revisa tu conexión e intenta nuevamente.')), 30000);
    setConfig(null); setReady(false); setSetupStatus('loading'); setSetupError('');
    (async () => {
      const configuration = request('/api/payments/clip/config', { signal: controller.signal }).then((value) => {
        if (typeof value?.apiKey !== 'string' || !value.apiKey.trim()) throw new Error('No se pudo preparar el formulario de pago. Intenta nuevamente más tarde.');
        if (!cancelled) setConfig(value);
        return value;
      });
      const [value, SDK] = await Promise.all([configuration, loadClipSdk()]);
      if (cancelled) return;
      const sdk = new SDK(value.apiKey);
      const element = sdk.element.create('Card', { locale: 'es', theme: darkMode ? 'dark' : 'light' });
      card.current = element;
      element.mount(mountId);
      frame = node.querySelector('iframe');
      if (frame) {
        frame.title = 'Datos de tarjeta protegidos';
        frame.addEventListener('load', loaded, { once: true });
        const size = () => node.parentElement?.style.setProperty('--clip-card-height', `${parseFloat(frame.style.height) || frame.offsetHeight || 258}px`);
        resize = new ResizeObserver(size); resize.observe(frame); size();
      } else throw new Error('No se pudo abrir el formulario de tarjeta. Intenta nuevamente.');
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
      const nextAction = value.pendingAction?.url ? value.pendingAction : null;
      const key = nextAction ? `${paymentId(value)}:${nextAction.url}` : null;
      const autoOpen = Boolean(key && !openedChallenges.current.has(key));
      if (key) openedChallenges.current.add(key);
      setAction((current) => nextAction ? { ...nextAction, key,
        opened: current?.key === key ? Boolean(current.opened) : autoOpen } : null);
      if (['FAILED', 'CANCELED'].includes(value.status)) setError('El pago no fue aprobado. Puedes corregir tus datos y hacer un nuevo intento.');
    }
  }, []);

  const check = useCallback(async (id, silent = false) => {
    if (!id || checking.current || submitting.current) return;
    checking.current = true;
    if (!silent) { setBusy(true); setError(''); }
    try { accept(await latest.current.verify(id)); }
    catch { if (!silent) setError('No pudimos consultar el estado del pago. Se volverá a revisar automáticamente.'); }
    finally { checking.current = false; if (!silent) setBusy(false); }
  }, [accept]);

  useEffect(() => {
    if (!awaitingResume) return undefined;
    const verify = () => check(resumeId, true);
    verify();
    const poll = setInterval(verify, 5000);
    window.addEventListener('focus', verify);
    return () => { clearInterval(poll); window.removeEventListener('focus', verify); };
  }, [awaitingResume, resumeId, check]);
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
      if (!token?.id) throw new Error('No se pudo validar la tarjeta. Revisa los datos ingresados.');
      started = true;
      // The browser sends only Clip's one-use token, never the card number or CVV.
      const result = await submit(paymentId(prepared), token.id, { email: email.trim(), phone,
        ...(billing ? { address } : {}) });
      accept(result);
    } catch (failure) {
      if (failure.data?.rechargeId || failure.data?.paymentId) accept(failure.data);
      else if (started && prepared) accept({ ...prepared, canPay: false, status: 'PENDING' });
      setError(started && !failure.data ? 'No recibimos la confirmación. Estamos comprobando el pago; no vuelvas a pagarlo hasta recibir respuesta.'
        : String(failure.message || 'Revisa los datos de tu tarjeta e intenta nuevamente.').replace(/\bClip\b/gi, 'el servicio de pago'));
    } finally { submitting.current = false; setBusy(false); }
  };
  const pending = awaitingResume || (payment?.status === 'PENDING' && !payment.canPay);
  const payableCents = payment?.status === 'PENDING' ? Number(payment.amountCents) : Number(amountCents);
  return <div className={`clip-payment ${darkMode ? 'clip-payment-dark' : ''}`}>
    <div className="clip-payment-heading"><div className="clip-payment-title"><Icon name="CreditCard" size={21} /><h2>Pago con tarjeta</h2></div></div>
    {config?.environment === 'sandbox' && <p role="status" className="clip-sandbox"><Icon name="FlaskConical" size={13} />Modo de prueba · sin cargos reales</p>}
    {error && <div role="alert" className="clip-error"><Icon name="CircleAlert" size={17} /><span>{error}</span></div>}
    {busy && !pending && <div role="status" aria-live="polite" className="clip-processing">
      <Icon name="LoaderCircle" size={20} className="clip-pending-spinner" />
      <div><strong>Procesando tu pago</strong><span>Espera la confirmación. No cierres esta pantalla.</span></div>
    </div>}
    {pending ? <div className="clip-pending">
      <Icon name="LoaderCircle" size={28} className="clip-pending-spinner" /><h3>{action ? 'Confirma el pago con tu banco' : 'Confirmando tu pago'}</h3>
      <p role="status" className="text-base">{action
        ? 'Tu banco solicita una validación. Al terminar, volveremos a revisar el pago y actualizaremos tu saldo automáticamente.'
        : awaitingResume ? 'Estamos recuperando la confirmación del pago. No vuelvas a pagarlo; actualizaremos el saldo cuando el banco responda.'
          : 'Estamos revisando el pago. Tu saldo o Premium se actualizará automáticamente cuando quede confirmado.'}</p>
      {action && !action.opened && <Button fullWidth disabled={busy} onClick={() => setAction({ ...action, opened: true })}>Continuar con mi banco</Button>}
    </div> : null}
    <form className={`clip-card-form ${pending ? 'hidden' : ''}`} onSubmit={pay}>
      <div className={`clip-card-frame ${setupStatus === 'error' ? 'hidden' : ''}`}><div id={mountId} ref={mount} className="clip-card-mount" />
        {setupStatus === 'loading' && <p role="status" className="clip-card-loading"><Icon name="LoaderCircle" size={24} />Cargando formulario de pago…</p>}
      </div>
      {setupStatus === 'error' && <div className="clip-setup-error">
        <div role="alert" className="clip-error"><Icon name="CircleAlert" size={17} /><span>{setupError}</span></div>
        <Button type="button" fullWidth variant="outline" disabled={busy} iconName="RefreshCw" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Reintentar cargar formulario</Button>
      </div>}
      <div className="clip-customer">
        <label className="clip-field"><span>Correo del recibo</span><input aria-label="Correo para el recibo" autoComplete="email" type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} required /></label>
        <label className="clip-field"><span>Teléfono</span><input aria-label="Teléfono para el pago" autoComplete="tel" type="tel" placeholder="10 dígitos" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} required /></label>
      </div>
      <button className="clip-billing" type="button" disabled={busy} aria-haspopup="dialog" onClick={() => { setAddressDraft({ ...address }); setBillingOpen(true); }}>
        <Icon name={billing ? 'CircleCheck' : 'MapPin'} size={13} />{billing ? 'Facturación guardada · Editar' : 'Facturación · American Express'}<Icon name="ChevronRight" size={13} />
      </button>
      <Button className="clip-submit" type="submit" fullWidth loading={busy} disabled={busy || !ready || !config || !Number.isFinite(payableCents) || payableCents <= 0 || payment?.status === 'SUCCEEDED'} iconName="LockKeyhole" iconSize={16}>
        Pagar ${(payableCents / 100).toFixed(2)}
      </Button>
      <p className="clip-security-note"><Icon name="ShieldCheck" size={13} />Pago seguro con tarjeta</p>
    </form>
    <dialog ref={billingDialog} className="clip-billing-dialog" aria-labelledby={`${mountId}-billing-title`} onCancel={() => setBillingOpen(false)} onClose={() => setBillingOpen(false)}>
      <div className="clip-billing-dialog-heading"><div><h2 id={`${mountId}-billing-title`}>Datos de facturación</h2><p>Para pagar con American Express</p></div><button type="button" aria-label="Cerrar facturación" autoFocus onClick={() => setBillingOpen(false)}><Icon name="X" size={20} /></button></div>
      <form onSubmit={(event) => { event.preventDefault(); setAddress({ ...addressDraft }); setBilling(true); setBillingOpen(false); }}>
        <div className="clip-billing-fields">{[['postal_code', 'Código postal'], ['street', 'Calle'], ['exterior_number', 'Número exterior']].map(([key, label]) =>
          <label key={key} className="clip-field"><span>{label}</span><input aria-label={label} placeholder={label} value={addressDraft[key]} onChange={(e) => setAddressDraft((current) => ({ ...current, [key]: e.target.value }))} required /></label>)}</div>
        <div className="clip-billing-actions"><Button type="button" variant="outline" onClick={() => setBillingOpen(false)}>Cancelar</Button><Button type="submit">Guardar datos</Button></div>
        {billing && <button type="button" className="clip-remove-billing" onClick={() => { setBilling(false); setBillingOpen(false); }}>Continuar sin estos datos</button>}
      </form>
    </dialog>
    {action?.opened && createPortal(<div role="dialog" aria-modal="true" aria-label="Validación bancaria del pago" className="fixed inset-0 z-[100] flex flex-col bg-white p-3 text-slate-900">
      <h2 className="mb-2 text-lg font-bold">Confirma el pago con tu banco</h2>
      <iframe src={action.url} title="Autenticación bancaria" className="min-h-0 flex-1 border-0" allow="payment" />
      <Button className="mt-2" onClick={() => {
        setAction((current) => current ? { ...current, opened: false } : null);
        check(paymentId(payment), true);
      }}>Volver a AquaQR</Button>
    </div>, document.body)}
  </div>;
}
