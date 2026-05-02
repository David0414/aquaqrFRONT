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

const CoinRechargeScreen = ({
  insertedThisSession,
  latestCoinAmount,
  machineAccumulatedAmount,
  onSave,
  onClose,
  saving = false,
}) => (
  <section className="relative overflow-hidden rounded-[2rem] border border-sky-100 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.18),_transparent_34%),linear-gradient(135deg,_#f8fffb_0%,_#eefcff_42%,_#ffffff_100%)] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
    <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-emerald-200/40 blur-3xl" />
    <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-sky-200/40 blur-2xl" />

    <div className="relative">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Moneda insertada</p>
          <h2 className="mt-2 text-3xl font-black text-slate-900">Recarga en vivo</h2>
          <p className="mt-2 text-sm text-slate-500">
            Inserta monedas. Esta vista te muestra en tiempo real cuanto se ha detectado.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-slate-500 shadow-sm transition-colors duration-200 hover:bg-white"
          aria-label="Cerrar recarga con monedas"
        >
          <Icon name="X" size={18} />
        </button>
      </div>

      <div className="mt-6 rounded-[2rem] bg-[linear-gradient(135deg,_#1e3f7a_0%,_#285ea5_45%,_#34d399_100%)] p-6 text-white shadow-[0_18px_40px_rgba(30,63,122,0.22)]">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">Saldo detectado en esta recarga</p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-5xl font-black tracking-tight">
              ${Number(insertedThisSession || 0).toFixed(2)}
            </p>
            <p className="mt-2 text-sm text-white/80">Se actualiza solo conforme entren monedas.</p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur animate-pulse">
            <Icon name="Coins" size={34} className="text-white" />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Ultima moneda</p>
          <p className="mt-2 text-3xl font-black text-emerald-600">
            ${Number(latestCoinAmount || 0).toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Ultimo valor detectado por la telemetria.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Total detectado en maquina</p>
          <p className="mt-2 text-3xl font-black text-sky-700">
            ${Number(machineAccumulatedAmount || 0).toFixed(2)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Lectura acumulada actual de la maquina.</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={18} className="mt-0.5 text-emerald-600" />
          <p className="text-sm text-slate-700">
            El sistema sigue leyendo monedas todo el tiempo. Este acceso solo manda el comando una vez y te abre esta pantalla para revisar lo ingresado.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="default"
          size="lg"
          fullWidth
          onClick={onSave}
          loading={saving}
          disabled={saving}
          iconName="Save"
          iconPosition="left"
          className="sm:flex-1"
        >
          Guardar saldo
        </Button>
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onClick={onClose}
          className="sm:flex-1"
        >
          Seguir despues
        </Button>
      </div>
    </div>
  </section>
);

const BalanceRecharge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const { telemetry, balanceCents, setTelemetryEnabled, sendStageCommand } = useDispenseFlow();

  const [walletBreakdown, setWalletBreakdown] = useState({
    totalBalance: 0,
    realBalance: 0,
    bonusBalance: 0,
  });
  const [availablePromotions, setAvailablePromotions] = useState([]);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [coinScreenOpen, setCoinScreenOpen] = useState(false);
  const [coinScreenSaving, setCoinScreenSaving] = useState(false);
  const [coinBaselineAmount, setCoinBaselineAmount] = useState(0);
  const [clientSecret, setClientSecret] = useState('');
  const [rechargeId, setRechargeId] = useState(null);
  const [creatingPI, setCreatingPI] = useState(false);
  const [errors, setErrors] = useState({});

  const topUpPromotion = useMemo(
    () => availablePromotions.find((promotion) => promotion.key === 'topup_bonus' && promotion.isActive) || null,
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

  const presetAmounts = useMemo(
    () => DEFAULT_RECHARGE_OPTIONS.map((amount) => ({ amount, bonus: getBonusForAmount(amount) })),
    [getBonusForAmount]
  );

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
          realBalanceCents: walletData.balanceCents ?? 0,
          bonusBalanceCents: 0,
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
      totalBalance: balanceCents / 100,
      realBalance: balanceCents / 100,
    }));
  }, [balanceCents]);

  useEffect(() => {
    const onWalletUpdated = () => {
      fetchRechargeContext().catch(() => {});
    };

    window.addEventListener('wallet:updated', onWalletUpdated);
    return () => window.removeEventListener('wallet:updated', onWalletUpdated);
  }, [fetchRechargeContext]);

  useEffect(() => {
    const state = location?.state;
    if (state?.fromInsufficientBalance) {
      const requiredAmount = state?.requiredAmount || 50;
      const suggested = presetAmounts.find((p) => p.amount >= requiredAmount)?.amount || 50;
      setSelectedPaymentMethod('stripe');
      setSelectedAmount(suggested);
      showWarningToast(`Saldo insuficiente. Sugerimos recargar $${suggested}.`);
    }
  }, [location?.state]);

  useEffect(() => {
    setTelemetryEnabled(true);
    return () => setTelemetryEnabled(false);
  }, [setTelemetryEnabled]);

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
    if (method === 'coins') {
      return;
    }

    setSelectedPaymentMethod(method);
    setErrors((prev) => ({ ...prev, paymentMethod: '', amount: method === 'stripe' ? prev.amount : '' }));
  };

  const openCoinRechargeScreen = async () => {
    try {
      const baseline = Number(telemetry.accumulatedMoney || 0);
      setCoinBaselineAmount(baseline);
      setCoinScreenOpen(true);
      setSelectedPaymentMethod('');
      setClientSecret('');
      setRechargeId(null);
      setSelectedAmount(0);
      setCustomAmount('');
      setErrors((prev) => ({ ...prev, paymentMethod: '' }));
      await sendStageCommand('recarga_monedas');
    } catch (e) {
      setCoinScreenOpen(false);
      showErrorToast(e?.message || 'No se pudo activar recarga con monedas');
    }
  };

  const closeCoinRechargeScreen = () => {
    setCoinScreenOpen(false);
  };

  const handleSaveCoinRecharge = async () => {
    try {
      setCoinScreenSaving(true);
      await fetchRechargeContext();
      showSuccessToast('Saldo actualizado correctamente');
      setCoinBaselineAmount(Number(telemetry.accumulatedMoney || 0));
      setCoinScreenOpen(false);
    } catch (e) {
      showErrorToast(e?.message || 'No se pudo actualizar el saldo');
    } finally {
      setCoinScreenSaving(false);
    }
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
      showWarningToast('La recarga por monedas se refleja automaticamente al insertar efectivo.');
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
        body: JSON.stringify({ amountCents }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.clientSecret) {
        throw new Error(data?.error || 'No se pudo iniciar el pago');
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

      if (location?.state?.returnTo) {
        navigate(location.state.returnTo);
      } else {
        navigate('/home-dashboard');
      }
    } catch (e) {
      showErrorToast(e.message || 'No se pudo confirmar la recarga');
    }
  };

  const isStripeMode = selectedPaymentMethod === 'stripe';
  const currentBalance = walletBreakdown.totalBalance;
  const liveInsertedSessionAmount = Math.max(0, Number(telemetry.accumulatedMoney || 0) - Number(coinBaselineAmount || 0));
  const latestCoinAmount = Number(telemetry.insertedCoinAmount || 0);
  const machineAccumulatedAmount = Number(telemetry.accumulatedMoney || 0);

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
          <CurrentBalanceCard
            totalBalance={walletBreakdown.totalBalance}
            realBalance={walletBreakdown.realBalance}
            bonusBalance={walletBreakdown.bonusBalance}
          />

          {coinScreenOpen ? (
            <CoinRechargeScreen
              insertedThisSession={liveInsertedSessionAmount}
              latestCoinAmount={latestCoinAmount}
              machineAccumulatedAmount={machineAccumulatedAmount}
              onSave={handleSaveCoinRecharge}
              onClose={closeCoinRechargeScreen}
              saving={coinScreenSaving}
            />
          ) : (
            <>
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Metodo de Recarga</h2>
                <div className="space-y-3">
                  <PaymentMethodCard
                    method="stripe"
                    isSelected={isStripeMode}
                    onClick={handlePaymentMethodSelect}
                  />
                  <PaymentMethodCard
                    method="coins"
                    isSelected={false}
                    onClick={openCoinRechargeScreen}
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
          )}
        </div>
      </main>

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
};

export default BalanceRecharge;
