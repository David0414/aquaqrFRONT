import React, { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../AppIcon';
import Button from './Button';
import './clip-payment.css';

const paymentId = (value) => value?.rechargeId || value?.paymentId;

export default function ClipCardPayment({ amountCents, prepare, verify, onSuccess,
  onPaymentChange, onBusyChange, resumeId, darkMode = false }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState(null);
  const submitting = useRef(false), checking = useRef(false), completed = useRef(null);
  const latest = useRef({ verify, onSuccess, onPaymentChange });
  latest.current = { verify, onSuccess, onPaymentChange };
  const awaitingResume = Boolean(resumeId && paymentId(payment) !== resumeId);

  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  useEffect(() => () => onBusyChange?.(false), [onBusyChange]);

  const accept = useCallback((value) => {
    setPayment(value);
    latest.current.onPaymentChange?.(value);
    if (value.status === 'SUCCEEDED' && completed.current !== paymentId(value)) {
      completed.current = paymentId(value);
      latest.current.onSuccess?.(value);
    }
  }, []);

  const check = useCallback(async (id) => {
    if (!id || checking.current || submitting.current) return;
    checking.current = true;
    try { accept(await latest.current.verify(id)); }
    catch { /* The next automatic check retries a temporary network failure. */ }
    finally { checking.current = false; }
  }, [accept]);

  useEffect(() => {
    if (!awaitingResume) return undefined;
    const verifyPayment = () => check(resumeId);
    verifyPayment();
    const poll = window.setInterval(verifyPayment, 5000);
    window.addEventListener('focus', verifyPayment);
    return () => { window.clearInterval(poll); window.removeEventListener('focus', verifyPayment); };
  }, [awaitingResume, resumeId, check]);

  useEffect(() => {
    if (payment?.status !== 'PENDING') return undefined;
    const id = paymentId(payment);
    const verifyPayment = () => check(id);
    const poll = window.setInterval(verifyPayment, 5000);
    window.addEventListener('focus', verifyPayment);
    return () => { window.clearInterval(poll); window.removeEventListener('focus', verifyPayment); };
  }, [payment, check]);

  const pay = async (event) => {
    event.preventDefault();
    if (submitting.current || checking.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    let redirecting = false;
    try {
      const retry = ['FAILED', 'CANCELED'].includes(payment?.status);
      const prepared = !payment || retry ? await prepare({ newAttempt: retry }) : payment;
      if (prepared.status === 'SUCCEEDED') { accept(prepared); return; }
      if (!prepared?.checkoutUrl) throw new Error('No se recibió el enlace de pago seguro. Intenta nuevamente.');
      const checkoutUrl = new URL(prepared.checkoutUrl);
      const trustedCheckout = checkoutUrl.protocol === 'https:' &&
        !checkoutUrl.username && !checkoutUrl.password &&
        (checkoutUrl.hostname === 'pago.clip.mx' || checkoutUrl.hostname === 'payclip.com' || checkoutUrl.hostname.endsWith('.payclip.com'));
      if (!trustedCheckout) throw new Error('No se pudo abrir el pago seguro. Intenta nuevamente.');
      accept(prepared);
      redirecting = true;
      window.location.assign(checkoutUrl.href);
    } catch (failure) {
      setError(failure.message || 'No se pudo iniciar el pago. Intenta nuevamente.');
    } finally {
      submitting.current = false;
      if (!redirecting) setBusy(false);
    }
  };

  const pending = awaitingResume || payment?.status === 'PENDING';
  const failed = ['FAILED', 'CANCELED'].includes(payment?.status);
  const displayedAmount = payment?.status === 'PENDING' ? Number(payment.amountCents) : Number(amountCents);

  return <section className={`clip-payment ${darkMode ? 'clip-payment-dark' : ''}`} aria-labelledby="clip-payment-title">
    <div className="clip-payment-heading">
      <div className="clip-payment-title"><Icon name="CreditCard" size={21} /><h2 id="clip-payment-title">Pago seguro</h2></div>
      <span className="clip-payment-secure"><Icon name="ShieldCheck" size={15} />Protegido</span>
    </div>

    {error && <div role="alert" className="clip-error"><Icon name="CircleAlert" size={17} /><span>{error}</span></div>}

    {pending ? <div className="clip-pending" role="status" aria-live="polite">
      <Icon name="LoaderCircle" size={30} className="clip-pending-spinner" />
      <h3>Procesando tu pago</h3>
      <p>Estamos verificando la confirmación. Tu saldo o Premium se actualizará automáticamente cuando el pago quede aprobado. No vuelvas a pagarlo.</p>
    </div> : payment?.status === 'SUCCEEDED' ? <div className="clip-pending clip-paid" role="status">
      <Icon name="CircleCheck" size={32} /><h3>Pago confirmado</h3><p>Tu compra ya quedó registrada.</p>
    </div> : <form className="clip-card-form" onSubmit={pay}>
      <div className="clip-checkout-summary"><span>{failed ? 'El intento anterior no se completó' : 'Total a pagar'}</span><strong>${(displayedAmount / 100).toFixed(2)} <small>MXN</small></strong></div>
      <p className="clip-checkout-copy">Completa el pago en la página segura. AquaQR no necesita tu correo ni tu teléfono para iniciar el cobro.</p>
      <Button className="clip-submit" type="submit" fullWidth loading={busy} disabled={busy || !Number.isFinite(displayedAmount) || displayedAmount <= 0} iconName="LockKeyhole" iconSize={16}>
        {busy ? 'Abriendo pago seguro…' : `Pagar $${(displayedAmount / 100).toFixed(2)}`}
      </Button>
      <p className="clip-security-note"><Icon name="ShieldCheck" size={14} />Pago protegido con tarjeta</p>
    </form>}
  </section>;
}
