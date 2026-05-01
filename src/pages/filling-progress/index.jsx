import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
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

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = "aquaqr-api";

function money(n) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(n);
}

const PULSE_COMPLETION_PROGRESS = 99;
const RESET_COMPLETION_PROGRESS = 99.5;

export default function FillingProgress() {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();

  const flow = useDispenseFlow();
  const lastTx = flow?.lastTx;
  const telemetry = flow?.telemetry;
  const setTelemetryEnabled = flow?.setTelemetryEnabled;
  const currentPulsesPerLiter = flow?.pulsesPerLiter;
  const completeDispense = flow?.completeDispense;
  const cancelActiveSession = flow?.cancelActiveSession;
  const [recoveredTx, setRecoveredTx] = useState(null);
  const [isRecoveringTx, setIsRecoveringTx] = useState(true);
  const routeTx = location.state?.tx || null;

  const tx = lastTx || recoveredTx;

  useEffect(() => {
    setRecoveredTx(null);
    setIsRecoveringTx(true);
  }, [userId]);

  useEffect(() => {
    if (tx) {
      setIsRecoveringTx(false);
      return;
    }

    if (!isLoaded) return;

    if (!isSignedIn) {
      setIsRecoveringTx(false);
      return;
    }

    let cancelled = false;

    const recoverActiveDispense = async () => {
      try {
        const token = await getToken({ template: CLERK_JWT_TEMPLATE });
        const res = await fetch(`${API}/api/dispense/active`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => null);
        if (cancelled) return;

        if (res.ok && data?.active && data?.tx && (data.nextPath === "/filling-progress" || data.stageCode === "06" || data.stageCode === "07")) {
          if (routeTx?.txId && data.tx?.txId && routeTx.txId !== data.tx.txId) {
            setIsRecoveringTx(false);
            return;
          }
          setRecoveredTx({
            ...data.tx,
            machineId: data.tx.machineId || data.machineId,
            location: data.tx.location || data.machineLocation,
            pulsesPerLiter: data.tx.pulsesPerLiter || currentPulsesPerLiter || DEFAULT_PULSES_PER_LITER,
          });
          setIsRecoveringTx(false);
          return;
        }

        setIsRecoveringTx(false);
      } catch {
        if (!cancelled) setIsRecoveringTx(false);
      }
    };

    recoverActiveDispense();

    return () => {
      cancelled = true;
    };
  }, [currentPulsesPerLiter, getToken, isLoaded, isSignedIn, routeTx?.txId, tx]);

  useEffect(() => {
    if (tx || isRecoveringTx) return;
    navigate("/water/choose", { replace: true });
  }, [isRecoveringTx, tx, navigate]);

  if (!tx) return null;

  return <FillingProgressView tx={tx} />;
}

