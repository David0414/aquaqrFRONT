import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';
import { checkoutRequestId } from '../../lib/checkout.mjs';
import ClipCardPayment from '../../components/ui/ClipCardPayment';

const API = import.meta.env.VITE_API_URL;
const RESUME_KEY = 'agua24.clip-recharge';
const money = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
function savedReturn(userId, id) {
  try { const value = JSON.parse(sessionStorage.getItem(RESUME_KEY)); return value?.userId === userId && value.rechargeId === id ? value.state : {}; }
  catch { return {}; }
}
export default function ClipRecharge() {
  const navigate = useNavigate(), location = useLocation();
  const { getToken, userId } = useAuth();
  const { balanceCents } = useDispenseFlow();
  const returnedId = new URLSearchParams(location.search).get('clipRecharge');
  const [step, setStep] = useState(returnedId ? 2 : 1);
  const [amount, setAmount] = useState(Number(location.state?.selectedAmountCents || 0) / 100);
  const [custom, setCustom] = useState('');
  const [wallet, setWallet] = useState(Number(balanceCents || 0));
  const [promotion, setPromotion] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paymentBusy, setPaymentBusy] = useState(false);
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
    (async () => {
      try {
        const response = await fetch(`${API}/api/rewards/summary`, { headers: await tokenHeaders(), cache: 'no-store' });
        const data = await response.json();
        if (!cancelled && response.ok) {
          setWallet(Number(data.wallet?.totalAvailableCents ?? data.wallet?.balanceCents ?? 0));
          setPromotion(data.promotions?.find((p) => p.key === 'topup_bonus' && p.isActive && p.isEnabledForUserThisMonth) || null);
        }
      } catch { /* Existing wallet balance remains visible if rewards cannot be loaded. */ }
    })();
    return () => { cancelled = true; };
  }, [tokenHeaders]);

  const amountCents = Math.round(amount * 100);
  const tier = [...(promotion?.config?.tiers || [])].filter((t) => t.amountCents <= amountCents).sort((a, b) => b.amountCents - a.amountCents)[0];
  const bonus = tier ? tier.bonusPercent !== undefined ? Math.round(amountCents * Number(tier.bonusPercent) / 100) : Number(tier.bonusCents || 0) : 0;
  const validAmount = Number.isFinite(amount) && amountCents >= 1000 && amountCents <= 50000;

  const finish = (data) => {
    try { sessionStorage.removeItem(RESUME_KEY); } catch { /* Storage may be disabled. */ }
    if (data.wallet) window.dispatchEvent(new CustomEvent('wallet:updated', { detail: {
      realBalanceCents: data.wallet.balanceCents, bonusBalanceCents: data.wallet.bonusBalanceCents,
      balanceCents: Number(data.wallet.balanceCents || 0) + Number(data.wallet.bonusBalanceCents || 0),
    } }));
    if (returnState.returnTo === '/promotions') navigate('/promotions?view=memberships', { replace: true, state: {
      membershipKey: returnState.membershipKey, membershipMachineId: returnState.membershipMachineId, walletUpdatedAt: Date.now() } });
    else navigate(returnState.returnTo || '/home-dashboard', { replace: true, state: { ...returnState, fromInsufficientBalance: true } });
  };

  const prepare = async ({ newAttempt } = {}) => {
    if (!validAmount) throw new Error('El monto debe estar entre $10 y $500.');
    if (newAttempt || requestId.current?.amountCents !== amountCents) requestId.current = { amountCents, requestId: checkoutRequestId() };
    return request('/api/recharge/clip/prepare', { method: 'POST', body: JSON.stringify(requestId.current) });
  };
  const paymentChanged = (data) => {
    setPayment(data); setAmount(data.amountCents / 100);
    try { sessionStorage.setItem(RESUME_KEY, JSON.stringify({ userId, rechargeId: data.rechargeId, state: returnState })); } catch { /* Verification remains authenticated. */ }
    if (data.rechargeId && data.rechargeId !== returnedId) navigate(`/balance-recharge?clipRecharge=${encodeURIComponent(data.rechargeId)}`, { replace: true, state: returnState });
  };
  const locked = paymentBusy || (payment?.status === 'PENDING' && !payment.canPay);

  const backToAmount = () => {
    setStep(1); setPayment(null); setError(''); requestId.current = null;
    navigate('/balance-recharge', { replace: true, state: returnState });
  };
  return (
    <div className={`recharge-screen ${step === 2 ? 'recharge-payment-step' : ''} flex h-[100dvh] flex-col bg-background`}>
      <header className="shrink-0 border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button type="button" aria-label="Volver" disabled={locked} onClick={() => step === 2 ? backToAmount() : navigate(-1)} className="rounded-xl p-2"><Icon name="ArrowLeft" size={24} /></button>
          <h1 className="text-xl font-bold">{step === 1 ? '1. Elige tu monto' : '2. Realiza el pago'}</h1>
          <span className="text-sm font-semibold">{step}/2</span>
        </div>
      </header>
      <main className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-3 px-4 pb-20 pt-3">
        {error && <p role="alert" className="recharge-message rounded-xl border border-red-300 bg-red-50 p-3 font-semibold text-red-900">{error}</p>}
        {step === 1 ? <>
          {returnState.fromInsufficientBalance && <section role="alert" className="recharge-message rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-amber-950"><h2 className="text-lg font-bold">Tu saldo no alcanza</h2><p className="text-sm">{Number(returnState.requiredAmount) > 0 ? `Te faltan $${Number(returnState.requiredAmount).toFixed(2)}. ` : ''}Elige cuánto recargar para continuar.</p></section>}
          {returnState.membershipKey && !returnState.fromInsufficientBalance && <p className="recharge-message text-sm font-medium text-sky-900">Después de recargar volverás a confirmar tu paquete de agua.</p>}
          <p className="recharge-balance text-base text-slate-700">Saldo disponible: <strong>{money(wallet)}</strong></p>
          <section className="recharge-amounts grid grid-cols-2 gap-3" aria-label="Montos de recarga">
            {[50, 100, 200, 500].map((value) => <button type="button" key={value} aria-pressed={amount === value && !custom}
              onClick={() => { setAmount(value); setCustom(''); setError(''); }}
              className={`rounded-2xl border-2 px-4 py-3 text-2xl font-bold ${amount === value && !custom ? 'border-sky-700 bg-sky-100 text-sky-950' : 'border-sky-200 bg-white text-slate-800'}`}>${value}</button>)}
          </section>
          <div className="recharge-custom rounded-2xl border-2 border-slate-400 bg-white px-3 py-2 text-slate-950"><Input label="Otro monto (de $10 a $500)" type="text" inputMode="decimal" placeholder="Por ejemplo: 150" value={custom}
            inputClassName="border-2 border-slate-500 bg-white text-lg font-semibold text-slate-950 placeholder:text-slate-600 focus-visible:ring-sky-700"
            onChange={(event) => { const value = event.target.value; if (/^\d*(\.\d{0,2})?$/.test(value)) { setCustom(value); setAmount(Number(value)); setError(''); } }} /></div>
          {amount > 0 && !validAmount && <p className="text-sm font-semibold text-red-700">El monto debe estar entre $10 y $500.</p>}
          <Button className="recharge-continue" fullWidth size="lg" disabled={!validAmount} onClick={() => { setStep(2); setError(''); }}>Continuar con {money(amountCents)}</Button>
        </> : <>
          <section className="recharge-summary grid shrink-0 grid-cols-3 gap-2 rounded-xl border border-sky-200 bg-white px-3 py-1 text-xs">
            <span>Recarga<strong className="block text-base">{money(amountCents)}</strong></span>
            <span className="text-emerald-800">Bono<strong className="block text-base">+{money(payment?.bonusCents ?? bonus)}</strong></span>
            <span>Recibes<strong className="block text-base">{money(amountCents + (payment?.bonusCents ?? bonus))}</strong></span>
          </section>
          <ClipCardPayment request={request} amountCents={amountCents} prepare={prepare} resumeId={returnedId}
            submit={(id, cardToken, customer) => request(`/api/recharge/clip/pay/${encodeURIComponent(id)}`, { method: 'POST', body: JSON.stringify({ cardToken, customer }) })}
            verify={(id) => request(`/api/recharge/clip/status/${encodeURIComponent(id)}`)}
            onSuccess={finish} onPaymentChange={paymentChanged} onBusyChange={setPaymentBusy} />
          <Button className="recharge-change" fullWidth variant="outline" disabled={locked} onClick={backToAmount}>Cambiar monto</Button>
        </>}
      </main>
      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
}
