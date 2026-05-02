import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import MachineInfoCard from '../components/MachineInfoCard';
import BottleSizeSelector from '../components/BottleSizeSelector';
import PricingCalculator from '../components/PricingCalculator';
import TelemetryStatusCard from '../components/TelemetryStatusCard';
import MachineBusyAlert from '../components/MachineBusyAlert';
import { showErrorToast, showInfoToast, showSuccessToast } from '../../../components/ui/NotificationToast';
import { useDispenseFlow } from '../FlowProvider';
import { useWaterFlowNavigation } from '../WaterFlowLayout';

export default function SelectAmount() {
  const nav = useNavigate();
  const { requestNavigation, shouldGuardExit } = useWaterFlowNavigation();
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
    hasPendingQrStart,
    telemetry,
    guidedTelemetry,
    setTelemetryEnabled,
    sendStageCommand,
    pollInputs,
  } = useDispenseFlow();
  const [continuing, setContinuing] = useState(false);
  const [machineBusyError, setMachineBusyError] = useState(null);

  useEffect(() => {
    fetchConfig();
    fetchWallet();
    setTelemetryEnabled(true);
    return () => setTelemetryEnabled(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const displayTelemetry = guidedTelemetry || telemetry;
  const currentStageCode = displayTelemetry.currentStageCode || '00';
  const telemetryFresh = Boolean(
    displayTelemetry.machineOnline
    && displayTelemetry.lastSeenAt
    && Date.now() - displayTelemetry.lastSeenAt < 8000
  );
  const canStartFlow = currentStageCode === '00';
  const canChooseBottle = currentStageCode === '01' || currentStageCode === '02';
  const canGoToRinse = currentStageCode === '03' || currentStageCode === '04';
  const canUsePrimaryAction = telemetryFresh && (canStartFlow || canChooseBottle || canGoToRinse);

  const handlePrimaryAction = async () => {
    const litersActionMap = {
      5: 'litros_5',
      10: 'litros_10',
      20: 'litros_20',
    };

    try {
      setContinuing(true);
      setMachineBusyError(null);

      if (!telemetryFresh) {
        showErrorToast('La maquina no esta conectada o no esta enviando trama.');
        return;
      }

      if (canStartFlow) {
        if (hasPendingQrStart) {
          const nextTelemetry = await pollInputs({ force: true }).catch(() => null);
          const nextStageCode = nextTelemetry?.currentStageCode || currentStageCode;
          if (nextStageCode === '01' || nextStageCode === '02') {
            showSuccessToast('La maquina confirmo el inicio. Ya puedes elegir botella.');
            return;
          }
          if (nextStageCode === '03' || nextStageCode === '04') {
            nav('/water/position-down');
            return;
          }
          if (nextStageCode === '05' || nextStageCode === '06') {
            nav('/water/position-up');
            return;
          }
          showInfoToast('El QR ya activo el flujo. Espera a que la maquina confirme el paso 01 o 02.');
          return;
        }
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
      if (err?.code === 'MACHINE_BUSY') {
        setMachineBusyError(err);
        return;
      }
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
  const hasStartedFlow = Boolean(shouldGuardExit);

  const handleCancel = () => {
    const targetPath = '/home-dashboard';
    if (requestNavigation(targetPath)) nav(targetPath);
  };

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
        pricePerLiter={pricePerLiter}
      />

      <PricingCalculator
        selectedLiters={selectedLiters}
        pricePerLiter={pricePerLiter}
        currentBalance={(balanceCents ?? 0) / 100}
      />

      <TelemetryStatusCard telemetry={displayTelemetry} title="Estado de la maquina" compact />

      {!telemetryFresh ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Icon name="AlertTriangle" size={18} />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-900">No pudimos conectar con la maquina</p>
                <p className="mt-1 text-sm text-slate-600">
                  La maquina no tiene conexion o no envio una trama reciente. Vuelve al inicio para intentarlo otra vez.
                </p>
              </div>
            </div>
            <Button
              variant="default"
              onClick={() => nav('/home-dashboard')}
              className="w-full sm:w-auto"
            >
              Volver a home
            </Button>
          </div>
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
          onClick={handleCancel}
        >
          <Icon name={hasStartedFlow ? 'RotateCcw' : 'X'} size={18} />
          {hasStartedFlow ? 'Cancelar llenado' : 'Cancelar'}
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
