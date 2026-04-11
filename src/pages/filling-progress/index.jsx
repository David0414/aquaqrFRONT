import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProgressHeader from "./components/ProgressHeader";
import WaterAnimation from "./components/WaterAnimation";
import ProgressIndicator from "./components/ProgressIndicator";
import TransactionDetails from "./components/TransactionDetails";
import HelpModal from "./components/HelpModal";
import CancelConfirmationModal from "./components/CancelConfirmationModal";
import BottomTabNavigation from "../../components/ui/BottomTabNavigation";
import { showWarningToast } from "../../components/ui/NotificationToast";
import { useDispenseFlow } from "../water-dispensing-control/FlowProvider";
import TelemetryStatusCard from "../water-dispensing-control/components/TelemetryStatusCard";
import {
  DEFAULT_PULSES_PER_LITER,
  pulsesToLiters,
  sanitizePulsesPerLiter,
} from "../water-dispensing-control/telemetry";

function money(n) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

export default function FillingProgress() {
  const navigate = useNavigate();
  const location = useLocation();

  const flow = useDispenseFlow();
  const lastTx = flow?.lastTx;
  const telemetry = flow?.telemetry;
  const setTelemetryEnabled = flow?.setTelemetryEnabled;
  const currentPulsesPerLiter = flow?.pulsesPerLiter;

  const tx = location.state?.tx || lastTx;

  useEffect(() => {
    if (!tx) navigate("/water/choose", { replace: true });
  }, [tx, navigate]);

  if (!tx) return null;

  const liters = Number(tx.liters) || 0;
  const pricePerLiter = Number(tx.pricePerLiter) || 0;
  const totalCost = (tx.amountCents ?? Math.round(liters * pricePerLiter * 100)) / 100;
  const prevBalance = (tx.prevBalanceCents ?? 0) / 100;
  const newBalance = (tx.newBalanceCents ?? 0) / 100;
  const startPulseCount = Number.parseInt(tx.startPulseCount, 10) || 0;
  const pulsesPerLiter = sanitizePulsesPerLiter(
    tx.pulsesPerLiter ?? currentPulsesPerLiter,
    DEFAULT_PULSES_PER_LITER,
  );

  const [flowRate, setFlowRate] = useState(0);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDispensing, setIsDispensing] = useState(true);
  const [displayTelemetry, setDisplayTelemetry] = useState(telemetry || null);
  const lastTelemetrySampleRef = useRef(null);
  const completionScheduledRef = useRef(false);

  useEffect(() => {
    setTelemetryEnabled?.(true);
    return () => setTelemetryEnabled?.(false);
  }, [setTelemetryEnabled]);

  const currentPulseCount = Number.parseInt(telemetry?.flowmeterPulses, 10);
  const dispensedPulseCount = useMemo(() => {
    if (!Number.isFinite(currentPulseCount) || currentPulseCount < 0) return 0;
    if (currentPulseCount >= startPulseCount) return currentPulseCount - startPulseCount;
    return currentPulseCount;
  }, [currentPulseCount, startPulseCount]);

  const dispensedLiters = useMemo(
    () => Math.min(liters, pulsesToLiters(dispensedPulseCount, pulsesPerLiter)),
    [dispensedPulseCount, liters, pulsesPerLiter],
  );

  const progress = useMemo(() => {
    if (!liters) return 0;
    return Math.min(100, (dispensedLiters / liters) * 100);
  }, [dispensedLiters, liters]);

  useEffect(() => {
    if (!telemetry) return;

    const isDispensingTelemetry =
      telemetry.currentStageCode === "06"
      || telemetry.pumpOn
      || telemetry.fillValveOn
      || (Number.parseInt(telemetry.flowmeterPulses, 10) || 0) > startPulseCount;

    if (isDispensing || progress < 100 || isDispensingTelemetry) {
      setDisplayTelemetry(telemetry);
    }
  }, [isDispensing, progress, startPulseCount, telemetry]);

  const remainingTime = useMemo(() => {
    if (flowRate <= 0) return null;
    return Math.max(0, Math.ceil(((liters - dispensedLiters) / flowRate) * 60));
  }, [dispensedLiters, flowRate, liters]);

  useEffect(() => {
    if (!isDispensing) return;
    if (!Number.isFinite(currentPulseCount) || currentPulseCount < 0) return;

    const now = Date.now();
    const previous = lastTelemetrySampleRef.current;

    if (
      previous
      && currentPulseCount >= previous.pulseCount
      && now > previous.seenAt
    ) {
      const deltaPulses = currentPulseCount - previous.pulseCount;
      const deltaSeconds = (now - previous.seenAt) / 1000;
      if (deltaPulses > 0 && deltaSeconds > 0) {
        const deltaLiters = pulsesToLiters(deltaPulses, pulsesPerLiter);
        const nextFlowRate = (deltaLiters / deltaSeconds) * 60;
        setFlowRate(Number(nextFlowRate.toFixed(2)));
      }
    }

    lastTelemetrySampleRef.current = {
      pulseCount: currentPulseCount,
      seenAt: now,
    };
  }, [currentPulseCount, isDispensing, pulsesPerLiter]);

  useEffect(() => {
    if (progress < 100) return;
    if (completionScheduledRef.current) return;

    completionScheduledRef.current = true;
    setIsDispensing(false);
    const timeoutId = window.setTimeout(() => {
      navigate("/transaction-complete", {
        state: {
          tx,
          dispensedLiters,
          dispensedPulseCount,
          pulsesPerLiter,
        },
      });
    }, 700);

    return () => window.clearTimeout(timeoutId);
  }, [dispensedLiters, dispensedPulseCount, navigate, progress, pulsesPerLiter, tx]);

  const refundAmount = Number((totalCost * (1 - progress / 100)).toFixed(2));
  const machineConnectionStatus = displayTelemetry?.lastSeenAt
    ? (displayTelemetry.machineOnline ? "connected" : "disconnected")
    : "connecting";

  const handleCancelClick = useCallback(() => {
    if (progress > 0 && progress < 100) setIsCancelModalOpen(true);
    else navigate("/water/choose");
  }, [progress, navigate]);

  const handleConfirmCancel = useCallback(() => {
    setIsDispensing(false);
    showWarningToast(`Dispensado cancelado. Reembolso de ${money(refundAmount)} procesado.`);
    window.setTimeout(() => {
      navigate("/home-dashboard", {
        state: { refundAmount, cancelledAt: new Date().toISOString() },
      });
    }, 900);
  }, [refundAmount, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader
        machineId={tx.machineId}
        location={tx.location}
        connectionStatus={machineConnectionStatus}
        onCancel={handleCancelClick}
      />

      <div className="px-4 py-6 pb-20 space-y-8">
        <div className="text-center">
          <WaterAnimation isActive={isDispensing} />
        </div>

        <ProgressIndicator
          progress={progress}
          remainingTime={remainingTime}
          flowRate={flowRate}
          isActive={isDispensing}
          dispensedLiters={dispensedLiters}
          targetLiters={liters}
          dispensedPulseCount={dispensedPulseCount}
          pulsesPerLiter={pulsesPerLiter}
        />

        {displayTelemetry ? (
          <TelemetryStatusCard telemetry={displayTelemetry} title="Telemetria del dispensado" compact />
        ) : null}

        <TransactionDetails
          selectedLiters={liters}
          pricePerLiter={pricePerLiter}
          totalCost={totalCost}
          currentBalance={prevBalance}
          remainingBalance={newBalance}
        />

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Litros reales</p>
              <p className="mt-1 text-lg font-semibold text-text-primary">
                {dispensedLiters.toFixed(2)} / {liters.toFixed(2)} L
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Pulsos usados</p>
              <p className="mt-1 text-lg font-semibold text-text-primary">{dispensedPulseCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Calibracion</p>
              <p className="mt-1 text-lg font-semibold text-text-primary">{pulsesPerLiter} pulsos/L</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-muted rounded-full hover:bg-muted/80 transition-colors duration-200"
          >
            <span className="text-body-sm font-medium text-text-primary">¿Necesitas ayuda?</span>
          </button>
        </div>
      </div>

      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
      <CancelConfirmationModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleConfirmCancel}
        progress={progress}
        totalCost={totalCost}
        refundAmount={refundAmount}
      />
      <BottomTabNavigation isVisible={false} />
    </div>
  );
}
