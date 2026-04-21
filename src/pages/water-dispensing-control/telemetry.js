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

export const TELEMETRY_PROCESS_STEPS = {
  '00': {
    code: '00',
    label: 'Esperando inicio',
    shortLabel: 'Espera',
    instruction: 'Presiona Iniciar dispensado para comenzar.',
  },
  '01': {
    code: '01',
    label: 'Iniciar dispensado',
    shortLabel: 'Inicio',
    instruction: 'Inicio recibido. Ahora elige el tamano de la botella.',
  },
  '02': {
    code: '02',
    label: 'Elegir la botella',
    shortLabel: 'Botella',
    instruction: 'Selecciona el tamano de botella y continua.',
  },
  '03': {
    code: '03',
    label: 'Esperando comando de enjuague',
    shortLabel: 'Enjuague pendiente',
    instruction: 'La maquina espera el comando de enjuague. El boton Enjuagar ya puede usarse.',
  },
  '04': {
    code: '04',
    label: 'Boton enjuagar activado',
    shortLabel: 'Enjuagando',
    instruction: 'Enjuague activado. Espera a que termine antes de llenar.',
  },
  '05': {
    code: '05',
    label: 'Esperando comando llenado',
    shortLabel: 'Llenado pendiente',
    instruction: 'La maquina espera el comando de llenado. Ya puedes iniciar el llenado.',
  },
  '06': {
    code: '06',
    label: 'Boton llenando activado',
    shortLabel: 'Llenando',
    instruction: 'Llenado activo. Monitorea el avance del caudalimetro.',
  },
  '07': {
    code: '07',
    label: 'Proceso finalizado',
    shortLabel: 'Finalizado',
    instruction: 'Proceso finalizado. La maquina regresara a espera de inicio.',
  },
  '08': {
    code: '08',
    label: 'Cancelado',
    shortLabel: 'Cancelado',
    instruction: 'El proceso fue cancelado.',
  },
  '09': {
    code: '09',
    label: 'Error',
    shortLabel: 'Error',
    instruction: 'La maquina reporto un error. Revisa el monitor antes de continuar.',
  },
};

export function getTelemetryStepInfo(stageCode) {
  const normalized = normalizeHexPair(stageCode);
  if (!normalized) {
    return {
      code: '--',
      label: 'Sin etapa',
      shortLabel: 'Sin etapa',
      instruction: 'Esperando lectura de estado desde la maquina.',
    };
  }

  return TELEMETRY_PROCESS_STEPS[normalized] || {
    code: normalized,
    label: `Paso ${hexPairToDecimal(normalized) ?? normalized}`,
    shortLabel: `Paso ${normalized}`,
    instruction: 'Estado no definido en el flujo configurado.',
  };
}

export function getTelemetryStageLabel(stageCode) {
  return getTelemetryStepInfo(stageCode).label;
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
