import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { showErrorToast, showInfoToast } from '../../../components/ui/NotificationToast';
import { useDispenseFlow } from '../FlowProvider';
import { useWaterFlowNavigation } from '../WaterFlowLayout';
import TelemetryStatusCard from '../components/TelemetryStatusCard';
import MachineBusyAlert from '../components/MachineBusyAlert';

const RINSE_DURATION_MS = 3000;
const RINSE_ACCEPT_TIMEOUT_MS = 6500;
const RINSE_ACCEPT_POLL_MS = 500;
const RINSE_ACCEPTED_STAGES = new Set(['04', '05', '06']);

export default function PlaceBottleDown() {
  const nav = useNavigate();
  const { requestNavigation, shouldGuardExit } = useWaterFlowNavigation();
  const {
    machine,
    telemetry,
    guidedTelemetry,
    hasPendingQrStart,
    setTelemetryEnabled,
    sendStageCommand,
    pollInputs,
  } = useDispenseFlow();
  const [rinseStatus, setRinseStatus] = useState('idle');
  const [rinseMessage, setRinseMessage] = useState('Listo');
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [machineBusyError, setMachineBusyError] = useState(null);

  React.useEffect(() => {
    setTelemetryEnabled(true);
    return () => setTelemetryEnabled(false);
  }, [setTelemetryEnabled]);

  const displayTelemetry = guidedTelemetry || telemetry;
  const currentStageCode = displayTelemetry.currentStageCode || '00';
  const telemetryFresh = Boolean(
    displayTelemetry.machineOnline
    && displayTelemetry.lastSeenAt
    && Date.now() - displayTelemetry.lastSeenAt < 8000
  );
  const canTriggerRinse = currentStageCode === '03';
  const canAdvanceToFill = currentStageCode === '04' || currentStageCode === '05' || currentStageCode === '06';
  const canUseNext = telemetryFresh && (canTriggerRinse || canAdvanceToFill);
  const nextButtonLabel = canAdvanceToFill ? 'Ir a llenado' : 'Enjuagar';
  const hasStartedFlow = Boolean(shouldGuardExit);

  const handleBackOrCancel = () => {
    const targetPath = hasStartedFlow ? '/home-dashboard' : '/water/choose';
    if (requestNavigation(targetPath)) nav(targetPath);
  };

  React.useEffect(() => {
    if (hasPendingQrStart) return;
    if (currentStageCode !== '00') return;
    if (!displayTelemetry.lastSeenAt) return;

    showInfoToast('Maquina en espera.');
    nav('/home-dashboard', {
      replace: true,
      state: {
        machineReleased: true,
        reason: 'idle',
      },
    });
  }, [currentStageCode, displayTelemetry.lastSeenAt, hasPendingQrStart, nav]);

  const delay = (ms) => new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

  const waitForRinseAccepted = async () => {
    const deadline = Date.now() + RINSE_ACCEPT_TIMEOUT_MS;
    let lastStageCode = telemetry.currentStageCode || currentStageCode || '00';

    while (Date.now() <= deadline) {
      const nextTelemetry = await pollInputs({ force: true }).catch(() => null);
      const nextStageCode = nextTelemetry?.currentStageCode;

      if (nextStageCode) {
        lastStageCode = nextStageCode;
      }

      if (RINSE_ACCEPTED_STAGES.has(lastStageCode)) {
        return lastStageCode;
      }

      if (lastStageCode === '00' || lastStageCode === '08' || lastStageCode === '09') {
        break;
      }

      await delay(RINSE_ACCEPT_POLL_MS);
    }

      throw new Error(`Enjuague no confirmado. Paso ${lastStageCode}.`);
  };

  const triggerRinse = async () => {
    try {
      setMachineBusyError(null);
      if (!telemetryFresh) {
        throw new Error('Maquina sin conexion.');
      }
      setRinseStatus('sending');
      setRinseMessage('Activando...');
      await sendStageCommand('enjuague');
      setRinseMessage('Esperando confirmacion...');
      const acceptedStageCode = await waitForRinseAccepted();
      setRinseMessage('Enjuagando...');
      await delay(RINSE_DURATION_MS);
      const latestTelemetry = await pollInputs({ force: true }).catch(() => null);
      const latestStageCode = latestTelemetry?.currentStageCode || acceptedStageCode;
      setRinseStatus('success');
      setRinseMessage(
        latestStageCode === '06'
          ? 'Llenado listo.'
          : 'Enjuague confirmado.'
      );
    } catch (err) {
      if (err?.code === 'MACHINE_BUSY') {
        setMachineBusyError(err);
        setRinseStatus('error');
        setRinseMessage('Maquina en uso.');
        throw err;
      }
      const message = err?.message || 'No se pudo activar';
      setRinseStatus('error');
      setRinseMessage(message);
      showErrorToast(message);
      err.notified = true;
      throw err;
    }
  };

  const handleNext = async () => {
    try {
      setIsAdvancing(true);

      if (!telemetryFresh) {
        showErrorToast('Maquina sin conexion.');
        return;
      }

      if (canAdvanceToFill) {
        nav('/water/position-up');
        return;
      }

      if (!canTriggerRinse) {
        showErrorToast(`Espera paso 03. Actual: ${currentStageCode}.`);
        return;
      }

      await triggerRinse();
      await pollInputs({ force: true }).catch(() => {});
      nav('/water/position-up');
    } catch (err) {
      if (err?.code === 'MACHINE_BUSY') {
        return;
      }
      if (!err?.notified) {
        showErrorToast(err?.message || 'No se pudo reenviar el enjuague');
      }
    } finally {
      setIsAdvancing(false);
    }
  };

  const statusClasses =
    rinseStatus === 'success'
      ? 'border-success/20 bg-success/10 text-success'
      : rinseStatus === 'error'
        ? 'border-error/20 bg-error/10 text-error'
        : 'border-muted bg-muted/40 text-text-secondary';

  const statusIcon =
    rinseStatus === 'success'
      ? 'CheckCircle2'
      : rinseStatus === 'error'
        ? 'AlertCircle'
      : 'Info';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Preparar garrafon</h2>
        <span className="text-sm text-text-secondary">Maquina #{machine.id}</span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <motion.div
          animate={{ rotate: [0, -15, 0], y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-2xl bg-primary/10"
        >
          <Icon name="Droplets" size={44} className="text-primary" />
        </motion.div>

        <h3 className="mb-2 text-2xl font-bold text-text-primary">Garrafon boca abajo</h3>

        <div className={`mx-auto mt-6 max-w-lg rounded-xl border px-4 py-3 text-sm ${statusClasses}`}>
          <div className="flex items-center justify-center gap-2">
            <Icon name={statusIcon} size={18} className={rinseStatus === 'sending' ? 'animate-spin' : ''} />
            <span className="font-medium">{rinseMessage}</span>
          </div>
        </div>
      </div>

      <TelemetryStatusCard telemetry={displayTelemetry} title="Estado" compact />

      {!telemetryFresh ? (
        <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error">
          Maquina sin conexion.
        </div>
      ) : null}

      <MachineBusyAlert
        error={machineBusyError}
        onBackHome={() => nav('/home-dashboard', { replace: true })}
      />

      <div className="flex gap-3">
        <Button
          variant={hasStartedFlow ? 'destructive' : 'secondary'}
          className="flex-1"
          onClick={handleBackOrCancel}
        >
          <Icon name={hasStartedFlow ? 'RotateCcw' : 'ArrowLeft'} size={18} />
          {hasStartedFlow ? 'Cancelar llenado' : 'Atras'}
        </Button>
        <Button
          className="flex-1"
          onClick={handleNext}
          disabled={!canUseNext || isAdvancing}
          loading={isAdvancing}
        >
          {nextButtonLabel} <Icon name="ArrowRight" size={18} />
        </Button>
      </div>

      {rinseStatus === 'error' ? (
        <Button variant="outline" onClick={triggerRinse} disabled={!canTriggerRinse}>
          Reintentar
        </Button>
      ) : null}
    </div>
  );
}
