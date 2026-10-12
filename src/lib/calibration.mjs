export const CALIBRATION_VOLUME_ML = 20000;

export function offsetFromCalibration(pulsesPerLiter, basePulsesPerLiter) {
  return Math.round((Number(pulsesPerLiter) / Number(basePulsesPerLiter) - 1) * CALIBRATION_VOLUME_ML);
}

export function calibrationFromOffset(offsetMl, basePulsesPerLiter) {
  if (String(offsetMl).trim() === '') throw new Error('Ingresa el desfase en mililitros');
  const offset = Number(offsetMl), base = Number(basePulsesPerLiter);
  const result = Math.round(base * (1 + offset / CALIBRATION_VOLUME_ML));
  if (!Number.isFinite(offset) || !Number.isFinite(base) || base <= 0 || result <= 0 || !Number.isSafeInteger(result)) {
    throw new Error('El desfase debe producir un volumen mayor que cero');
  }
  return result;
}
