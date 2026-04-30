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
  const { machine, telemetry, guidedTelemetry, setTelemetryEnabled, sendStageCommand, pollInputs } = useDispenseFlow();
  const [rinseStatus, setRinseStatus] = useState('idle');
  const [rinseMessage, setRinseMessage] = useState('El enjuague se habilita cuando el paso sea 03.');
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
    if (currentStageCode !== '00') return;
    if (!displayTelemetry.lastSeenAt) return;

    showInfoToast('La maquina regreso a espera. Reinicia el flujo cuando estes listo.');
    nav('/home-dashboard', {
      replace: true,
      state: {
        machineReleased: true,
        reason: 'idle',
      },
    });
  }, [currentStageCode, displayTelemetry.lastSeenAt, nav]);

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

    throw new Error(`La maquina no confirmo enjuague. Ultimo paso leido: ${lastStageCode}.`);
  };

  const triggerRinse = async () => {
    try {
      setMachineBusyError(null);
      if (!telemetryFresh) {
        throw new Error('La maquina no esta conectada o no esta enviando trama.');
      }
      setRinseStatus('sending');
      setRinseMessage('Activando enjuague por 3 segundos...');
      await sendStageCommand('enjuague');
      setRinseMessage('Esperando confirmacion de la maquina...');
      const acceptedStageCode = await waitForRinseAccepted();
      setRinseMessage('Enjuagando...');
      await delay(RINSE_DURATION_MS);
      const latestTelemetry = await pollInputs({ force: true }).catch(() => null);
      const latestStageCode = latestTelemetry?.currentStageCode || acceptedStageCode;
      setRinseStatus('success');
      setRinseMessage(
        latestStageCode === '06'
          ? 'La maquina ya esta en llenado. Vamos a continuar.'
          : 'Enjuague confirmado. Vamos a iniciar llenado.'
      );
    } catch (err) {
      if (err?.code === 'MACHINE_BUSY') {
        setMachineBusyError(err);
        setRinseStatus('error');
        setRinseMessage('Esta maquina esta en uso por otro usuario.');
        throw err;
      }
      const message = err?.message || 'No se pudo activar el enjuague';
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
        showErrorToast('La maquina no esta conectada o no esta enviando trama.');
        return;
      }

      if (canAdvanceToFill) {
        nav('/water/position-up');
        return;
      }

      if (!canTriggerRinse) {
        showErrorToast(`Espera el paso 03 para activar enjuague. Paso actual: ${currentStageCode}.`);
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
        <h2 className="text-xl font-semibold text-text-primary">Preparar Garrafon</h2>
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

        <h3 className="mb-2 text-2xl font-bold text-text-primary">
          garrafon <span className="text-primary">boca abajo</span>
        </h3>
        <p className="mx-auto max-w-md text-text-secondary">
          Al tocar Enjuagar se prende el enjuague 3 segundos y luego se apaga automaticamente.
        </p>

        <div className={`mx-auto mt-6 max-w-lg rounded-xl border px-4 py-3 text-sm ${statusClasses}`}>
          <div className="flex items-center justify-center gap-2">
            <Icon name={statusIcon} size={18} className={rinseStatus === 'sending' ? 'animate-spin' : ''} />
            <span className="font-medium">{rinseMessage}</span>
          </div>
        </div>
      </div>

      <TelemetryStatusCard telemetry={displayTelemetry} title="Estado de la maquina" compact />

      {!telemetryFresh ? (
        <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm font-medium text-error">
          Maquina sin conexion o sin trama reciente. No se puede continuar el flujo.
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
          Reintentar enjuague
        </Button>
      ) : null}
    </div>
  );
}
