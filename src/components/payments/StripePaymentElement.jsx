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
        // devolvemos control para que la página haga el polling (saldo/estado)
        onSuccess?.();
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
      {note && (
        <div className="text-sm text-text-secondary">{note}</div>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full px-4 py-3 rounded-xl bg-black text-white font-medium disabled:opacity-50"
      >
        {loading ? 'Procesando…' : 'Pagar'}
      </button>
    </form>
  );
}

export default function StripePaymentElement({ clientSecret, onSuccess, onError }) {
  if (!clientSecret) return null;

  const options = useMemo(() => ({
    clientSecret,
    appearance: { theme: 'flat' },
  }), [clientSecret]);

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
