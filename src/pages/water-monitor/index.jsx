import React, { useEffect, useState } from 'react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import MachineInfoCard from '../water-dispensing-control/components/MachineInfoCard';
import { showErrorToast, showSuccessToast } from '../../components/ui/NotificationToast';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';

const DEMO_ACTIONS = [
  { key: 'bomba_on', label: 'Bomba ON', variant: 'success' },
  { key: 'bomba_off', label: 'Bomba OFF', variant: 'secondary' },
  { key: 'valvula_enjuague_on', label: 'Enjuague ON', variant: 'success' },
  { key: 'valvula_enjuague_off', label: 'Enjuague OFF', variant: 'secondary' },
  { key: 'valvula_llenado_on', label: 'Llenado ON', variant: 'success' },
  { key: 'valvula_llenado_off', label: 'Llenado OFF', variant: 'secondary' },
  { key: 'apagar_valvulas_forzado', label: 'Forzar apagado', variant: 'warning' },
  { key: 'reiniciar_sistema', label: 'Reiniciar sistema', variant: 'danger' },
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

export default function WaterMonitor() {
  const {
    machine,
    connectionStatus,
    telemetry,
    pricePerLiterCents,
    setTelemetryEnabled,
    sendStageCommand,
  } = useDispenseFlow();
  const [loadingAction, setLoadingAction] = useState('');
  const [demoResponse, setDemoResponse] = useState(null);

  useEffect(() => {
    setTelemetryEnabled(true);
    return () => {
      setTelemetryEnabled(false);
    };
  }, [setTelemetryEnabled]);

  const machineConnectionStatus = telemetry.lastSeenAt
    ? (telemetry.machineOnline ? 'connected' : 'disconnected')
    : connectionStatus;

  const handleDemoAction = async (action) => {
    try {
      setLoadingAction(action);
      const data = await sendStageCommand(action);
      setDemoResponse(data);
      showSuccessToast(`Comando "${action}" enviado`);
    } catch (err) {
      showErrorToast(err?.message || 'No se pudo enviar comando demo');
    } finally {
      setLoadingAction('');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 py-6 pb-20">
        <div className="space-y-6">
          <MachineInfoCard
            machineId={machine.id}
            location={machine.location}
            connectionStatus={machineConnectionStatus}
            pricePerGarrafon={(pricePerLiterCents * 20) / 100}
            garrafonLiters={20}
          />

          <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
            <div>
              <h1 className="text-lg font-semibold text-text-primary">Monitor de Maquina</h1>
              <p className="text-sm text-text-secondary">
                Esta vista escucha el puerto de monitor para leer tramas sin enviar comandos al equipo.
              </p>
            </div>

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

            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm text-text-primary">
              <p className="font-medium">Nota</p>
              <p className="mt-1 text-text-secondary">
                "Forzar apagado" envia el comando <span className="mx-1 font-mono">FF</span>
                para transmitir <span className="mx-1 font-mono">AA-FF</span>. "Reiniciar sistema" envia
                <span className="mx-1 font-mono">5A</span>
                para transmitir <span className="mx-1 font-mono">AA-5A</span>.
              </p>
            </div>
          </div>
        </div>
      </main>
      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
}
