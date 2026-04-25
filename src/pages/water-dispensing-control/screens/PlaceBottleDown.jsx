import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { showErrorToast } from '../../../components/ui/NotificationToast';
import { useDispenseFlow } from '../FlowProvider';
import TelemetryStatusCard from '../components/TelemetryStatusCard';

const RINSE_DURATION_MS = 3000;
const STAGE_WAIT_TIMEOUT_MS = 12000;
const STAGE_POLL_INTERVAL_MS = 800;

export default function PlaceBottleDown() {
  const nav = useNavigate();
  const { machine, telemetry, setTelemetryEnabled, sendStageCommand, pollInputs } = useDispenseFlow();
  const [rinseStatus, setRinseStatus] = useState('idle');
  const [rinseMessage, setRinseMessage] = useState('El enjuague se habilita cuando el paso sea 03.');
  const [isAdvancing, setIsAdvancing] = useState(false);

  React.useEffect(() => {
    setTelemetryEnabled(true);
    return () => setTelemetryEnabled(false);
  }, [setTelemetryEnabled]);

  const currentStageCode = telemetry.currentStageCode || '00';
  const canTriggerRinse = currentStageCode === '03';
  const canAdvanceToFill = currentStageCode === '05' || currentStageCode === '06';
  const canUseNext = canTriggerRinse || canAdvanceToFill;
  const nextButtonLabel = canAdvanceToFill ? 'Ir a llenado' : 'Enjuagar';

  const delay = (ms) => new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });

  const waitForFillReadyStage = async () => {
    const startedAt = Date.now();
    let latestStageCode = telemetry.currentStageCode || '00';

    while (Date.now() - startedAt < STAGE_WAIT_TIMEOUT_MS) {
      await delay(STAGE_POLL_INTERVAL_MS);
      const nextTelemetry = await pollInputs({ force: true }).catch(() => null);

      latestStageCode = nextTelemetry?.currentStageCode || latestStageCode;
      if (latestStageCode === '05' || latestStageCode === '06') {
        return latestStageCode;
      }
    }

    throw new Error(`La maquina no paso a llenado. Paso actual: ${latestStageCode}.`);
  };

  const triggerRinse = async () => {
    try {
      setRinseStatus('sending');
      setRinseMessage('Activando enjuague por 3 segundos...');
      await sendStageCommand('enjuague');
      await pollInputs({ force: true }).catch(() => {});
      setRinseMessage('Enjuagando...');
      await delay(RINSE_DURATION_MS);
      await pollInputs({ force: true }).catch(() => {});
      setRinseStatus('success');
      setRinseMessage('Esperando que la maquina habilite el llenado...');
      const readyStage = await waitForFillReadyStage();
      setRinseMessage(
        readyStage === '06'
          ? 'La maquina ya esta en llenado. Vamos a continuar.'
          : 'Enjuague completado. Ya puedes iniciar dispensado.'
      );
    } catch (err) {
      const message = err?.message || 'No se pudo activar el enjuague';
      setRinseStatus('error');
      setRinseMessage(message);
      showErrorToast(message);
      throw err;
    }
  };

  const handleNext = async () => {
    try {
      setIsAdvancing(true);

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
      showErrorToast(err?.message || 'No se pudo reenviar el enjuague');
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

      <TelemetryStatusCard telemetry={telemetry} title="Estado de la maquina" compact />

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => nav('/water/choose')}>
          <Icon name="ArrowLeft" size={18} /> Atras
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
