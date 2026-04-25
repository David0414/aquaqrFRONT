// src/pages/water-dispensing-control/screens/PlaceBottleUp.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { showErrorToast, showSuccessToast } from '../../../components/ui/NotificationToast';
import { useDispenseFlow } from '../FlowProvider';
import TelemetryStatusCard from '../components/TelemetryStatusCard';

export default function PlaceBottleUp() {
  const navigate = useNavigate();
  const { startDispense, selectedLiters, telemetry, setTelemetryEnabled, pollInputs } = useDispenseFlow();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setTelemetryEnabled(true);
    pollInputs({ force: true }).catch(() => {});
    return () => setTelemetryEnabled(false);
  }, [pollInputs, setTelemetryEnabled]);

  const currentStageCode = telemetry.currentStageCode || '00';
  const canStartFilling = currentStageCode === '05' || currentStageCode === '03' || currentStageCode === '04';
  const fillHint =
    currentStageCode === '05'
      ? 'La maquina ya habilito el llenado.'
      : currentStageCode === '03' || currentStageCode === '04'
        ? 'La maquina puede estar reproduciendo indicaciones. Puedes iniciar llenado cuando terminen.'
        : `Espera el paso 05 para iniciar llenado. Paso actual: ${currentStageCode}.`;

  const handleStart = async () => {
    try {
      if (!canStartFilling) {
        showErrorToast(`Espera el paso 05 para iniciar llenado. Paso actual: ${currentStageCode}.`);
        return;
      }

      setLoading(true);
      const tx = await startDispense(); // arranca llenado; el cobro se hace al finalizar
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
      } else {
        showErrorToast(err?.message || 'Error al iniciar el dispensado');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-text-primary">Acomodar GarrafÃƒÂ³n</h2>

      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-32 h-32 rounded-2xl bg-success/10 flex items-center justify-center mb-6"
        >
          <Icon name="Target" size={44} className="text-success" />
        </motion.div>
        <h3 className="text-2xl font-bold text-text-primary mb-2">
          ColÃƒÂ³calo <span className="text-success">boca arriba y centrado</span>
        </h3>
        <p className="text-text-secondary max-w-md">
          AsegÃƒÂºrate de que el cuello quede firme en el centro para evitar derrames.
        </p>
      </div>

      <TelemetryStatusCard telemetry={telemetry} title="Estado de la maquina" compact />

      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-text-secondary">
        {fillHint}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => navigate('/water/position-down')}>
          <Icon name="ArrowLeft" size={18} /> AtrÃƒÂ¡s
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
