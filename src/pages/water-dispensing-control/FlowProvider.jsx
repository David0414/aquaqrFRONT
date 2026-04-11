import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { showErrorToast } from '../../components/ui/NotificationToast';
import {
  DEFAULT_PULSES_PER_LITER,
  getCoinLabel,
  getTelemetryStageLabel,
  hexPairToDecimal,
  hexWordToDecimal,
  isActiveHexByte,
  normalizeHexPair,
  sanitizePulsesPerLiter,
} from './telemetry';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

// Caudal por defecto: 20L en 10s -> 120 L/min
const DEFAULT_FLOW_LPM = (20 / 10) * 60; // 120
const INPUT_POLL_INTERVAL_MS = 2000;
const INPUT_POLL_COOLDOWN_AFTER_COMMAND_MS = 1500;
const FLOWMETER_PULSES_PER_LITER_KEY = 'flowmeterPulsesPerLiter';

function extractTelemetryBytes(payload) {
  const matches = String(payload || '').toUpperCase().match(/[0-9A-F]{2}/g) || [];
  for (let index = 0; index <= matches.length - 15; index += 1) {
    const chunk = matches.slice(index, index + 15);
    if (chunk[0] === 'E2' && chunk[14] === 'E3') return chunk;
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
  const pumpByte = bytes[8];
  const stageByte = bytes[9];
  const flowmeterHigh = bytes[10];
  const flowmeterLow = bytes[11];
  const coinByte = bytes[12];
  const accumulatedMoneyByte = bytes[13];

  const phDecimal = hexWordToDecimal(phHigh, phLow);
  const solidsDecimal = hexWordToDecimal(solidsHigh, solidsLow);
  const flowmeterPulses = hexWordToDecimal(flowmeterHigh, flowmeterLow);
  const insertedCoinAmount = hexPairToDecimal(coinByte);
  const accumulatedMoney = hexPairToDecimal(accumulatedMoneyByte);
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
    pumpOn: isActiveHexByte(pumpByte),
    pumpHex: normalizeHexPair(pumpByte) || '00',
    currentStageCode: normalizeHexPair(stageByte) || '00',
    currentStageLabel: getTelemetryStageLabel(stageByte),
    flowmeterHex: `${flowmeterHigh}-${flowmeterLow}`,
    flowmeterPulses,
    coinHex: normalizeHexPair(coinByte) || '00',
    insertedCoinAmount,
    insertedCoinLabel: getCoinLabel(coinByte),
    accumulatedMoneyHex: normalizeHexPair(accumulatedMoneyByte) || '00',
    accumulatedMoney,
    receivedAt: Date.now(),
  };
}

