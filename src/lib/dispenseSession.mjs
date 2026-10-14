export const DISPENSE_BACKGROUND_LIMIT_MS = 5 * 60 * 1000;

export function isDispenseRoute(pathname) {
  return pathname === '/water' || pathname.startsWith('/water/')
    || pathname === '/water-dispensing-control'
    || pathname === '/qr-scanner-landing' || pathname === '/filling-progress';
}

// A QR reservation is not a filling transaction. Only the server can confirm
// that a started transaction still belongs to a current machine reservation.
export function canResumeDispense(data, now = Date.now()) {
  return Boolean(data?.active && data.tx?.txId && data.tx.status === 'STARTED'
    && Number.isFinite(Date.parse(data.expiresAt)) && Date.parse(data.expiresAt) > now);
}

export function resumedDispenseState(data, previousTx) {
  const sameTransaction = Boolean(previousTx?.txId && previousTx.txId === data.tx?.txId);
  return {
    machineId: data.machineId,
    machineLocation: data.machineLocation || 'Desconocida',
    hardwareId: data.hardwareId,
    selectedLiters: data.selectedLiters,
    tx: {
      ...data.tx,
      ...(sameTransaction && Number.isFinite(previousTx.startPulseCount)
        ? { startPulseCount: previousTx.startPulseCount } : {}),
      ...(sameTransaction && Number.isFinite(previousTx.pulsesPerLiter)
        ? { pulsesPerLiter: previousTx.pulsesPerLiter } : {}),
    },
    fromActiveSession: true,
  };
}
