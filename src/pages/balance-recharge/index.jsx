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

// Payment Element (ya confirma el pago y llama onSuccess/ onError)
import StripePaymentElement from '../../components/payments/StripePaymentElement';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

/* ----------------------------- helpers frontend ---------------------------- */
// Espera a que la recarga cambie a SUCCEEDED consultando al backend.
// Si se agota el tiempo, fuerza una revalidación contra Stripe y vuelve a leer.
async function waitForRecharge(rechargeId, { getToken, API, maxTries = 12, gapMs = 2500 }) {
  const token = await getToken({ template: CLERK_JWT_TEMPLATE });

  const getStatus = async () => {
    const res = await fetch(`${API}/api/recharge/status/${rechargeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudo leer el estado de la recarga');
    return res.json(); // { id, status, providerPaymentId }
  };

  // ~30s de espera total por defecto
  for (let i = 0; i < maxTries; i++) {
    const s = await getStatus();
    if (s.status === 'SUCCEEDED') return 'ok';
    if (s.status === 'FAILED' || s.status === 'CANCELED') {
      throw new Error('El pago fue rechazado o cancelado');
    }
    await new Promise(r => setTimeout(r, gapMs));
  }

  // tiempo agotado → pide reconciliación
  await fetch(`${API}/api/recharge/recheck/${rechargeId}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const final = await getStatus();
  if (final.status !== 'SUCCEEDED') {
    throw new Error('No se pudo confirmar la recarga con Stripe');
  }
  return 'ok';
}

const BalanceRecharge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();

  const [currentBalance, setCurrentBalance] = useState(0);

  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');

  const [clientSecret, setClientSecret] = useState('');   // para el Payment Element
  const [rechargeId, setRechargeId] = useState(null);     // NUEVO: lo que devuelve el backend
  const [creatingPI, setCreatingPI] = useState(false);    // UX mientras creamos el intent

  const [errors, setErrors] = useState({});

  const presetAmounts = [
    { amount: 30, bonus: 0 },
    { amount: 50, bonus: 5 },
    { amount: 100, bonus: 10 },
    { amount: 200, bonus: 25 },
  ];

  // Saldo real
  const fetchWallet = useCallback(async () => {
    try {
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      if (!token) throw new Error('No se pudo obtener token de sesión');

      const res = await fetch(`${API}/api/me/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('No se pudo obtener el saldo');
      const data = await res.json();
      setCurrentBalance((data.balanceCents ?? 0) / 100);
    } catch (e) {
      showErrorToast(e.message || 'Error cargando saldo');
    }
  }, [getToken]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Si venimos de “saldo insuficiente”
  useEffect(() => {
    const state = location?.state;
    if (state?.fromInsufficientBalance) {
      const requiredAmount = state?.requiredAmount || 50;
      const suggested = presetAmounts.find(p => p.amount >= requiredAmount)?.amount || 50;
      setSelectedAmount(suggested);
      showWarningToast(`Saldo insuficiente. Sugerimos recargar $${suggested}.`);
    }
  }, [location?.state]);

  const handlePresetAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setErrors(prev => ({ ...prev, amount: '' }));
    setClientSecret('');
    setRechargeId(null);
  };

  const handleCustomAmountChange = (value) => {
    setCustomAmount(value);
    const n = parseFloat(value) || 0;
    setSelectedAmount(n);
    setErrors(prev => ({ ...prev, amount: '' }));
    setClientSecret('');
    setRechargeId(null);
  };

  const validateRecharge = () => {
    const e = {};
    if (selectedAmount < 10) e.amount = 'El monto mínimo es $10';
    if (selectedAmount > 500) e.amount = 'El monto máximo es $500';
    if (!selectedPaymentMethod) e.paymentMethod = 'Selecciona un método de pago';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const getBonus = () => {
    const preset = presetAmounts.find(p => p.amount === selectedAmount);
    return preset?.bonus || 0;
  };

  const getFees = () => 0;

  // Crea PaymentIntent en el backend y guarda rechargeId
  const handleRecharge = async () => {
    if (!validateRecharge()) {
      showErrorToast('Corrige los errores antes de continuar');
      return;
    }
    if (selectedPaymentMethod !== 'stripe') {
      showWarningToast('Por ahora activado sólo Stripe');
      return;
    }
    try {
      setCreatingPI(true);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      if (!token) throw new Error('No se pudo obtener token de sesión');

      const amountCents = Math.round(selectedAmount * 100);

      const res = await fetch(`${API}/api/recharge/create-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amountCents }),
      });

      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        throw new Error(data.error || 'No se pudo iniciar el pago');
      }

      setClientSecret(data.clientSecret);
      setRechargeId(data.rechargeId || null); // <— guardar para confirmar estado luego
      showInfoToast('Introduce los datos de pago para continuar');
    } catch (e) {
      showErrorToast(e.message || 'Error creando el intento de pago');
    } finally {
      setCreatingPI(false);
    }
  };

  // Stripe confirmó; aquí confirmamos con backend (polling + recheck)
  const onStripeSuccess = async () => {
    try {
      showInfoToast('Confirmando recarga…');
      if (rechargeId) {
        await waitForRecharge(rechargeId, { getToken, API });
      }
      showSuccessToast('Recarga aplicada');
      setClientSecret('');
      setRechargeId(null);

      await fetchWallet();
      if (location?.state?.returnTo) {
        navigate(location.state.returnTo);
      } else {
        navigate('/home-dashboard');
      }
    } catch (e) {
      showErrorToast(e.message || 'No se pudo confirmar la recarga');
      // No navegamos; dejamos el Payment Element visible por si el usuario reintenta
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Main */}
      <main className="pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-6 py-6">
          <CurrentBalanceCard balance={currentBalance} />
          <PromotionalBanner />

          {/* Selección de monto */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Selecciona el Monto</h2>
            <div className="grid grid-cols-2 gap-3">
              {presetAmounts.map((p) => (
                <PresetAmountCard
                  key={p.amount}
                  amount={p.amount}
                  bonus={p.bonus}
                  isSelected={selectedAmount === p.amount && !customAmount}
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

          {/* Método de pago */}
          {selectedAmount > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Método de Pago</h2>
              <div className="space-y-3">
                <PaymentMethodCard
                  method="stripe"
                  isSelected={selectedPaymentMethod === 'stripe'}
                  onClick={setSelectedPaymentMethod}
                />
              </div>
              {errors?.paymentMethod && (
                <p className="text-error text-body-sm mt-2">{errors.paymentMethod}</p>
              )}
            </section>
          )}

          {/* Resumen */}
          {selectedAmount > 0 && selectedPaymentMethod && (
            <TransactionSummary
              amount={selectedAmount}
              bonus={getBonus()}
              fees={getFees()}
              currentBalance={currentBalance}
            />
          )}

          {/* Botón para crear el intent (muestra Payment Element) */}
          {selectedAmount > 0 && selectedPaymentMethod && !clientSecret && (
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
                {creatingPI ? 'Creando pago…' : `Continuar con el pago $${(selectedAmount + getFees()).toFixed(2)}`}
              </Button>
            </div>
          )}

          {/* Stripe Payment Element */}
          {clientSecret && selectedPaymentMethod === 'stripe' && (
            <div className="mt-4 bg-card p-4 rounded-xl border">
              <StripePaymentElement
                clientSecret={clientSecret}
                onSuccess={onStripeSuccess}
                onError={(err) => showErrorToast(err.message || 'Error en el pago')}
              />
              {rechargeId && (
                <p className="mt-2 text-caption text-text-secondary">
                  ID de recarga: <span className="font-mono">{rechargeId}</span>
                </p>
              )}
            </div>
          )}

          {/* Nota de seguridad */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
            <div className="flex items-start space-x-3">
              <Icon name="Shield" size={20} className="text-primary mt-0.5" />
              <div>
                <h3 className="font-medium text-text-primary mb-1">Pago Seguro</h3>
                <p className="text-text-secondary text-body-sm">
                  Procesado por Stripe. No almacenamos datos de tarjeta.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
};

export default BalanceRecharge;
