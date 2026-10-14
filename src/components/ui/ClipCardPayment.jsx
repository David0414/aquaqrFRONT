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
  const [customer, setCustomer] = useState({ email: '', phone: '' });
  const [address, setAddress] = useState({ postal_code: '', street: '', exterior_number: '' });
  const [billing, setBilling] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false), [addressDraft, setAddressDraft] = useState(address);
  const billingDialog = useRef(null);
  const card = useRef(null), mount = useRef(null), submitting = useRef(false), checking = useRef(false), completed = useRef(null);
  const latest = useRef({ verify, onSuccess, onPaymentChange });
  latest.current = { verify, onSuccess, onPaymentChange };
  useEffect(() => {
    setCustomer((current) => ({
      email: current.email || user?.primaryEmailAddress?.emailAddress || '',
      phone: current.phone || user?.primaryPhoneNumber?.phoneNumber || '',
    }));
  }, [user?.primaryEmailAddress?.emailAddress, user?.primaryPhoneNumber?.phoneNumber]);
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
      setAction(nextAction ? { ...nextAction, opened: true } : null);
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
    const email = customer.email.trim();
    const phone = customer.phone.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Escribe un correo válido para continuar con el pago.');
      return;
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setError('Escribe un teléfono válido con lada (de 10 a 15 dígitos).');
      return;
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
      const result = await submit(paymentId(prepared), token.id, {
        email,
        phone,
        ...(billing ? { address } : {}),
      });
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
      <Icon name="LoaderCircle" size={28} className="clip-pending-spinner" /><h3>Procesando tu pago</h3>
      <p role="status" className="text-base">{action
        ? 'Sigue las indicaciones que aparecen en la pantalla de pago. Actualizaremos tu saldo automáticamente al confirmar.'
        : awaitingResume ? 'Estamos recuperando la confirmación del pago. No vuelvas a pagarlo; actualizaremos el saldo cuando recibamos respuesta.'
          : 'Estamos revisando el pago. Tu saldo o Premium se actualizará automáticamente cuando quede confirmado.'}</p>
    </div> : null}
    <form className={`clip-card-form ${pending ? 'hidden' : ''}`} onSubmit={pay}>
      <div className="clip-contact-fields">
        <label className="clip-field"><span>Correo electrónico</span><input type="email" name="email" autoComplete="email" inputMode="email" placeholder="tu@correo.com" value={customer.email} onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))} required disabled={busy} /></label>
        <label className="clip-field"><span>Teléfono con lada</span><input type="tel" name="tel" autoComplete="tel" inputMode="tel" placeholder="+52 55 1234 5678" value={customer.phone} onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))} required disabled={busy} /></label>
      </div>
      <p className="clip-contact-note">Clip solicita estos datos para procesar el pago. El formulario de tarjeta se muestra aquí en AquaQR.</p>
      <div className={`clip-card-frame ${setupStatus === 'error' ? 'hidden' : ''}`}><div id={mountId} ref={mount} className="clip-card-mount" />
        {setupStatus === 'loading' && <p role="status" className="clip-card-loading"><Icon name="LoaderCircle" size={24} />Cargando formulario de pago…</p>}
      </div>
      {setupStatus === 'error' && <div className="clip-setup-error">
        <div role="alert" className="clip-error"><Icon name="CircleAlert" size={17} /><span>{setupError}</span></div>
        <Button type="button" fullWidth variant="outline" disabled={busy} iconName="RefreshCw" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Reintentar cargar formulario</Button>
      </div>}
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
    {action?.opened && createPortal(<div role="dialog" aria-modal="true" aria-label="Procesando tu pago" className="clip-auth-screen">
      <header className="clip-auth-header"><span className="clip-auth-brand"><Icon name="Droplets" size={20} />AquaQR</span><span className="clip-auth-secure"><Icon name="ShieldCheck" size={17} />Pago seguro</span></header>
      <main className="clip-auth-content">
        <div className="clip-auth-status"><span className="clip-auth-spinner"><Icon name="LoaderCircle" size={22} /></span><div><h1>Procesando tu pago</h1><p>Sigue las indicaciones que aparecen aquí. El resultado se actualizará automáticamente.</p></div></div>
        <div className="clip-auth-frame"><iframe src={action.url} title="Proceso seguro de pago" allow="payment" /></div>
        <p className="clip-auth-footnote"><Icon name="LockKeyhole" size={14} />Mantén esta pantalla abierta mientras procesamos la operación.</p>
      </main>
    </div>, document.body)}
  </div>;
}
