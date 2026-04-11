export function normalizeHexPair(value) {
  const clean = String(value || '').trim().toUpperCase().replace(/[^0-9A-F]/g, '');
  if (!clean) return null;
  return clean.padStart(2, '0').slice(-2);
}

export const DEFAULT_PULSES_PER_LITER = 360;

export function isActiveHexByte(value) {
  const normalized = normalizeHexPair(value);
  if (!normalized) return false;
  return normalized !== '00';
}

export function hexPairToDecimal(value) {
  const normalized = normalizeHexPair(value);
  if (!normalized) return null;
  return Number.parseInt(normalized, 16);
}

export function hexWordToDecimal(high, low) {
  const normalizedHigh = normalizeHexPair(high);
  const normalizedLow = normalizeHexPair(low);
  if (!normalizedHigh || !normalizedLow) return null;
  return (Number.parseInt(normalizedHigh, 16) << 8) | Number.parseInt(normalizedLow, 16);
}

const TELEMETRY_STAGE_LABELS = {
  '00': 'En espera',
  '01': 'Escaneando QR',
  '02': 'Seleccionando tamano',
  '03': 'Colocando garrafon boca abajo',
  '04': 'Enjuagando',
  '05': 'Recarga con monedas',
  '06': 'Dispensando agua',
  '07': 'Proceso completado',
  '08': 'Cancelado',
  '09': 'Error',
};

export function getTelemetryStageLabel(stageCode) {
  const normalized = normalizeHexPair(stageCode);
  if (!normalized) return 'Sin etapa';
  return TELEMETRY_STAGE_LABELS[normalized] || `Paso ${hexPairToDecimal(normalized) ?? normalized}`;
}

export function getCoinLabel(coinByte) {
  const amount = hexPairToDecimal(coinByte);
  if (!amount) return 'Sin moneda';
  return `${amount} peso${amount === 1 ? '' : 's'}`;
}

export function formatMoneyAmount(value) {
  const amount = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function sanitizePulsesPerLiter(value, fallback = DEFAULT_PULSES_PER_LITER) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function pulsesToLiters(pulses, pulsesPerLiter = DEFAULT_PULSES_PER_LITER) {
  const safePulses = Number.parseInt(pulses, 10);
  const safePulsesPerLiter = sanitizePulsesPerLiter(pulsesPerLiter);
  if (!Number.isFinite(safePulses) || safePulses <= 0) return 0;
  return safePulses / safePulsesPerLiter;
}
