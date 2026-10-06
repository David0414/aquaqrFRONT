// src/pages/balance-recharge/index.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast, {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
} from '../../components/ui/NotificationToast';

import CurrentBalanceCard from './components/CurrentBalanceCard';
import PresetAmountCard from './components/PresetAmountCard';
import CustomAmountInput from './components/CustomAmountInput';
import PaymentMethodCard from './components/PaymentMethodCard';
import TransactionSummary from './components/TransactionSummary';
import StripePaymentElement from '../../components/payments/StripePaymentElement';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';
const DEFAULT_RECHARGE_OPTIONS = [50, 100, 200, 500];

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

function moneyFromCents(amountCents) {
  return Number(amountCents || 0) / 100;
}

const BalanceRecharge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const {
    machine,
    balanceCents,
  } = useDispenseFlow();

  const [walletBreakdown, setWalletBreakdown] = useState({
    totalBalance: 0,
    realBalance: 0,
    bonusBalance: 0,
  });
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const initialSelectedAmount = moneyFromCents(location?.state?.selectedAmountCents || 0);
  const [selectedAmount, setSelectedAmount] = useState(initialSelectedAmount);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('stripe');
  const [clientSecret, setClientSecret] = useState('');
  const [rechargeId, setRechargeId] = useState(null);
  const [creatingPI, setCreatingPI] = useState(false);
  const [errors, setErrors] = useState({});

  const topUpPromotion = useMemo(
    () => availablePromotions.find(
      (promotion) => promotion.key === 'topup_bonus' && promotion.isActive && promotion.isEnabledForUserThisMonth
    ) || null,
    [availablePromotions]
  );

  const topUpTiers = useMemo(
    () => (
      Array.isArray(topUpPromotion?.config?.tiers)
        ? [...topUpPromotion.config.tiers].sort((a, b) => Number(a.amountCents || 0) - Number(b.amountCents || 0))
        : []
    ),
    [topUpPromotion]
  );

  const getBonusForAmount = useCallback((amount) => {
    const amountCents = Math.round(Number(amount || 0) * 100);
    const matchingTier = [...topUpTiers]
      .filter((tier) => Number(tier.amountCents || 0) <= amountCents)
      .sort((a, b) => Number(b.amountCents || 0) - Number(a.amountCents || 0))[0];

    return moneyFromCents(matchingTier?.bonusCents || 0);
  }, [topUpTiers]);

  const presetAmounts = useMemo(() => {
    const standardOptions = DEFAULT_RECHARGE_OPTIONS.map((amount) => ({
      amount,
      bonus: getBonusForAmount(amount),
      label: '',
    }));

    const byAmount = new Map();
    standardOptions.forEach((option) => {
      if (!byAmount.has(option.amount) || option.label) {
        byAmount.set(option.amount, option);
      }
    });

    return [...byAmount.values()].sort((a, b) => a.amount - b.amount);
  }, [getBonusForAmount]);

  const fetchRechargeContext = useCallback(async () => {
    const token = await getToken({ template: CLERK_JWT_TEMPLATE });
    if (!token) throw new Error('No se pudo obtener token de sesion');

    let data = null;

    try {
      const res = await fetch(`${API}/api/rewards/summary`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) {
        const errorData = await safeJson(res);
        throw new Error(errorData?.error || 'No se pudo obtener el contexto de recarga');
      }
      data = await res.json();
    } catch (_error) {
      const walletRes = await fetch(`${API}/api/me/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const walletData = await safeJson(walletRes);
      if (!walletRes.ok) {
        throw new Error(walletData?.error || 'No se pudo obtener el saldo');
      }
      data = {
        wallet: {
          totalAvailableCents: walletData.balanceCents ?? 0,
          balanceCents: walletData.balanceCents ?? 0,
          realBalanceCents: walletData.realBalanceCents ?? walletData.balanceCents ?? 0,
          bonusBalanceCents: walletData.bonusBalanceCents ?? 0,
        },
        promotions: [],
      };
    }

    const totalBalance = moneyFromCents(data.wallet?.totalAvailableCents ?? data.wallet?.balanceCents ?? 0);
    const realBalance = moneyFromCents(data.wallet?.realBalanceCents ?? 0);
    const bonusBalance = moneyFromCents(data.wallet?.bonusBalanceCents ?? 0);

    setWalletBreakdown({
      totalBalance,
      realBalance,
      bonusBalance,
    });
    setAvailablePromotions(data.promotions || []);
    return data;
  }, [getToken]);

  useEffect(() => {
    fetchRechargeContext().catch((e) => showErrorToast(e.message || 'Error cargando saldo'));
  }, [fetchRechargeContext]);

  useEffect(() => {
    if (!Number.isFinite(balanceCents)) return;
    setWalletBreakdown((current) => ({
      ...current,
      totalBalance: Number(balanceCents) / 100,
    }));

  }, [balanceCents]);

  useEffect(() => {
    if (!Number.isFinite(balanceCents)) return;
    fetchRechargeContext().catch(() => {});
  }, [balanceCents, fetchRechargeContext]);

  useEffect(() => {
    const onWalletUpdated = (event) => {
      const nextTotalCents = event?.detail?.balanceCents;
      const nextRealCents = event?.detail?.realBalanceCents;
      const nextBonusCents = event?.detail?.bonusBalanceCents;

      if (
        Number.isFinite(nextTotalCents)
        || Number.isFinite(nextRealCents)
        || Number.isFinite(nextBonusCents)
      ) {
        setWalletBreakdown((current) => ({
          totalBalance: Number.isFinite(nextTotalCents) ? Number(nextTotalCents) / 100 : current.totalBalance,
          realBalance: Number.isFinite(nextRealCents) ? Number(nextRealCents) / 100 : current.realBalance,
          bonusBalance: Number.isFinite(nextBonusCents) ? Number(nextBonusCents) / 100 : current.bonusBalance,
        }));

        return;
      }

      fetchRechargeContext().catch(() => {});
    };

    window.addEventListener('wallet:updated', onWalletUpdated);
    return () => window.removeEventListener('wallet:updated', onWalletUpdated);
  }, [fetchRechargeContext]);

  useEffect(() => {
    const state = location?.state;
    if (state?.fromInsufficientBalance) {
      const requiredAmount = state?.requiredAmount || 50;
      const suggested = presetAmounts.find((p) => p.amount >= requiredAmount)?.amount || Math.max(10, Math.ceil(requiredAmount));
      setSelectedPaymentMethod('stripe');
      setSelectedAmount(suggested);
      window.scrollTo(0, 0);
    }
  }, [location?.state]);

  const handlePresetAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setErrors((prev) => ({ ...prev, amount: '' }));
    setClientSecret('');
    setRechargeId(null);
  };

  const handleCustomAmountChange = (value) => {
    setCustomAmount(value);
    const amount = Number.parseFloat(value) || 0;
    setSelectedAmount(amount);
    setErrors((prev) => ({ ...prev, amount: '' }));
    setClientSecret('');
    setRechargeId(null);
  };

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
    setErrors((prev) => ({ ...prev, paymentMethod: '', amount: method === 'stripe' ? prev.amount : '' }));
  };

  const validateRecharge = () => {
    const nextErrors = {};

    if (!selectedPaymentMethod) {
      nextErrors.paymentMethod = 'Selecciona un metodo de recarga';
    }

    if (selectedPaymentMethod === 'stripe') {
      if (selectedAmount < 10) nextErrors.amount = 'El monto minimo es $10';
      if (selectedAmount > 500) nextErrors.amount = 'El monto maximo es $500';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getBonus = () => getBonusForAmount(selectedAmount);
  const getFees = () => 0;

  const handleRecharge = async () => {
    if (!validateRecharge()) {
      showErrorToast('Corrige los errores antes de continuar');
      return;
    }
    if (selectedPaymentMethod !== 'stripe') {
      showWarningToast('Selecciona tarjeta para recargar.');
      return;
    }

    try {
      setCreatingPI(true);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      if (!token) throw new Error('No se pudo obtener token de sesion');

      const amountCents = Math.round(selectedAmount * 100);
      const res = await fetch(`${API}/api/recharge/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          amountCents,
          machineId: machine?.id,
          hardwareId: machine?.hardwareId,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.clientSecret) {
        throw new Error(data?.message || data?.error || 'No se pudo iniciar el pago');
      }

      setClientSecret(data.clientSecret);
      setRechargeId(data.rechargeId || null);
      showInfoToast('Introduce los datos de pago para continuar');
    } catch (e) {
      showErrorToast(e.message || 'Error creando el intento de pago');
    } finally {
      setCreatingPI(false);
    }
  };

  const waitBy = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const quickCheckRechargeStatus = async (rid) => {
    const token = await getToken({ template: CLERK_JWT_TEMPLATE });
    const maxTries = 3;
    const gapMs = 1200;

    const getStatus = async () => {
      const res = await fetch(`${API}/api/recharge/status/${rid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 404) return { notImplemented: true };
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data?.error || 'No se pudo leer estado de recarga');
      return data;
    };

    for (let i = 0; i < maxTries; i += 1) {
      const status = await getStatus();
      if (status?.notImplemented) return { fallback: true };
      if (status?.status === 'SUCCEEDED') return { ok: true };
      if (status?.status === 'FAILED' || status?.status === 'CANCELED') {
        throw new Error('El pago fue rechazado o cancelado');
      }
      await waitBy(gapMs);
    }

    try {
      const resRecheck = await fetch(`${API}/api/recharge/recheck/${rid}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resRecheck.status !== 404) {
        const recheckData = await safeJson(resRecheck);
        if (resRecheck.ok && recheckData?.status === 'SUCCEEDED') return { ok: true };

        const status = await getStatus();
        if (status?.status === 'SUCCEEDED') return { ok: true };
      }
    } catch {
      // Ignorado a proposito
    }

    return { ok: false };
  };

  const onStripeSuccess = async () => {
    try {
      showInfoToast('Confirmando recarga...');

      if (rechargeId) {
        const result = await quickCheckRechargeStatus(rechargeId);
        if (result?.ok) {
          await fetchRechargeContext();
          showSuccessToast('Recarga aplicada');
        } else if (result?.fallback) {
          showInfoToast('Pago recibido. Acreditacion en curso.');
        } else {
          showInfoToast('Pago recibido. Puede tardar unos segundos en reflejarse.');
        }
      } else {
        showInfoToast('Pago recibido. Verificando acreditacion.');
      }

      setClientSecret('');
      setRechargeId(null);

      if (location?.state?.returnTo && location.state.returnTo !== '/promotions') {
        navigate(location.state.returnTo, {
          state: {
            machineId: location.state.machineId,
            machineLocation: location.state.machineLocation,
            hardwareId: location.state.hardwareId,
            selectedLiters: location.state.selectedLiters,
            fromInsufficientBalance: true,
          },
        });
      } else if (location.state?.returnTo === '/promotions') {
        navigate('/promotions?view=memberships', { state: { membershipKey: location.state.membershipKey, walletUpdatedAt: Date.now() } });
      } else {
        navigate('/home-dashboard');
      }
    } catch (e) {
      showErrorToast(e.message || 'No se pudo confirmar la recarga');
    }
  };

  const isStripeMode = selectedPaymentMethod === 'stripe';
  const currentBalance = walletBreakdown.totalBalance;
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Volver"
          >
            <Icon name="ArrowLeft" size={24} className="text-text-primary" />
          </button>
          <h1 className="text-xl font-bold text-text-primary">Recargar Saldo</h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-6 py-6">
          {location.state?.fromInsufficientBalance ? (
            <section role="alert" className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <Icon name="AlertTriangle" size={30} className="shrink-0 text-amber-700" />
                <div>
                  <h2 className="text-2xl font-bold text-amber-950">Saldo insuficiente</h2>
                  <p className="mt-2 text-lg leading-relaxed text-amber-950">
                    Te llevamos a Recargas porque tu saldo no alcanza para completar la compra.
                  </p>
                  {Number(location.state.requiredAmount) > 0 ? (
                    <p className="mt-3 text-lg font-bold text-amber-950">
                      Te faltan ${Number(location.state.requiredAmount).toFixed(2)} MXN.
                    </p>
                  ) : null}
                  <p className="mt-2 text-base text-amber-900">Recarga con tarjeta para continuar.</p>
                </div>
              </div>
            </section>
          ) : null}
          {location.state?.membershipKey ? <section role="status" className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900"><strong>Recarga para activar tu membresía.</strong><p className="mt-1">Al terminar volverás a Membresías para confirmar el pago. La recarga de saldo por sí sola no activa el paquete.</p></section> : null}
          <CurrentBalanceCard
            totalBalance={walletBreakdown.totalBalance}
            realBalance={walletBreakdown.realBalance}
            bonusBalance={walletBreakdown.bonusBalance}
          />

          <>
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Metodo de Recarga</h2>
                <div className="space-y-3">
                  <PaymentMethodCard
                    method="stripe"
                    isSelected={isStripeMode}
                    onClick={handlePaymentMethodSelect}
                  />
                </div>
                {errors?.paymentMethod ? (
                  <p className="text-error text-body-sm mt-2">{errors.paymentMethod}</p>
                ) : null}
              </section>

              {isStripeMode ? (
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold text-text-primary">Selecciona el Monto</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {presetAmounts.map((preset) => (
                      <PresetAmountCard
                        key={preset.amount}
                        amount={preset.amount}
                        bonus={preset.bonus}
                        label={preset.label}
                        isSelected={selectedAmount === preset.amount && !customAmount}
                        onClick={handlePresetAmountSelect}
                      />
                    ))}
                  </div>

                  <CustomAmountInput
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    error={errors?.amount}
                    minAmount={10}
                    maxAmount={500}
                  />
                </section>
              ) : null}

              {selectedAmount > 0 && isStripeMode ? (
                <TransactionSummary
                  amount={selectedAmount}
                  bonus={getBonus()}
                  fees={getFees()}
                  currentBalance={currentBalance}
                />
              ) : null}

              {selectedAmount > 0 && isStripeMode && !clientSecret ? (
                <div className="pt-2">
                  <Button
                    variant="default"
                    size="lg"
                    fullWidth
                    onClick={handleRecharge}
                    loading={creatingPI}
                    disabled={creatingPI}
                    iconName="CreditCard"
                    iconPosition="left"
                  >
                    {creatingPI ? 'Creando pago...' : `Continuar con el pago $${(selectedAmount + getFees()).toFixed(2)}`}
                  </Button>
                </div>
              ) : null}

              {clientSecret && isStripeMode ? (
                <div className="mt-4 bg-card p-4 rounded-xl border">
                  <StripePaymentElement
                    clientSecret={clientSecret}
                    onSuccess={onStripeSuccess}
                    onError={(err) => showErrorToast(err.message || 'Error en el pago')}
                  />
                  {rechargeId ? (
                    <p className="mt-2 text-caption text-text-secondary">
                      ID de recarga: <span className="font-mono">{rechargeId}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}

            <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
              <div className="flex items-start space-x-3">
                <Icon
                  name="Shield"
                  size={20}
                  className="text-primary mt-0.5"
                />
                <div>
                  <h3 className="font-medium text-text-primary mb-1">Pago Seguro</h3>
                  <p className="text-text-secondary text-body-sm">
                    Procesado por Stripe. No almacenamos datos de tarjeta.
                  </p>
                </div>
              </div>
            </div>
          </>
        </div>
      </main>

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
};

export default BalanceRecharge;
