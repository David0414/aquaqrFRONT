import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import MachineInfoCard from '../components/MachineInfoCard';
import BottleSizeSelector from '../components/BottleSizeSelector';
import PricingCalculator from '../components/PricingCalculator';
import { showErrorToast, showSuccessToast } from '../../../components/ui/NotificationToast';
import { useDispenseFlow } from '../FlowProvider';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

const DEMO_ACTIONS = [
  { key: 'bomba_on', label: 'Bomba ON', variant: 'success' },
  { key: 'bomba_off', label: 'Bomba OFF', variant: 'secondary' },
  { key: 'valvula_enjuague_on', label: 'Enjuague ON', variant: 'success' },
  { key: 'valvula_enjuague_off', label: 'Enjuague OFF', variant: 'secondary' },
  { key: 'valvula_llenado_on', label: 'Llenado ON', variant: 'success' },
  { key: 'valvula_llenado_off', label: 'Llenado OFF', variant: 'secondary' },
];

function formatSeenAt(value) {
  if (!value) return 'Sin datos';
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function ValveIndicator({ label, isOn }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        <p className="text-xs text-text-secondary">{isOn ? 'Encendida' : 'Apagada'}</p>
      </div>
      <span
        className={`h-4 w-4 rounded-full border ${
          isOn ? 'border-green-600 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.45)]' : 'border-slate-300 bg-slate-300'
        }`}
        aria-label={`${label} ${isOn ? 'encendida' : 'apagada'}`}
      />
    </div>
  );
}

export default function SelectAmount() {
  const nav = useNavigate();
  const { getToken } = useAuth();
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
    sendStageCommand,
  } = useDispenseFlow();
  const [viewMode, setViewMode] = useState('normal');
  const [loadingAction, setLoadingAction] = useState('');
  const [demoResponse, setDemoResponse] = useState(null);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchWallet();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const canContinue = useMemo(() => viewMode === 'normal', [viewMode]);
  const machineConnectionStatus = telemetry.lastSeenAt
    ? (telemetry.machineOnline ? 'connected' : 'disconnected')
    : connectionStatus;

  const handleDemoAction = async (action) => {
    try {
      setLoadingAction(action);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      const res = await fetch(`${API}/api/dispense/demo/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || 'Error enviando comando demo');

      setDemoResponse(data);
      showSuccessToast(`Comando "${action}" enviado`);
    } catch (err) {
      showErrorToast(err?.message || 'No se pudo enviar comando demo');
    } finally {
      setLoadingAction('');
    }
  };

  const handleContinue = async () => {
    const litersActionMap = {
      5: 'litros_5',
      10: 'litros_10',
      20: 'litros_20',
    };

    try {
      setContinuing(true);
      const action = litersActionMap[selectedLiters];
      if (action) {
        await sendStageCommand(action);
      }
      nav('/water/position-down');
    } catch (err) {
      showErrorToast(err?.message || 'No se pudo enviar el comando de litros');
    } finally {
      setContinuing(false);
    }
  };

  return (
    <div className="space-y-6">
      <MachineInfoCard
        machineId={machine.id}
        location={machine.location}
        connectionStatus={machineConnectionStatus}
        pricePerGarrafon={(pricePerLiterCents * 20) / 100}
        garrafonLiters={20}
      />

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setViewMode('normal')}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            viewMode === 'normal'
              ? 'bg-primary text-primary-foreground'
              : 'text-text-secondary hover:bg-muted'
          }`}
        >
          Dispensar
        </button>
        <button
          type="button"
          onClick={() => setViewMode('demo')}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            viewMode === 'demo'
              ? 'bg-primary text-primary-foreground'
              : 'text-text-secondary hover:bg-muted'
          }`}
        >
          Demo
        </button>
      </div>

      {viewMode === 'normal' ? (
        <>
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
        </>
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-text-primary">Control Demo (Waterserver)</h3>
          <p className="text-sm text-text-secondary">
            La app esta leyendo inputs en automatico todo el tiempo para monitoreo de emergencia. Ya no hace falta el boton de leer input.
          </p>

          <div className="grid gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-text-secondary">Estado maquina</p>
              <p className={`text-sm font-semibold ${telemetry.machineOnline ? 'text-success' : 'text-error'}`}>
                {telemetry.machineOnline ? `Encendida / ID ${telemetry.machineHardwareId || '--'}` : 'Apagada o ID distinto'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-secondary">Ultima lectura</p>
              <p className="text-sm font-semibold text-text-primary">{formatSeenAt(telemetry.lastSeenAt)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-text-secondary">Trama recibida</p>
              <p className="break-all font-mono text-sm text-text-primary">{telemetry.rawFrame || 'Sin trama valida'}</p>
            </div>
            {telemetry.error ? (
              <div className="sm:col-span-2 rounded-lg border border-error/20 bg-error/5 px-3 py-2 text-sm text-error">
                {telemetry.error}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Sensor pH decimal" value={telemetry.phDecimal ?? ''} readOnly placeholder="Esperando lectura" />
            <Input label="Voltaje pH" value={telemetry.phVoltage ?? ''} readOnly placeholder="Esperando lectura" />
            <Input label="Hex pH" value={telemetry.phHex} readOnly placeholder="--" />
            <Input label="Sensor solidos decimal" value={telemetry.solidsDecimal ?? ''} readOnly placeholder="Esperando lectura" />
            <Input label="Hex solidos" value={telemetry.solidsHex} readOnly placeholder="--" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ValveIndicator label="Valvula de llenado" isOn={telemetry.fillValveOn} />
            <ValveIndicator label="Valvula de enjuague" isOn={telemetry.rinseValveOn} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACTIONS.map((item) => (
              <Button
                key={item.key}
                variant={item.variant}
                onClick={() => handleDemoAction(item.key)}
                loading={loadingAction === item.key}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-background p-3 text-sm">
            <p className="font-medium text-text-primary">Ultima respuesta</p>
            {demoResponse ? (
              <div className="mt-2 space-y-1 text-text-secondary">
                <p>Accion: <span className="font-medium text-text-primary">{demoResponse.action}</span></p>
                <p>Comando: <span className="font-medium text-text-primary">{demoResponse.command}</span></p>
                <p>Server: <span className="font-medium text-text-primary">{demoResponse.response || '-'}</span></p>
              </div>
            ) : (
              <p className="mt-2 text-text-secondary">Sin comandos enviados aun.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => nav('/home-dashboard')}>
          <Icon name="X" size={18} /> Cancelar
        </Button>
        <Button className="flex-1" onClick={handleContinue} disabled={!canContinue} loading={continuing}>
          Continuar <Icon name="ArrowRight" size={18} />
        </Button>
      </div>
    </div>
  );
}
