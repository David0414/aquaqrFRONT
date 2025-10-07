// src/pages/filling-progress/index.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProgressHeader from "./components/ProgressHeader";
import WaterAnimation from "./components/WaterAnimation";
import ProgressIndicator from "./components/ProgressIndicator";
import TransactionDetails from "./components/TransactionDetails";
import HelpModal from "./components/HelpModal";
import CancelConfirmationModal from "./components/CancelConfirmationModal";
import BottomTabNavigation from "../../components/ui/BottomTabNavigation";
import { showSuccessToast, showErrorToast, showWarningToast } from "../../components/ui/NotificationToast";
import { useDispenseFlow } from "../water-dispensing-control/FlowProvider";

function money(n){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2}).format(n);}

export default function FillingProgress() {
  const navigate = useNavigate();
  const location = useLocation();

  // 🔧 el contexto puede ser null si no estás dentro del Provider
  const flow = useDispenseFlow();
  const lastTx = flow?.lastTx;

  // Usa la tx que llega por state; si no, cae a la del contexto
  const tx = location.state?.tx || lastTx;

  useEffect(() => {
    if (!tx) navigate('/water/choose', { replace: true });
  }, [tx, navigate]);
  if (!tx) return null;

  const liters = tx.liters;
  const pricePerLiter = tx.pricePerLiter;
  const totalCost = (tx.amountCents ?? Math.round(liters * pricePerLiter * 100)) / 100;
  const prevBalance = (tx.prevBalanceCents ?? 0) / 100;
  const newBalance = (tx.newBalanceCents ?? 0) / 100;
  const flowRateLpm = tx.flowRateLpm ?? 1.3;
  const totalSeconds = useMemo(() => Math.max(1, Math.round((liters / flowRateLpm) * 60)), [liters, flowRateLpm]);

  const [progress, setProgress] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [remainingTime, setRemainingTime] = useState(totalSeconds);
  const [flowRate, setFlowRate] = useState(flowRateLpm);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDispensing, setIsDispensing] = useState(true);

  useEffect(() => {
    if (!isDispensing) return;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const elapsedS = Math.floor((Date.now() - start) / 1000);
      const pct = Math.min(100, Math.round((elapsedS / totalSeconds) * 100));
      setProgress(pct);
      setRemainingTime(Math.max(0, totalSeconds - elapsedS));
      setFlowRate(Math.max(0.6, flowRateLpm + (Math.random() - 0.5) * 0.2));
      if (pct >= 100) {
        setIsDispensing(false);
        setTimeout(() => navigate('/transaction-complete', { state: { tx } }), 700);
      } else {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isDispensing, totalSeconds, flowRateLpm, navigate, tx]);

  const donationAmount = Number((totalCost * 0.05).toFixed(2));
  const refundAmount = Number((totalCost * (1 - progress / 100)).toFixed(2));

  const handleCancelClick = useCallback(() => {
    if (progress > 0 && progress < 100) setIsCancelModalOpen(true);
    else navigate('/water/choose');
  }, [progress, navigate]);

  const handleConfirmCancel = useCallback(() => {
    setIsDispensing(false);
    setConnectionStatus('disconnected');
    showWarningToast(`Dispensado cancelado. Reembolso de ${money(refundAmount)} procesado.`);
    setTimeout(() => navigate('/home-dashboard', { state: { refundAmount, cancelledAt: new Date().toISOString() } }), 900);
  }, [refundAmount, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <ProgressHeader
        machineId={tx.machineId}
        location={tx.location}
        connectionStatus={connectionStatus}
        onCancel={handleCancelClick}
      />

      <div className="px-4 py-6 pb-20 space-y-8">
        <div className="text-center"><WaterAnimation isActive={isDispensing} /></div>
        <ProgressIndicator progress={progress} remainingTime={remainingTime} flowRate={flowRate} isActive={isDispensing}/>
        <TransactionDetails
          selectedLiters={liters}
          pricePerLiter={pricePerLiter}
          totalCost={totalCost}
          currentBalance={prevBalance}
          remainingBalance={newBalance}
        />
        <div className="text-center">
          <button onClick={() => setIsHelpModalOpen(true)} className="inline-flex items-center space-x-2 px-6 py-3 bg-muted rounded-full hover:bg-muted/80 transition-colors duration-200">
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
