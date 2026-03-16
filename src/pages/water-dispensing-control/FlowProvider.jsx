import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { showErrorToast } from '../../components/ui/NotificationToast';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

// Caudal por defecto: 20L en 10s -> 120 L/min
const DEFAULT_FLOW_LPM = (20 / 10) * 60; // 120
const INPUT_POLL_INTERVAL_MS = 5000;

function normalizeHexPair(value) {
  const clean = String(value || '').trim().toUpperCase().replace(/[^0-9A-F]/g, '');
  if (!clean) return null;
  return clean.padStart(2, '0').slice(-2);
}

function isActiveHexByte(value) {
  const normalized = normalizeHexPair(value);
  if (!normalized) return false;
  return normalized !== '00';
}

function extractTelemetryBytes(payload) {
  const matches = String(payload || '').toUpperCase().match(/[0-9A-F]{2}/g) || [];
  for (let index = 0; index <= matches.length - 9; index += 1) {
    const chunk = matches.slice(index, index + 9);
    if (chunk[0] === 'E2' && chunk[8] === 'E3') return chunk;
  }
  return null;
}

function parseTelemetryPayload(payload) {
  const bytes = extractTelemetryBytes(payload);
  if (!bytes) return null;

  const machineHardwareId = bytes[1];
  const phHigh = bytes[2];
  const phLow = bytes[3];
  const solidsHigh = bytes[4];
  const solidsLow = bytes[5];
  const fillValveByte = bytes[6];
  const rinseValveByte = bytes[7];

  const phDecimal = (Number.parseInt(phHigh, 16) << 8) | Number.parseInt(phLow, 16);
  const solidsDecimal = (Number.parseInt(solidsHigh, 16) << 8) | Number.parseInt(solidsLow, 16);
  const phVoltage = Number(((phDecimal * 5) / 1023).toFixed(3));


  
  return {
    rawFrame: bytes.join('-'),
    machineHardwareId,
    phHex: `${phHigh}-${phLow}`,
    solidsHex: `${solidsHigh}-${solidsLow}`,
    phDecimal,
    solidsDecimal,
    phVoltage,
    fillValveOn: isActiveHexByte(fillValveByte),
    rinseValveOn: isActiveHexByte(rinseValveByte),
    receivedAt: Date.now(),
  };
}

const Ctx = createContext(null);
export const useDispenseFlow = () => useContext(Ctx);

export default function FlowProvider({ children }) {
  const { getToken } = useAuth();
  const location = useLocation();

  const machineFromRoute = useMemo(() => {
    const state = location.state || {};
    const fallbackId = 'AQ-2024-001';
    const machineId = String(state.machineId || fallbackId).trim();
    const machineLocation = String(
      state.machineLocation || 'Centro Comercial Plaza Norte, Local 15'
    ).trim();

    // Cuando el ID es una trama tipo E2-01-01-...-E3, el segundo byte suele ser
    // el identificador de hardware que usa la telemetria.
    const frameBytes = machineId.toUpperCase().match(/[0-9A-F]{2}/g) || [];
    const inferredHardwareId =
      frameBytes.length >= 3 && frameBytes[0] === 'E2' && frameBytes[frameBytes.length - 1] === 'E3'
        ? frameBytes[1]
        : null;

    return {
      id: machineId,
      location: machineLocation,
      hardwareId: inferredHardwareId || String(state.hardwareId || '01').trim(),
    };
  }, [location.state]);

  const [machine, setMachine] = useState(machineFromRoute);

  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | connected | disconnected
  const [isVerified, setIsVerified] = useState(false);

  const [allowedLiters, setAllowedLiters] = useState([5, 10, 20]);
  const [pricePerLiterCents, setPricePerLiterCents] = useState(175);
  const pricePerLiter = useMemo(() => (pricePerLiterCents || 0) / 100, [pricePerLiterCents]);

  const [selectedLiters, setSelectedLiters] = useState(20);
  const [balanceCents, setBalanceCents] = useState(0);

  const [lastTx, setLastTx] = useState(null);
  const [telemetry, setTelemetry] = useState({
    status: 'idle',
    rawResponse: '',
    rawFrame: '',
    machineHardwareId: null,
    phHex: '',
    solidsHex: '',
    phDecimal: null,
    solidsDecimal: null,
    phVoltage: null,
    fillValveOn: false,
    rinseValveOn: false,
    machineOnline: false,
    lastSeenAt: null,
    error: '',
  });
  const pollingRef = useRef(false);

  useEffect(() => {
    setMachine(machineFromRoute);
  }, [machineFromRoute]);

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

  async function pollInputs() {
    if (pollingRef.current) return;
    pollingRef.current = true;

    try {
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      const res = await fetch(`${API}/api/dispense/demo/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'inputs' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || 'No se pudo leer inputs');

      const rawResponse = [data?.response, ...(data?.lines || [])].filter(Boolean).join(' ');
      const parsed = parseTelemetryPayload(rawResponse);

      if (!parsed) {
        setTelemetry((prev) => ({
          ...prev,
          status: 'error',
          rawResponse,
          error: 'No se pudo interpretar la trama del sensor',
          machineOnline: false,
        }));
        return;
      }

      const expectedMachineId = normalizeHexPair(machine.hardwareId);
      const machineOnline = !expectedMachineId || parsed.machineHardwareId === expectedMachineId;

      setTelemetry({
        status: 'ok',
        rawResponse,
        rawFrame: parsed.rawFrame,
        machineHardwareId: parsed.machineHardwareId,
        phHex: parsed.phHex,
        solidsHex: parsed.solidsHex,
        phDecimal: parsed.phDecimal,
        solidsDecimal: parsed.solidsDecimal,
        phVoltage: parsed.phVoltage,
        fillValveOn: parsed.fillValveOn,
        rinseValveOn: parsed.rinseValveOn,
        machineOnline,
        lastSeenAt: parsed.receivedAt,
        error: '',
      });
    } catch (e) {
      setTelemetry((prev) => ({
        ...prev,
        status: 'error',
        machineOnline: false,
        error: e.message || 'Error leyendo inputs',
      }));
    } finally {
      pollingRef.current = false;
    }
  }

  async function sendStageCommand(action) {
    const token = await getToken({ template: CLERK_JWT_TEMPLATE });
    const res = await fetch(`${API}/api/dispense/demo/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.detail || data?.error || `No se pudo enviar ${action}`);
    return data;
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
    telemetry,
    fetchConfig,
    fetchWallet,
    pollInputs,
    sendStageCommand,
    startDispense,
  };

  useEffect(() => {
    let intervalId = 0;
    let cancelled = false;

    const startPolling = async () => {
      try {
        await pollInputs();
      } catch {
        // pollInputs already persists errors in state.
      }

      if (cancelled) return;
      intervalId = window.setInterval(() => {
        pollInputs();
      }, INPUT_POLL_INTERVAL_MS);
    };

    startPolling();

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
