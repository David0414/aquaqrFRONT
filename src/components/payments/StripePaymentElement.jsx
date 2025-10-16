// src/components/payments/StripePaymentElement.jsx
import React, { useState, useMemo } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../lib/stripe';

function InnerCheckout({ onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setNote('Confirmando con tu banco…');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        // Evita redirecciones salvo 3DS u otros flujos donde el emisor lo requiera
        redirect: 'if_required',
      });

      if (error) {
        setNote('');
        onError?.(error);
        setLoading(false);
        return;
      }

      // Estados típicos: 'succeeded' | 'processing' | 'requires_action'
      if (paymentIntent?.status === 'succeeded') {
        setNote('Pago confirmado ✅');
        onSuccess?.();
      } else if (paymentIntent?.status === 'processing') {
        setNote('Procesando… esto puede tardar unos segundos ⏳');
        onSuccess?.(); // el padre puede hacer polling del saldo
      } else {
        setNote('');
        onError?.(new Error(`Estado del pago: ${paymentIntent?.status || 'desconocido'}`));
        setLoading(false);
      }
    } catch (err) {
      setNote('');
      onError?.(err);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {/* Nota de estado */}
      {note && (
        <div className="text-sm text-text-secondary">{note}</div>
      )}

      {/* Botón con estado de carga muy visible */}
      <button
        type="submit"
        disabled={!stripe || loading}
        aria-busy={loading ? 'true' : 'false'}
        aria-live="polite"
        className={`w-full px-4 py-3 rounded-xl font-semibold transition-all duration-200
          focus:outline-none focus:ring-4
          ${loading
            ? 'bg-primary text-white cursor-wait shadow-lg ring-primary/40'
            : 'bg-black text-white hover:bg-black/90 active:scale-[.99]'}
        `}
      >
        {loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <span
              className="w-5 h-5 inline-block rounded-full border-2 border-white border-t-transparent animate-spin"
              aria-hidden="true"
            />
            Confirmando pago…
          </span>
        ) : (
          'Pagar'
        )}
      </button>

      {/* Mensaje auxiliar cuando está pagando */}
      {loading && (
        <p className="text-xs text-center text-text-secondary">
          No cierres esta ventana mientras confirmamos con tu banco.
        </p>
      )}
    </form>
  );
}

export default function StripePaymentElement({ clientSecret, onSuccess, onError }) {
  if (!clientSecret) return null;

  const options = useMemo(
    () => ({
      clientSecret,
      appearance: { theme: 'flat' },
    }),
    [clientSecret]
  );

  return (
    <Elements
      stripe={stripePromise}
      options={options}
      // Mantener key si cambias clientSecret para forzar re-montaje seguro del PaymentElement
      key={clientSecret}
    >
      <InnerCheckout onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
