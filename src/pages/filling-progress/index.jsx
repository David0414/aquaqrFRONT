import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProgressHeader from "./components/ProgressHeader";
import WaterAnimation from "./components/WaterAnimation";
import ProgressIndicator from "./components/ProgressIndicator";
import TransactionDetails from "./components/TransactionDetails";
import HelpModal from "./components/HelpModal";
import CancelConfirmationModal from "./components/CancelConfirmationModal";
import BottomTabNavigation from "../../components/ui/BottomTabNavigation";
import { showErrorToast, showWarningToast } from "../../components/ui/NotificationToast";
import { useDispenseFlow } from "../water-dispensing-control/FlowProvider";
import TelemetryStatusCard from "../water-dispensing-control/components/TelemetryStatusCard";
import {
  DEFAULT_PULSES_PER_LITER,
  getTargetPulseCount,
  pulsesToLiters,
  pulsesToProgress,
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
  const completeDispense = flow?.completeDispense;

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
  const targetPulseCount = getTargetPulseCount(liters, pulsesPerLiter);

  const [flowRate, setFlowRate] = useState(0);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDispensing, setIsDispensing] = useState(true);
  const [displayTelemetry, setDisplayTelemetry] = useState(telemetry || null);
  const [progressSnapshot, setProgressSnapshot] = useState({
    progress: 0,
    dispensedLiters: 0,
    dispensedPulseCount: 0,
  });
  const lastTelemetrySampleRef = useRef(null);
  const completionScheduledRef = useRef(false);
  const completionSnapshotRef = useRef({
    sawFilling: false,
    sawComplete: false,
    progress: 0,
    dispensedLiters: 0,
    dispensedPulseCount: 0,
  });

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
    return pulsesToProgress(dispensedPulseCount, targetPulseCount);
  }, [dispensedPulseCount, targetPulseCount]);
  const currentStageCode = telemetry?.currentStageCode || "";
  const isTelemetryComplete = currentStageCode === "07";

  useEffect(() => {
    const snapshot = completionSnapshotRef.current;
    const isFillingTelemetry =
      currentStageCode === "06"
      || telemetry?.pumpOn
      || telemetry?.fillValveOn
      || progress > 0
      || dispensedPulseCount > 0;

    if (isFillingTelemetry) {
      snapshot.sawFilling = true;
    }

    if (isTelemetryComplete) {
      snapshot.sawComplete = true;
      snapshot.sawFilling = true;
    }

    const nextProgress = isTelemetryComplete ? 100 : Math.max(snapshot.progress, progress);
    const nextDispensedLiters = isTelemetryComplete
      ? Math.max(snapshot.dispensedLiters, dispensedLiters, liters)
      : Math.max(snapshot.dispensedLiters, dispensedLiters);
    const nextDispensedPulseCount = Math.max(snapshot.dispensedPulseCount, dispensedPulseCount);

    if (
      nextProgress !== snapshot.progress
      || nextDispensedLiters !== snapshot.dispensedLiters
      || nextDispensedPulseCount !== snapshot.dispensedPulseCount
    ) {
      snapshot.progress = nextProgress;
      snapshot.dispensedLiters = nextDispensedLiters;
      snapshot.dispensedPulseCount = nextDispensedPulseCount;
      setProgressSnapshot({
        progress: nextProgress,
        dispensedLiters: nextDispensedLiters,
        dispensedPulseCount: nextDispensedPulseCount,
      });
    }
  }, [
    currentStageCode,
    dispensedLiters,
    dispensedPulseCount,
    isTelemetryComplete,
    liters,
    progress,
    telemetry?.fillValveOn,
    telemetry?.pumpOn,
  ]);

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
    const snapshot = completionSnapshotRef.current;
    const completedByResetToIdle =
      currentStageCode === "00"
      && snapshot.sawFilling
      && snapshot.progress >= 99.5;

    if (!isTelemetryComplete && !completedByResetToIdle) return;
    if (completionScheduledRef.current) return;

    completionScheduledRef.current = true;
    setIsDispensing(false);

    let cancelled = false;
    const finishAndCharge = async () => {
      try {
        const completedTx = await completeDispense(tx, {
          dispensedLiters: snapshot.dispensedLiters || dispensedLiters,
          dispensedPulseCount: snapshot.dispensedPulseCount || dispensedPulseCount,
          pulsesPerLiter,
        });
        if (cancelled) return;

        navigate("/transaction-complete", {
          state: {
            tx: completedTx,
            dispensedLiters: snapshot.dispensedLiters || dispensedLiters,
            dispensedPulseCount: snapshot.dispensedPulseCount || dispensedPulseCount,
            pulsesPerLiter,
          },
        });
      } catch (error) {
        completionScheduledRef.current = false;
        if (cancelled) return;

        if (error?.code === "INSUFFICIENT_FUNDS") {
          navigate("/balance-recharge", {
            state: {
              returnTo: "/transaction-complete",
              requiredAmount: error.requiredAmount,
              tx,
              dispensedLiters: snapshot.dispensedLiters || dispensedLiters,
              dispensedPulseCount: snapshot.dispensedPulseCount || dispensedPulseCount,
              pulsesPerLiter,
              fromInsufficientBalance: true,
            },
          });
          return;
        }

        showErrorToast(error?.message || "No se pudo cobrar el dispensado finalizado");
      }
    };

    finishAndCharge();

    return () => {
      cancelled = true;
    };
  }, [completeDispense, currentStageCode, dispensedLiters, dispensedPulseCount, isTelemetryComplete, navigate, pulsesPerLiter, tx]);

  const displayProgress = Math.max(progress, progressSnapshot.progress);
  const displayDispensedLiters = Math.max(dispensedLiters, progressSnapshot.dispensedLiters);
  const displayDispensedPulseCount = Math.max(dispensedPulseCount, progressSnapshot.dispensedPulseCount);
  const refundAmount = Number((totalCost * (1 - displayProgress / 100)).toFixed(2));
  const machineConnectionStatus = displayTelemetry?.lastSeenAt
    ? (displayTelemetry.machineOnline ? "connected" : "disconnected")
    : "connecting";

  const handleCancelClick = useCallback(() => {
    if (displayProgress > 0 && displayProgress < 100) setIsCancelModalOpen(true);
    else navigate("/water/choose");
  }, [displayProgress, navigate]);

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
          progress={displayProgress}
          remainingTime={remainingTime}
          flowRate={flowRate}
          isActive={isDispensing}
          dispensedLiters={displayDispensedLiters}
          targetLiters={liters}
          dispensedPulseCount={displayDispensedPulseCount}
          targetPulseCount={targetPulseCount}
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
                {displayDispensedLiters.toFixed(2)} / {liters.toFixed(2)} L
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Pulsos usados</p>
              <p className="mt-1 text-lg font-semibold text-text-primary">
                {displayDispensedPulseCount} / {targetPulseCount}
              </p>
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
        progress={displayProgress}
        totalCost={totalCost}
        refundAmount={refundAmount}
      />
      <BottomTabNavigation isVisible={false} />
    </div>
  );
}
