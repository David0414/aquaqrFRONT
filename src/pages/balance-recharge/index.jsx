// src/pages/balance-recharge/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
import PromotionalBanner from './components/PromotionalBanner';
import TransactionSummary from './components/TransactionSummary';
import StripePaymentElement from '../../components/payments/StripePaymentElement';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

async function safeJson(res) {
  try { return await res.json(); } catch { return {}; }
}

const BalanceRecharge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const { telemetry, setTelemetryEnabled, sendStageCommand } = useDispenseFlow();

  const [currentBalance, setCurrentBalance] = useState(0);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [rechargeId, setRechargeId] = useState(null);
  const [creatingPI, setCreatingPI] = useState(false);
  const [errors, setErrors] = useState({});

  const presetAmounts = [
    { amount: 30, bonus: 0 },
    { amount: 50, bonus: 5 },
    { amount: 100, bonus: 10 },
    { amount: 200, bonus: 25 },
  ];

  const fetchWallet = useCallback(async () => {
    const token = await getToken({ template: CLERK_JWT_TEMPLATE });
    if (!token) throw new Error('No se pudo obtener token de sesion');

    const res = await fetch(`${API}/api/me/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || 'No se pudo obtener el saldo');
    }
    const data = await res.json();
    const balance = (data.balanceCents ?? 0) / 100;
    setCurrentBalance(balance);
    return balance;
  }, [getToken]);

  useEffect(() => {
    fetchWallet().catch((e) => showErrorToast(e.message || 'Error cargando saldo'));
  }, [fetchWallet]);

  useEffect(() => {
    const onWalletUpdated = (event) => {
      const nextBalanceCents = Number(event?.detail?.balanceCents);
      if (!Number.isFinite(nextBalanceCents)) return;
      setCurrentBalance(nextBalanceCents / 100);
    };

    window.addEventListener('wallet:updated', onWalletUpdated);
    return () => window.removeEventListener('wallet:updated', onWalletUpdated);
  }, []);

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
    if (selectedPaymentMethod !== 'coins') return undefined;
    setTelemetryEnabled(true);
    return () => setTelemetryEnabled(false);
  }, [selectedPaymentMethod, setTelemetryEnabled]);

  useEffect(() => {
    if (selectedPaymentMethod !== 'coins') return undefined;

    let cancelled = false;

    const enableCoinRechargeMode = async () => {
      try {
        await sendStageCommand('recarga_monedas');
        if (!cancelled) {
          showInfoToast('Modo recarga con monedas activado');
        }
      } catch (e) {
        if (!cancelled) {
          showErrorToast(e?.message || 'No se pudo activar el modo recarga con monedas');
        }
      }
    };

    enableCoinRechargeMode();
    return () => {
      cancelled = true;
    };
  }, [selectedPaymentMethod, sendStageCommand]);

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

    if (method === 'coins') {
      setClientSecret('');
      setRechargeId(null);
      setSelectedAmount(0);
      setCustomAmount('');
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

  const getBonus = () => presetAmounts.find((p) => p.amount === selectedAmount)?.bonus || 0;
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
          await fetchWallet();
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

  const isCoinMode = selectedPaymentMethod === 'coins';
  const isStripeMode = selectedPaymentMethod === 'stripe';

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
          <CurrentBalanceCard balance={currentBalance} />
          <PromotionalBanner />

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
                isSelected={isCoinMode}
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

          {isCoinMode ? (
            <section className="space-y-4">
              <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                <div className="flex items-start gap-3">
                  <Icon name="Coins" size={22} className="mt-0.5 text-success" />
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Recarga con Monedas</h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      Inserta monedas en la maquina. El saldo se actualiza con el dinero acumulado recibido en la telemetria.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-xs uppercase tracking-wide text-text-secondary">Dinero insertado</p>
                  <p className="mt-2 text-2xl font-bold text-text-primary">
                    {telemetry.insertedCoinLabel || 'Sin moneda'}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Ultima moneda detectada
                  </p>
                </div>

                <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-success">Dinero acumulado</p>
                  <p className="mt-2 text-2xl font-bold text-success">
                    ${Number(telemetry.accumulatedMoney || 0).toFixed(2)} MXN
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Total acumulado reportado por la maquina
                  </p>
                </div>
              </div>

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

          {!isCoinMode ? (
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
          ) : null}
        </div>
      </main>

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
};

export default BalanceRecharge;