function FillingProgressView({ tx }) {
  const navigate = useNavigate();
  const flow = useDispenseFlow();
  const telemetry = flow?.telemetry;
  const setTelemetryEnabled = flow?.setTelemetryEnabled;
  const currentPulsesPerLiter = flow?.pulsesPerLiter;
  const completeDispense = flow?.completeDispense;
  const cancelActiveSession = flow?.cancelActiveSession;

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
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDispensing, setIsDispensing] = useState(true);
  const [completionStatus, setCompletionStatus] = useState("");
  const [displayTelemetry, setDisplayTelemetry] = useState(telemetry || null);
  const [progressSnapshot, setProgressSnapshot] = useState({
    progress: 0,
    dispensedLiters: 0,
    dispensedPulseCount: 0,
  });
  const lastTelemetrySampleRef = useRef(null);
  const completionScheduledRef = useRef(false);
  const mountedRef = useRef(false);
  const completionSnapshotRef = useRef({
    sawFilling: false,
    sawComplete: false,
    progress: 0,
    dispensedLiters: 0,
    dispensedPulseCount: 0,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
    const reachedTargetPulses =
      targetPulseCount > 0 && dispensedPulseCount >= targetPulseCount;
    const isFillingTelemetry =
      currentStageCode === "06"
      || telemetry?.pumpOn
      || telemetry?.fillValveOn
      || progress > 0
      || dispensedPulseCount > 0
      || reachedTargetPulses;

    if (isFillingTelemetry) {
      snapshot.sawFilling = true;
    }

    if (isTelemetryComplete || reachedTargetPulses) {
      snapshot.sawComplete = true;
      snapshot.sawFilling = true;
    }

    const nextProgress = (isTelemetryComplete || reachedTargetPulses)
      ? 100
      : Math.max(snapshot.progress, progress);
    const nextDispensedLiters = (isTelemetryComplete || reachedTargetPulses)
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
    targetPulseCount,
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
    const liveProgress = Math.max(snapshot.progress, progress);
    const liveDispensedPulseCount = Math.max(snapshot.dispensedPulseCount, dispensedPulseCount);
    const hasTargetPulseCount = targetPulseCount > 0;
    const sawFilling =
      snapshot.sawFilling
      || currentStageCode === "06"
      || liveProgress > 0
      || liveDispensedPulseCount > 0;
    const reachedTargetPulses =
      hasTargetPulseCount && liveDispensedPulseCount >= targetPulseCount;
    const completedByResetToIdle =
      currentStageCode === "00"
      && sawFilling
      && (liveProgress >= RESET_COMPLETION_PROGRESS || reachedTargetPulses);
    const completedByPulses =
      sawFilling
      && (liveProgress >= PULSE_COMPLETION_PROGRESS || reachedTargetPulses);
    const completedByStage = isTelemetryComplete || snapshot.sawComplete;

    if (!completedByStage && !completedByResetToIdle && !completedByPulses) return;
    if (completionScheduledRef.current) return;
    if (typeof completeDispense !== "function") return;

    completionScheduledRef.current = true;
    setIsDispensing(false);
    setCompletionStatus("Generando ticket...");
    const finalDispensedLiters = Math.max(snapshot.dispensedLiters, dispensedLiters, liters);
    const finalDispensedPulseCount = Math.max(liveDispensedPulseCount, targetPulseCount);

    const finishAndCharge = async () => {
      try {
        const completedTx = await completeDispense(tx, {
          dispensedLiters: finalDispensedLiters,
          dispensedPulseCount: finalDispensedPulseCount,
          pulsesPerLiter,
        });
        if (!mountedRef.current) return;

        navigate("/transaction-complete", {
          state: {
            tx: completedTx,
            dispensedLiters: finalDispensedLiters,
            dispensedPulseCount: finalDispensedPulseCount,
            pulsesPerLiter,
          },
        });
      } catch (error) {
        if (!mountedRef.current) return;
        completionScheduledRef.current = false;
        setCompletionStatus("");

        if (error?.code === "INSUFFICIENT_FUNDS") {
          navigate("/balance-recharge", {
            state: {
              returnTo: "/transaction-complete",
              requiredAmount: error.requiredAmount,
              tx,
              dispensedLiters: finalDispensedLiters,
              dispensedPulseCount: finalDispensedPulseCount,
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
  }, [completeDispense, currentStageCode, dispensedLiters, dispensedPulseCount, isTelemetryComplete, liters, navigate, progress, pulsesPerLiter, targetPulseCount, tx]);

  const displayProgress = Math.max(progress, progressSnapshot.progress);
  const displayDispensedLiters = Math.max(dispensedLiters, progressSnapshot.dispensedLiters);
  const displayDispensedPulseCount = Math.max(dispensedPulseCount, progressSnapshot.dispensedPulseCount);
  const refundAmount = Number((totalCost * (1 - displayProgress / 100)).toFixed(2));
  const machineConnectionStatus = displayTelemetry?.lastSeenAt
    ? (displayTelemetry.machineOnline ? "connected" : "disconnected")
    : "connecting";

  const handleCancelClick = useCallback(() => {
    if (completionScheduledRef.current || displayProgress >= 100) return;
    setIsCancelModalOpen(true);
  }, [displayProgress]);

  const handleConfirmCancel = useCallback(async () => {
    if (completionScheduledRef.current || isCancelling) return;

    try {
      setIsCancelling(true);
      const data = await cancelActiveSession?.();
      setIsDispensing(false);
      setIsCancelModalOpen(false);

      const refunded = Number(data?.refundedCents || 0) / 100;
      showWarningToast(
        refunded > 0
          ? `Dispensado cancelado. Reembolso de ${money(refunded)} procesado.`
          : "Dispensado cancelado. Se envio reinicio a la maquina."
      );

      navigate("/home-dashboard", {
        replace: true,
        state: {
          machineReleased: true,
          reason: "user_cancelled",
          cancelledAt: new Date().toISOString(),
          refundAmount: refunded || refundAmount,
        },
      });
    } catch (error) {
      showErrorToast(error?.message || "No se pudo cancelar el dispensado");
      setIsCancelling(false);
    }
  }, [cancelActiveSession, isCancelling, navigate, refundAmount]);

  useEffect(() => {
    if (!isDispensing || completionScheduledRef.current) return undefined;

    const handlePopState = () => {
      window.history.pushState({ agua24FillingGuard: true }, "", window.location.href);
      setIsCancelModalOpen(true);
    };

    window.history.pushState({ agua24FillingGuard: true }, "", window.location.href);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDispensing]);

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

        {completionStatus ? (
          <div className="rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-center text-sm font-medium text-success">
            {completionStatus}
          </div>
        ) : null}

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
        onClose={() => {
          if (!isCancelling) setIsCancelModalOpen(false);
        }}
        onConfirm={handleConfirmCancel}
        confirmLoading={isCancelling}
        progress={displayProgress}
        totalCost={totalCost}
        refundAmount={refundAmount}
      />
      <BottomTabNavigation isVisible={false} />
    </div>
  );
}