function applyTelemetryActionSnapshot(currentTelemetry, action) {
  const nextSeenAt = Date.now();

  switch (action) {
    case 'valvula_llenado_on':
      return {
        ...currentTelemetry,
        pumpOn: true,
        fillValveOn: true,
        lastSeenAt: nextSeenAt,
        error: '',
      };
    case 'valvula_llenado_off':
      return {
        ...currentTelemetry,
        pumpOn: false,
        fillValveOn: false,
        lastSeenAt: nextSeenAt,
        error: '',
      };
    case 'valvula_enjuague_on':
      return {
        ...currentTelemetry,
        rinseValveOn: true,
        lastSeenAt: nextSeenAt,
        error: '',
      };
    case 'valvula_enjuague_off':
      return {
        ...currentTelemetry,
        rinseValveOn: false,
        lastSeenAt: nextSeenAt,
        error: '',
      };
    case 'bomba_on':
      return {
        ...currentTelemetry,
        pumpOn: true,
        lastSeenAt: nextSeenAt,
        error: '',
      };
    case 'bomba_off':
      return {
        ...currentTelemetry,
        pumpOn: false,
        lastSeenAt: nextSeenAt,
        error: '',
      };
    case 'apagar_valvulas_forzado':
      return {
        ...currentTelemetry,
        pumpOn: false,
        fillValveOn: false,
        rinseValveOn: false,
        lastSeenAt: nextSeenAt,
        error: '',
      };
    default:
      return currentTelemetry;
  }
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
  const [pulsesPerLiter, setPulsesPerLiterState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_PULSES_PER_LITER;
    return sanitizePulsesPerLiter(window.localStorage.getItem(FLOWMETER_PULSES_PER_LITER_KEY));
  });

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
    pumpOn: false,
    pumpHex: '00',
    currentStageCode: '00',
    currentStageLabel: 'Sin etapa',
    flowmeterHex: '',
    flowmeterPulses: null,
    coinHex: '00',
    insertedCoinAmount: 0,
    insertedCoinLabel: 'Sin moneda',
    accumulatedMoneyHex: '00',
    accumulatedMoney: 0,
    machineOnline: false,
    lastSeenAt: null,
    error: '',
  });
  const [telemetryEnabled, setTelemetryEnabled] = useState(false);
  const pollingRef = useRef(false);
  const pollingCooldownUntilRef = useRef(0);
  const telemetryCreditSyncRef = useRef('');
  const isDocumentVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible';

  const setPulsesPerLiter = (value) => {
    const nextValue = sanitizePulsesPerLiter(value);
    setPulsesPerLiterState(nextValue);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(FLOWMETER_PULSES_PER_LITER_KEY, String(nextValue));
    }
    return nextValue;
  };

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
      const nextAllowedLiters = data.allowedLiters ?? data.optionsLiters ?? [5, 10, 20];
      setAllowedLiters(nextAllowedLiters);

      if (!nextAllowedLiters.includes(selectedLiters)) {
        setSelectedLiters(nextAllowedLiters[0]);
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

  async function pollInputs(options = {}) {
    const force = options?.force === true;

    if (!force && !telemetryEnabled) return;
    if (!isDocumentVisible()) return;
    if (!force && Date.now() < pollingCooldownUntilRef.current) return;
    if (pollingRef.current) return;
    pollingRef.current = true;

    try {
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      const res = await fetch(`${API}/api/dispense/demo/monitor`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || 'No se pudo leer monitor');

      const rawResponse = [data?.response, ...(data?.lines || [])].filter(Boolean).join(' ');
      const parsed = parseTelemetryPayload(rawResponse);

      if (!parsed) {
        setTelemetry((prev) => ({
          ...prev,
          status: 'error',
          rawResponse,
          error: 'No se pudo interpretar la trama del sensor',
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
        pumpOn: parsed.pumpOn,
        pumpHex: parsed.pumpHex,
        currentStageCode: parsed.currentStageCode,
        currentStageLabel: parsed.currentStageLabel,
        flowmeterHex: parsed.flowmeterHex,
        flowmeterPulses: parsed.flowmeterPulses,
        coinHex: parsed.coinHex,
        insertedCoinAmount: parsed.insertedCoinAmount,
        insertedCoinLabel: parsed.insertedCoinLabel,
        accumulatedMoneyHex: parsed.accumulatedMoneyHex,
        accumulatedMoney: parsed.accumulatedMoney,
        machineOnline,
        lastSeenAt: parsed.receivedAt,
        error: '',
      });
    } catch (e) {
      setTelemetry((prev) => ({
        ...prev,
        status: 'error',
        error: e.message || 'Error leyendo inputs',
      }));
    } finally {
      pollingRef.current = false;
    }
  }

  async function sendStageCommand(action) {
    let previousTelemetry = null;

    setTelemetry((currentTelemetry) => {
      previousTelemetry = currentTelemetry;
      return applyTelemetryActionSnapshot(currentTelemetry, action);
    });

    const token = await getToken({ template: CLERK_JWT_TEMPLATE });
    try {
      pollingCooldownUntilRef.current = Date.now() + INPUT_POLL_COOLDOWN_AFTER_COMMAND_MS;
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
    } catch (error) {
      if (previousTelemetry) {
        setTelemetry(previousTelemetry);
      }
      throw error;
    }
  }

  async function syncTelemetryCredit(nextTelemetry) {
    const insertedAmount = Number.parseInt(nextTelemetry?.insertedCoinAmount, 10);
    const accumulatedAmount = Number.parseInt(nextTelemetry?.accumulatedMoney, 10);
    const pulseCount = Number.parseInt(nextTelemetry?.flowmeterPulses, 10);
    const rawFrame = String(nextTelemetry?.rawFrame || '').trim();

    if (!rawFrame) return;
    if (!Number.isFinite(insertedAmount) || insertedAmount < 0) return;

    const machineId =
      normalizeHexPair(nextTelemetry?.machineHardwareId) ||
      normalizeHexPair(machine?.hardwareId) ||
      String(machine?.id || 'UNKNOWN').trim().toUpperCase();

    const syncKey = `${machineId}:${rawFrame}`;
    if (telemetryCreditSyncRef.current === syncKey) return;
    telemetryCreditSyncRef.current = syncKey;

    try {
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      const res = await fetch(`${API}/api/recharge/telemetry-credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          machineId,
          insertedAmount,
          accumulatedAmount,
          pulseCount,
          rawFrame,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || data?.error || 'No se pudo sincronizar la recarga por telemetria');
      }

      if (typeof data?.balanceCents === 'number') {
        setBalanceCents(data.balanceCents);
        window.dispatchEvent(new CustomEvent('wallet:updated', {
          detail: {
            balanceCents: data.balanceCents,
            source: 'telemetry',
            machineId,
          },
        }));
      }
    } catch (error) {
      telemetryCreditSyncRef.current = '';
      console.error('syncTelemetryCredit error', error);
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
      startPulseCount: Number.parseInt(telemetry?.flowmeterPulses, 10) || 0,
      pulsesPerLiter,
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
    pulsesPerLiter,
    setPulsesPerLiter,
    lastTx,
    telemetry,
    telemetryEnabled,
    setTelemetryEnabled,
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
      if (!telemetryEnabled) return;
      try {
        if (isDocumentVisible()) {
          await pollInputs();
        }
      } catch {
        // pollInputs already persists errors in state.
      }

      if (cancelled) return;
      intervalId = window.setInterval(() => {
        if (isDocumentVisible()) {
          pollInputs();
        }
      }, INPUT_POLL_INTERVAL_MS);
    };

    const handleVisibilityChange = () => {
      if (telemetryEnabled && isDocumentVisible()) {
        pollInputs().catch(() => {});
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [telemetryEnabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!telemetryEnabled) return;
    if (!telemetry?.machineOnline) return;
    if (!telemetry?.rawFrame) return;

    syncTelemetryCredit(telemetry).catch(() => {});
  }, [telemetryEnabled, telemetry]); // eslint-disable-line react-hooks/exhaustive-deps

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
