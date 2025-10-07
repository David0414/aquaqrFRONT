import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { showErrorToast } from '../../components/ui/NotificationToast';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

// Caudal por defecto: 20L en 10s -> 120 L/min
const DEFAULT_FLOW_LPM = (20 / 10) * 60; // 120

const Ctx = createContext(null);
export const useDispenseFlow = () => useContext(Ctx);

export default function FlowProvider({ children }) {
  const { getToken } = useAuth();

  const [machine] = useState({
    id: 'AQ-2024-001',
    location: 'Centro Comercial Plaza Norte, Local 15',
  });

  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | connected | disconnected
  const [isVerified, setIsVerified] = useState(false);

  const [allowedLiters, setAllowedLiters] = useState([5, 10, 20]);
  const [pricePerLiterCents, setPricePerLiterCents] = useState(175);
  const pricePerLiter = useMemo(() => (pricePerLiterCents || 0) / 100, [pricePerLiterCents]);

  const [selectedLiters, setSelectedLiters] = useState(20);
  const [balanceCents, setBalanceCents] = useState(0);

  const [lastTx, setLastTx] = useState(null);

  // Simula conexión y verificación breve
  useEffect(() => {
    const t = setTimeout(() => {
      setConnectionStatus('connected');
      setIsVerified(true);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch(`${API}/api/dispense/config`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo obtener config');

      setPricePerLiterCents(data.pricePerLiterCents ?? 175);
      setAllowedLiters(data.allowedLiters ?? [5, 10, 20]);

      if (!(data.allowedLiters ?? [5, 10, 20]).includes(selectedLiters)) {
        setSelectedLiters((data.allowedLiters ?? [5, 10, 20])[0]);
      }
    } catch (e) {
      showErrorToast(e.message || 'Error cargando configuración');
    }
  }

  async function fetchWallet() {
    try {
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      const res = await fetch(`${API}/api/me/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo obtener el saldo');
      setBalanceCents(data.balanceCents ?? 0);
    } catch (e) {
      showErrorToast(e.message || 'Error cargando saldo');
    }
  }

  // Cobra e inicia el dispensado
  async function startDispense() {
    const token = await getToken({ template: CLERK_JWT_TEMPLATE });
    const res = await fetch(`${API}/api/dispense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        liters: selectedLiters,
        machineId: machine.id,
        location: machine.location,
      }),
    });
    const data = await res.json();

    if (res.status === 400 && data?.error === 'INSUFFICIENT_FUNDS') {
      const requiredAmount = Math.max(0, (data.amountCents - data.balanceCents) / 100);
      const err = new Error('INSUFFICIENT_FUNDS');
      err.code = 'INSUFFICIENT_FUNDS';
      err.requiredAmount = requiredAmount;
      throw err;
    }
    if (!res.ok) throw new Error(data?.error || 'No se pudo iniciar el dispensado');

    const amountCents = data.amountCents ?? Math.round(selectedLiters * pricePerLiter * 100);
    const newBalanceCents = data.newBalanceCents ?? data.balanceCents ?? 0;
    const prevBalanceCents = data.prevBalanceCents ?? balanceCents;

    const tx = {
      at: Date.now(),
      liters: selectedLiters,
      pricePerLiter,
      amountCents,
      prevBalanceCents,
      newBalanceCents,
      machineId: machine.id,
      location: machine.location,
      // ⬇️ Caudal real si viene del backend o 120 L/min por defecto
      flowRateLpm: data.flowRateLpm ?? DEFAULT_FLOW_LPM,
      txId: data.txId,
    };

    setBalanceCents(newBalanceCents);
    setLastTx(tx);
    return tx;
  }

  const value = {
    machine,
    connectionStatus,
    isVerified,
    allowedLiters,
    pricePerLiter,
    pricePerLiterCents,
    selectedLiters,
    setSelectedLiters,
    balanceCents,
    lastTx,
    fetchConfig,
    fetchWallet,
    startDispense,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
