import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import MachineInfoCard from '../components/MachineInfoCard';
import BottleSizeSelector from '../components/BottleSizeSelector';
import PricingCalculator from '../components/PricingCalculator';
import TelemetryStatusCard from '../components/TelemetryStatusCard';
import { showErrorToast, showSuccessToast } from '../../../components/ui/NotificationToast';
import { useDispenseFlow } from '../FlowProvider';

export default function SelectAmount() {
  const nav = useNavigate();
  const {
    machine,
    connectionStatus,
    allowedLiters,
    selectedLiters,
    setSelectedLiters,
    pricePerLiter,
    pricePerLiterCents,
    fetchConfig,
    fetchWallet,
    balanceCents,
    telemetry,
    setTelemetryEnabled,
    sendStageCommand,
    pollInputs,
  } = useDispenseFlow();
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchWallet();
    setTelemetryEnabled(true);
    return () => setTelemetryEnabled(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentStageCode = telemetry.currentStageCode || '00';
  const canStartFlow = currentStageCode === '00';
  const canChooseBottle = currentStageCode === '01' || currentStageCode === '02';
  const canGoToRinse = currentStageCode === '03' || currentStageCode === '04';
  const canUsePrimaryAction = canStartFlow || canChooseBottle || canGoToRinse;

  const handlePrimaryAction = async () => {
    const litersActionMap = {
      5: 'litros_5',
      10: 'litros_10',
      20: 'litros_20',
    };

    try {
      setContinuing(true);

      if (canStartFlow) {
        await sendStageCommand('qr_inicio');
        await pollInputs({ force: true }).catch(() => {});
        showSuccessToast('Inicio enviado. Espera el paso 01 o 02 para elegir botella.');
        return;
      }

      if (canGoToRinse) {
        nav('/water/position-down');
        return;
      }

      if (!canChooseBottle) {
        showErrorToast(`No puedes avanzar desde el paso ${currentStageCode}.`);
        return;
      }

      const action = litersActionMap[selectedLiters];
      if (action) {
        await sendStageCommand(action);
      }
      await pollInputs({ force: true }).catch(() => {});
      nav('/water/position-down');
    } catch (err) {
      showErrorToast(err?.message || 'No se pudo avanzar al siguiente paso');
    } finally {
      setContinuing(false);
    }
  };

  const primaryActionLabel = canStartFlow
    ? 'Iniciar dispensado'
    : canGoToRinse
      ? 'Ir a enjuague'
      : 'Continuar';

  return (
    <div className="space-y-6">
      <MachineInfoCard
        machineId={machine.id}
        location={machine.location}
        connectionStatus={connectionStatus}
        pricePerGarrafon={(pricePerLiterCents * 20) / 100}
        garrafonLiters={20}
      />

      <BottleSizeSelector
        allowedLiters={allowedLiters}
        selectedLiters={selectedLiters}
        onChange={setSelectedLiters}
        garrafonLiters={20}
      />

      <PricingCalculator
        selectedLiters={selectedLiters}
        pricePerLiter={pricePerLiter}
        currentBalance={(balanceCents ?? 0) / 100}
      />

      <TelemetryStatusCard telemetry={telemetry} title="Estado de la maquina" compact />

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => nav('/home-dashboard')}>
          <Icon name="X" size={18} /> Cancelar
        </Button>
        <Button
          className="flex-1"
          onClick={handlePrimaryAction}
          loading={continuing}
          disabled={!canUsePrimaryAction || continuing}
        >
          {primaryActionLabel} <Icon name="ArrowRight" size={18} />
        </Button>
      </div>
    </div>
  );
}
