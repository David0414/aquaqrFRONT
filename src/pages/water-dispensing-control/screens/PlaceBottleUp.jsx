// src/pages/water-dispensing-control/screens/PlaceBottleUp.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { showErrorToast, showInfoToast, showSuccessToast } from '../../../components/ui/NotificationToast';
import { useDispenseFlow } from '../FlowProvider';
import { useWaterFlowNavigation } from '../WaterFlowLayout';
import TelemetryStatusCard from '../components/TelemetryStatusCard';
import MachineBusyAlert from '../components/MachineBusyAlert';

export default function PlaceBottleUp() {
  const navigate = useNavigate();
  const { requestNavigation, shouldGuardExit } = useWaterFlowNavigation();
  const { startDispense, selectedLiters, telemetry, guidedTelemetry, setTelemetryEnabled, pollInputs } = useDispenseFlow();
  const [loading, setLoading] = useState(false);
  const [machineBusyError, setMachineBusyError] = useState(null);

  React.useEffect(() => {
    setTelemetryEnabled(true);
    pollInputs({ force: true }).catch(() => {});
    return () => setTelemetryEnabled(false);
  }, [pollInputs, setTelemetryEnabled]);

  const displayTelemetry = guidedTelemetry || telemetry;
  const currentStageCode = displayTelemetry.currentStageCode || '00';
  const canStartFilling = currentStageCode === '05' || currentStageCode === '03' || currentStageCode === '04';
  const hasStartedFlow = Boolean(shouldGuardExit);
  const fillHint =
    currentStageCode === '05'
      ? 'La maquina ya habilito el llenado.'
      : currentStageCode === '03' || currentStageCode === '04'
        ? 'La maquina puede estar reproduciendo indicaciones. Puedes iniciar llenado cuando terminen.'
        : `Espera el paso 05 para iniciar llenado. Paso actual: ${currentStageCode}.`;

  React.useEffect(() => {
    if (currentStageCode !== '00') return;

    showInfoToast('La maquina regreso a espera. Reinicia el flujo cuando estes listo.');
    navigate('/home-dashboard', {
      replace: true,
      state: {
        machineReleased: true,
        reason: 'idle',
      },
    });
  }, [currentStageCode, navigate]);

  const handleStart = async () => {
    try {
      setMachineBusyError(null);
      if (!canStartFilling) {
        showErrorToast(`Espera el paso 05 para iniciar llenado. Paso actual: ${currentStageCode}.`);
        return;
      }

      setLoading(true);
      const tx = await startDispense();
      await pollInputs({ force: true }).catch(() => {});
      showSuccessToast('Dispensado iniciado');
      navigate('/filling-progress', { state: { tx } });
    } catch (err) {
      if (err?.code === 'INSUFFICIENT_FUNDS') {
        navigate('/balance-recharge', {
          state: {
            returnTo: '/water/position-up',
            requiredAmount: err.requiredAmount,
            selectedLiters,
            fromInsufficientBalance: true,
          },
        });
      } else if (err?.code === 'MACHINE_BUSY') {
        setMachineBusyError(err);
      } else {
        showErrorToast(err?.message || 'Error al iniciar el dispensado');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackOrCancel = () => {
    const targetPath = hasStartedFlow ? '/home-dashboard' : '/water/position-down';
    if (requestNavigation(targetPath)) navigate(targetPath);
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-text-primary">Acomodar Garrafon</h2>

      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-32 h-32 rounded-2xl bg-success/10 flex items-center justify-center mb-6"
        >
          <Icon name="Target" size={44} className="text-success" />
        </motion.div>
        <h3 className="text-2xl font-bold text-text-primary mb-2">
          Colocalo <span className="text-success">boca arriba y centrado</span>
        </h3>
        <p className="text-text-secondary max-w-md">
          Asegurate de que el cuello quede firme en el centro para evitar derrames.
        </p>
      </div>

      <TelemetryStatusCard telemetry={displayTelemetry} title="Estado de la maquina" compact />

      <MachineBusyAlert
        error={machineBusyError}
        onBackHome={handleBackOrCancel}
      />

      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-text-secondary">
        {fillHint}
      </div>

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
          onClick={handleStart}
          loading={loading}
          disabled={!canStartFilling || loading}
        >
          <Icon name="Play" size={18} /> Iniciar dispensado
        </Button>
      </div>
    </div>
  );
}
