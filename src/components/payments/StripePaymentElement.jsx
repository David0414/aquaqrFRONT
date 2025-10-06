// src/components/payments/StripePaymentElement.jsx
import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../../lib/stripe';

function InnerCheckout({ onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    setLoading(false);

    if (error) return onError?.(error);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
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

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: 'flat' } }}
      key={clientSecret}
    >
      <InnerCheckout onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
