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

const TELEMETRY_FRESH_MS = 20000;

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
  const [rinseChoiceOpen, setRinseChoiceOpen] = useState(false);

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
    && Date.now() - displayTelemetry.lastSeenAt < TELEMETRY_FRESH_MS
  );
  const canStartFlow = currentStageCode === '00';
  const canChooseBottle = currentStageCode === '01' || currentStageCode === '02';
  const canGoToRinse = currentStageCode === '03' || currentStageCode === '04';
  const canUsePrimaryAction = telemetryFresh && (canStartFlow || canChooseBottle || canGoToRinse);
  const nextRouteState = {
    machineId: machine.id,
    machineLocation: machine.location,
    hardwareId: machine.hardwareId,
    selectedLiters,
    fromQR: true,
  };

  const continueAfterBottleSelection = () => {
    setRinseChoiceOpen(true);
  };

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
        showErrorToast('Maquina sin conexion.');
        return;
      }

      if (canStartFlow) {
        if (hasPendingQrStart) {
          const nextTelemetry = await pollInputs({ force: true }).catch(() => null);
          const nextStageCode = nextTelemetry?.currentStageCode || currentStageCode;
          if (nextStageCode === '01' || nextStageCode === '02') {
            showSuccessToast('Inicio confirmado.');
            return;
          }
          if (nextStageCode === '03' || nextStageCode === '04') {
            nav('/water/position-down', { state: nextRouteState });
            return;
          }
          if (nextStageCode === '05' || nextStageCode === '06') {
            nav('/water/position-up', { state: nextRouteState });
            return;
          }
          showInfoToast('Inicio pendiente.');
          return;
        }
        await sendStageCommand('qr_inicio');
        await pollInputs({ force: true }).catch(() => {});
        showSuccessToast('Inicio enviado.');
        return;
      }

      if (canGoToRinse) {
        continueAfterBottleSelection();
        return;
      }

      if (!canChooseBottle) {
        showErrorToast(`Paso ${currentStageCode} no valido.`);
        return;
      }

      const action = litersActionMap[selectedLiters];
      if (action) {
        await sendStageCommand(action);
      }
      await pollInputs({ force: true }).catch(() => {});
      continueAfterBottleSelection();
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
      {!telemetryFresh ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[2px]">
          <div className="w-full max-w-lg rounded-[2rem] border border-amber-200 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Icon name="AlertTriangle" size={28} />
            </div>
            <div className="mt-5 text-center">
              <h2 className="text-2xl font-black text-slate-900">Maquina sin conexion</h2>
            </div>
            <div className="mt-6">
              <Button
                variant="default"
                size="lg"
                fullWidth
                onClick={() => nav('/home-dashboard')}
              >
                Volver a home
              </Button>
            </div>
          </div>
        </div>
      ) : null}

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

      <TelemetryStatusCard telemetry={displayTelemetry} title="Estado" compact />

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

      {rinseChoiceOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-sky-200 bg-white p-5 shadow-[0_28px_70px_rgba(15,23,42,0.22)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 text-primary">
              <Icon name="Waves" size={26} />
            </div>
            <div className="mt-4 text-center">
              <h2 className="text-xl font-black text-text-primary">Quieres enjuagar?</h2>
              <p className="mt-2 text-sm text-text-secondary">
                Puedes enjuagar antes de llenar o continuar directo al dispensado.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Button
                variant="outline"
                onClick={() => {
                  setRinseChoiceOpen(false);
                  nav('/water/position-up', { state: nextRouteState });
                }}
              >
                No
              </Button>
              <Button
                onClick={() => {
                  setRinseChoiceOpen(false);
                  nav('/water/position-down', { state: nextRouteState });
                }}
              >
                Si
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
