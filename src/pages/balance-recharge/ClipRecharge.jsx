import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';
import { checkoutRequestId } from '../../lib/checkout.mjs';
import ClipCardPayment from '../../components/ui/ClipCardPayment';
import useRechargeViewport from './useRechargeViewport';
import { loadCustomerSummary, readCustomerSummary, recordCustomerWallet } from '../../lib/customerSummary.mjs';
import { loadClipSdk } from '../../lib/clipSdk.mjs';
import './recharge.css';

const API = import.meta.env.VITE_API_URL;
const RESUME_KEY = 'agua24.clip-recharge';
const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
function savedReturn(userId, id) {
  try { const value = JSON.parse(sessionStorage.getItem(RESUME_KEY)); return value?.userId === userId && value.rechargeId === id ? value.state : {}; }
  catch { return {}; }
}
export default function ClipRecharge() {
  const viewport = useRechargeViewport();
  const navigate = useNavigate(), location = useLocation();
  const { getToken, userId } = useAuth();
  const { balanceCents } = useDispenseFlow();
  const returnedId = new URLSearchParams(location.search).get('clipRecharge');
  const [step, setStep] = useState(returnedId ? 2 : 1);
  const [amount, setAmount] = useState(Number(location.state?.selectedAmountCents || savedReturn(userId, returnedId)?.selectedAmountCents || 0) / 100);
  const [custom, setCustom] = useState('');
  const [wallet, setWallet] = useState(Number(balanceCents || 0));
  const [promotion, setPromotion] = useState(() => readCustomerSummary(userId)?.promotions?.find((p) => p.key === 'topup_bonus' && p.isActive && p.isEnabledForUserThisMonth) || null);
  const [payment, setPayment] = useState(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [completion, setCompletion] = useState(null);
  const [error, setError] = useState('');
  const requestId = useRef(null);
  const returnState = location.state || savedReturn(userId, returnedId);
  const tokenHeaders = useCallback(async () => ({ Authorization: `Bearer ${await getToken({ template: 'aquaqr-api' })}` }), [getToken]);
  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, { ...options, headers: { ...await tokenHeaders(),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}) }, cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(data.message || data.error || 'No se pudo completar el pago.'), { data, status: response.status });
    return data;
  }, [tokenHeaders]);

  useEffect(() => {
    let cancelled = false;
    loadClipSdk().catch(() => {});
    (async () => {
      try {
        const data = await loadCustomerSummary(userId, getToken);
        if (!cancelled) {
          setWallet(Number(data.wallet?.totalAvailableCents ?? data.wallet?.balanceCents ?? 0));
          setPromotion(data.promotions?.find((p) => p.key === 'topup_bonus' && p.isActive && p.isEnabledForUserThisMonth) || null);
        }
      } catch { /* Existing wallet balance remains visible if rewards cannot be loaded. */ }
    })();
    return () => { cancelled = true; };
  }, [getToken, userId]);

  const amountCents = Math.round(amount * 100);
  const bonusFor = (cents) => {
    const tier = [...(promotion?.config?.tiers || [])].filter((t) => t.amountCents <= cents).sort((a, b) => b.amountCents - a.amountCents)[0];
    return tier ? tier.bonusPercent !== undefined ? Math.round(cents * Number(tier.bonusPercent) / 100) : Number(tier.bonusCents || 0) : 0;
  };
  const bonus = bonusFor(amountCents);
  const validAmount = Number.isFinite(amount) && amountCents >= 1000 && amountCents <= 50000;
  const quotedBonus = payment?.bonusCents ?? bonus;
  const receives = amountCents + quotedBonus;
  const invalidCustom = custom !== '' && !validAmount;

  const finish = (data) => {
    try { sessionStorage.removeItem(RESUME_KEY); } catch { /* Storage may be disabled. */ }
    const wallet = recordCustomerWallet(userId, data.wallet);
    if (wallet) window.dispatchEvent(new CustomEvent('wallet:updated', { detail: { ...wallet, userId, source: 'clip' } }));
    const walletState = { ...(wallet || {}), walletUserId: userId, walletUpdatedAt: Date.now() };
    setCompletion({ amountCents: Number(data.amountCents || amountCents), balanceCents: wallet?.totalAvailableCents, walletState });
  };

  const goToWallet = () => {
    navigate('/home-dashboard', { replace: true, state: { ...(completion?.walletState || {}), rechargeSuccess: true } });
  };

  useEffect(() => {
    if (!completion) return undefined;
    const timer = window.setTimeout(() => {
      navigate('/home-dashboard', { replace: true, state: { ...completion.walletState, rechargeSuccess: true } });
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [completion, navigate]);

  const prepare = async ({ newAttempt } = {}) => {
    if (!validAmount) throw new Error('El monto debe estar entre $10 y $500.');
    if (newAttempt || requestId.current?.amountCents !== amountCents) requestId.current = { amountCents, requestId: checkoutRequestId() };
    return request('/api/recharge/clip/prepare', { method: 'POST', body: JSON.stringify(requestId.current) });
  };
  const paymentChanged = (data) => {
    setPayment(data); setAmount(data.amountCents / 100);
    const state = { ...returnState, selectedAmountCents: data.amountCents };
    try { sessionStorage.setItem(RESUME_KEY, JSON.stringify({ userId, rechargeId: data.rechargeId, state })); } catch { /* Verification remains authenticated. */ }
    if (data.rechargeId && data.rechargeId !== returnedId) navigate(`/balance-recharge?clipRecharge=${encodeURIComponent(data.rechargeId)}`, { replace: true, state });
  };
  const locked = paymentBusy || Boolean(returnedId && !payment) || (payment?.status === 'PENDING' && !payment.canPay);

  const backToAmount = () => {
    setStep(1); setPayment(null); setError(''); requestId.current = null;
    navigate('/balance-recharge', { replace: true, state: returnState });
  };
  return (
    <div ref={viewport.screen} className={`recharge-screen ${step === 2 ? 'recharge-payment-step' : ''}`}>
      <header className="recharge-header">
        <div className="recharge-header-inner">
          <div className="recharge-header-title">
            <button type="button" aria-label={completion ? 'Ir a mi wallet' : 'Volver'} disabled={locked} onClick={() => completion ? goToWallet() : step === 2 ? backToAmount() : navigate(-1)} className="recharge-back"><Icon name="ArrowLeft" size={20} /></button>
            <div><h1>{completion ? 'Recarga confirmada' : 'Recargar saldo'}</h1><span className="recharge-small-step">{completion ? 'Saldo actualizado' : `Paso ${step} de 2 · ${step === 1 ? 'Monto' : 'Pago'}`}</span></div>
          </div>
          <span className="recharge-secure"><Icon name={completion ? 'CircleCheck' : 'ShieldCheck'} size={17} /><span>{completion ? 'Pago confirmado' : 'Pago protegido'}</span></span>
        </div>
      </header>
      {!completion && <ol className="recharge-steps" aria-label="Pasos de la recarga">
        <li className={step === 1 ? 'is-current' : 'is-complete'} aria-current={step === 1 ? 'step' : undefined}><span className="recharge-step-number">{step === 2 ? <Icon name="Check" size={14} /> : '1'}</span>Elige el monto</li>
        <li className={step === 2 ? 'is-current' : ''} aria-current={step === 2 ? 'step' : undefined}><span className="recharge-step-number">2</span>Pago con tarjeta</li>
      </ol>}
      <main className="recharge-main">
        <div ref={viewport.viewport} className={`recharge-viewport ${completion ? 'has-completion' : ''}`}><div ref={viewport.content} className="recharge-content">
        {completion ? <section className="recharge-success" role="status" aria-live="polite">
          <div className="recharge-success-icon"><Icon name="CircleCheck" size={38} /></div>
          <span className="recharge-success-eyebrow">Recarga confirmada</span>
          <h2>¡Pago exitoso!</h2>
          <p>Tu pago de <strong>{money(completion.amountCents)}</strong> se aprobó y ya está aplicado a tu wallet.</p>
          {Number.isFinite(completion.balanceCents) && <div className="recharge-success-balance"><span>Saldo disponible</span><strong>{money(completion.balanceCents)}</strong></div>}
          <Button className="recharge-success-button" fullWidth onClick={goToWallet} iconName="Wallet">Ir a mi wallet</Button>
          <span className="recharge-success-redirect">Volviendo a tu wallet…</span>
        </section> : <>
        {error && <p role="alert" className="recharge-message recharge-error">{error}</p>}
        {step === 1 && returnState.fromInsufficientBalance && <section role="alert" className="recharge-message recharge-insufficient"><Icon name="CircleAlert" size={22} /><div><h2>Tu saldo no alcanza</h2><p>{Number(returnState.requiredAmount) > 0 ? `Te faltan $${Number(returnState.requiredAmount).toFixed(2)}. ` : ''}Elige cuánto recargar para continuar.</p></div></section>}
        {step === 1 && returnState.membershipKey && !returnState.fromInsufficientBalance && <p className="recharge-message recharge-membership">Después de recargar volverás a confirmar tu paquete de agua.</p>}
        <div className="recharge-workspace">
          {step === 1 && <section className="recharge-entry" aria-labelledby="recharge-amount-title">
            <div className="recharge-section-heading">
              <div><span className="recharge-eyebrow">A tu medida</span><h2 id="recharge-amount-title">Elige tu monto</h2><p>Selecciona o escribe un monto.</p></div>
              <div className="recharge-balance"><Icon name="Wallet" size={18} /><div><span>Saldo disponible</span><strong>{money(wallet)}</strong></div></div>
            </div>
            <div className="recharge-amounts" role="group" aria-label="Montos de recarga">
              {[50, 100, 200, 500].map((value) => {
                const selected = amount === value && !custom;
                const optionBonus = bonusFor(value * 100);
                return <button type="button" key={value} aria-pressed={selected} aria-label={`Recargar ${value} pesos`}
                  onClick={() => { setAmount(value); setCustom(''); setError(''); }} className={`recharge-amount-option ${selected ? 'is-selected' : ''}`}>
                  <span className="recharge-option-value">${value}<span>MXN</span></span>
                  <span className="recharge-option-check" aria-hidden="true">{selected && <Icon name="Check" size={14} />}</span>
                  <span className={`recharge-option-note ${optionBonus > 0 ? 'has-bonus' : ''}`}>{optionBonus > 0 ? `+${money(optionBonus)} de bono` : 'Para tu saldo'}</span>
                </button>;
              })}
            </div>
            <div className={`recharge-custom ${invalidCustom ? 'is-invalid' : ''}`}>
              <label htmlFor="recharge-custom-amount">Otro monto <span>Personalizado</span></label>
              <div className="recharge-custom-field"><span aria-hidden="true">$</span><input id="recharge-custom-amount" type="text" inputMode="decimal" autoComplete="off" placeholder="Ingresa el monto" value={custom}
                aria-invalid={invalidCustom} aria-describedby="recharge-custom-help"
                onChange={(event) => { const value = event.target.value; if (/^\d*(\.\d{0,2})?$/.test(value)) { setCustom(value); setAmount(Number(value)); setError(''); } }} /><span>MXN</span></div>
              <p id="recharge-custom-help" role={invalidCustom ? 'alert' : undefined}>{invalidCustom ? 'El monto debe estar entre $10 y $500.' : 'Desde $10 hasta $500. Puedes incluir centavos.'}</p>
            </div>
          </section>}
          <aside className="recharge-order" aria-label="Resumen de la recarga">
            <div className="recharge-order-heading"><Icon name="ReceiptText" size={19} /><h2>Tu recarga</h2><span>MXN</span></div>
            <dl className="recharge-summary">
              <div className="recharge-pay-amount"><dt>{step === 1 ? 'Monto elegido' : 'Pagarás'}</dt><dd>{validAmount ? money(amountCents) : '—'}</dd></div>
              {quotedBonus > 0 && <div className="recharge-bonus"><dt>Bono aplicado</dt><dd>+{money(quotedBonus)}</dd></div>}
              <div className="recharge-received"><dt>Recibirás en saldo</dt><dd aria-live="polite" aria-atomic="true">{validAmount ? money(receives) : '—'}</dd></div>
            </dl>
            <div className="recharge-projected"><Icon name="Wallet" size={18} /><div><span>Tu saldo después de recargar</span><strong>{money(wallet + (validAmount ? receives : 0))}</strong></div></div>
            {step === 1 ? <Button className="recharge-continue" fullWidth size="lg" disabled={!validAmount} aria-label={validAmount ? `Continuar con ${money(amountCents)}` : 'Continuar'} iconName="ArrowRight" iconPosition="right" onClick={() => { setStep(2); setError(''); }}><span>Continuar<span className="recharge-continue-amount">{validAmount ? ` con ${money(amountCents)}` : ''}</span></span></Button>
              : !locked && <Button key="change-amount" className="recharge-change" type="button" variant="outline" onClick={backToAmount} aria-label="Cambiar monto">Cambiar</Button>}
            <p className="recharge-order-note"><Icon name="LockKeyhole" size={13} />{step === 1 ? 'Pago seguro con tarjeta' : 'El saldo se acredita al confirmar el pago'}</p>
          </aside>
          {step === 2 && <ClipCardPayment request={request} amountCents={amountCents} prepare={prepare} resumeId={returnedId}
            submit={(id, cardToken, customer) => request(`/api/recharge/clip/pay/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ cardToken, customer }) })}
            verify={(id) => request(`/api/recharge/clip/status/${encodeURIComponent(id)}`)}
            onSuccess={finish} onPaymentChange={paymentChanged} onBusyChange={setPaymentBusy} />}
        </div>
        </>}
        </div></div>
      </main>
      <BottomTabNavigation className="recharge-navigation" onNavigate={() => !paymentBusy} />
      <NotificationToast />
    </div>
  );
}
