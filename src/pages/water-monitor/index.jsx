import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Agua24Brand from '../../components/Agua24Brand';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import NotificationToast, { showErrorToast, showSuccessToast } from '../../components/ui/NotificationToast';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';
import {
  getTargetPulseCount,
  getTelemetryStepInfo,
  pulsesToLiters,
  sanitizePulsesPerLiter,
} from '../water-dispensing-control/telemetry';

const FLOW_COMMANDS = [
  { key: 'qr_inicio', label: 'Inicio', icon: 'Play', variant: 'default' },
  { key: 'enjuague', label: 'Enjuague 3s', icon: 'Waves', variant: 'secondary' },
  { key: 'inicio_dispensado', label: 'Llenar', icon: 'Droplets', variant: 'default' },
];

const HARDWARE_COMMANDS = [
  { key: 'bomba_on', label: 'Bomba ON', icon: 'Power', variant: 'success' },
  { key: 'bomba_off', label: 'Bomba OFF', icon: 'PowerOff', variant: 'secondary' },
  { key: 'valvula_enjuague_on', label: 'Enjuague ON', icon: 'Waves', variant: 'success' },
  { key: 'valvula_enjuague_off', label: 'Enjuague OFF', icon: 'CircleOff', variant: 'secondary' },
  { key: 'valvula_llenado_on', label: 'Llenado ON', icon: 'Droplet', variant: 'success' },
  { key: 'valvula_llenado_off', label: 'Llenado OFF', icon: 'CircleOff', variant: 'secondary' },
];

const SAFETY_COMMANDS = [
  { key: 'apagar_valvulas_forzado', label: 'Apagar todo', icon: 'ShieldAlert', variant: 'warning' },
  { key: 'reiniciar_sistema', label: 'Reiniciar a 00', icon: 'RotateCcw', variant: 'danger' },
];

function formatSeenAt(value) {
  if (!value) return 'Sin lectura';
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function StatusPill({ active, labelOn, labelOff }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${active ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-text-primary">{active ? labelOn : labelOff}</span>
        <span className={`h-3 w-3 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]' : 'bg-slate-300'}`} />
      </div>
    </div>
  );
}

function Metric({ icon, label, value, hint }) {
  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
          <Icon name={icon} size={19} className="text-[#42B9D4]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
          <p className="mt-1 text-xl font-bold text-text-primary">{value}</p>
          {hint ? <p className="mt-1 text-xs text-text-secondary">{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

function CommandGrid({ title, description, commands, loadingAction, onCommand }) {
  return (
    <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-text-primary">{title}</h2>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {commands.map((item) => (
          <Button
            key={item.key}
            variant={item.variant}
            onClick={() => onCommand(item.key)}
            loading={loadingAction === item.key}
            className="justify-center"
          >
            <Icon name={item.icon} size={16} /> {item.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

export default function WaterMonitor() {
  const navigate = useNavigate();
  const {
    telemetry,
    pulsesPerLiter,
    setPulsesPerLiter,
    setTelemetryEnabled,
    sendStageCommand,
  } = useDispenseFlow();
  const [loadingAction, setLoadingAction] = useState('');
  const [lastResponse, setLastResponse] = useState(null);
  const [pulsesPerLiterInput, setPulsesPerLiterInput] = useState(String(pulsesPerLiter || 360));

  useEffect(() => {
    setTelemetryEnabled(true);
    return () => setTelemetryEnabled(false);
  }, [setTelemetryEnabled]);

  useEffect(() => {
    setPulsesPerLiterInput(String(pulsesPerLiter || 360));
  }, [pulsesPerLiter]);

  const currentStep = getTelemetryStepInfo(telemetry.currentStageCode);
  const configuredPulsesPerLiter = sanitizePulsesPerLiter(pulsesPerLiterInput, pulsesPerLiter);
  const flowmeterLiters = pulsesToLiters(telemetry.flowmeterPulses, configuredPulsesPerLiter);
  const targetPulseOptions = [5, 10, 20].map((liters) => ({
    liters,
    pulses: getTargetPulseCount(liters, configuredPulsesPerLiter),
  }));

  const handleCommand = async (action) => {
    const commandPulsesPerLiter = sanitizePulsesPerLiter(pulsesPerLiterInput, pulsesPerLiter);

    try {
      setPulsesPerLiter(commandPulsesPerLiter);
      setPulsesPerLiterInput(String(commandPulsesPerLiter));
      setLoadingAction(action);
      const data = await sendStageCommand(action, { pulsesPerLiter: commandPulsesPerLiter });
      setLastResponse(data);
      showSuccessToast(`Comando enviado: ${action}`);
    } catch (err) {
      showErrorToast(err?.message || 'No se pudo enviar el comando');
    } finally {
      setLoadingAction('');
    }
  };

  const handleSavePulsesPerLiter = () => {
    const nextValue = sanitizePulsesPerLiter(pulsesPerLiterInput, pulsesPerLiter);
    setPulsesPerLiter(nextValue);
    setPulsesPerLiterInput(String(nextValue));
    setLastResponse({
      action: 'calibracion_local',
      commandLine: `PULSOS ${nextValue}`,
      pulsesPerLiter: nextValue,
      response: 'Calibracion guardada para el siguiente comando.',
    });
    showSuccessToast(`Calibracion guardada: ${nextValue} pulsos/L`);
  };

  const handleLogout = () => {
    window.sessionStorage.removeItem('agua24MonitorAdmin');
    window.sessionStorage.removeItem('agua24MonitorAdminUser');
    window.sessionStorage.removeItem('agua24MonitorAdminPassword');
    navigate('/user-login?monitor=1', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d8f7ff_0,#f8fdff_36%,#eef9ff_100%)]">
      <header className="sticky top-0 z-30 border-b border-sky-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Agua24Brand className="h-11" />
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/home-dashboard')}>
              <Icon name="Home" size={16} /> App
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <Icon name="LogOut" size={16} /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <section className="mb-6 rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#42B9D4]">Panel del dueño</p>
              <h1 className="mt-2 text-3xl font-black text-[#1E3F7A]">Monitor AGUA/24</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                Vista simplificada para entender el estado de la maquina, ajustar calibracion y enviar comandos manuales.
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${telemetry.machineOnline ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <div className="flex items-center gap-3">
                <Icon
                  name={telemetry.machineOnline ? 'Wifi' : 'WifiOff'}
                  size={24}
                  className={telemetry.machineOnline ? 'text-emerald-600' : 'text-amber-600'}
                />
                <div>
                  <p className="font-bold text-text-primary">
                    {telemetry.machineOnline ? 'Maquina conectada' : 'Esperando maquina'}
                  </p>
                  <p className="text-sm text-text-secondary">Ultima lectura: {formatSeenAt(telemetry.lastSeenAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon="ListChecks"
            label="Paso actual"
            value={`${currentStep.code}: ${currentStep.shortLabel || currentStep.label}`}
            hint={currentStep.instruction}
          />
          <Metric
            icon="Gauge"
            label="Caudalimetro"
            value={`${telemetry.flowmeterPulses ?? 0} pulsos`}
            hint={`${flowmeterLiters.toFixed(3)} litros estimados`}
          />
          <Metric
            icon="FlaskConical"
            label="pH"
            value={telemetry.phDecimal ?? '--'}
            hint={telemetry.phVoltage ? `${telemetry.phVoltage} V` : 'Sin voltaje'}
          />
          <Metric
            icon="Coins"
            label="Monedas"
            value={`$${Number(telemetry.accumulatedMoney || 0).toFixed(0)}`}
            hint={telemetry.insertedCoinLabel || 'Sin moneda'}
          />
        </div>

        <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-text-primary">Actuadores</h2>
            <p className="mt-1 text-sm text-text-secondary">Lectura inmediata de bomba y valvulas.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <StatusPill active={telemetry.pumpOn} labelOn="Bomba encendida" labelOff="Bomba apagada" />
            <StatusPill active={telemetry.fillValveOn} labelOn="Llenado abierto" labelOff="Llenado cerrado" />
            <StatusPill active={telemetry.rinseValveOn} labelOn="Enjuague abierto" labelOff="Enjuague cerrado" />
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
            <Input
              label="Calibracion del caudalimetro"
              type="number"
              min="1"
              step="1"
              value={pulsesPerLiterInput}
              onChange={(event) => setPulsesPerLiterInput(event.target.value)}
              description="Pulsos necesarios para medir 1 litro. Este valor se envia con los comandos de llenado."
            />
            <Button onClick={handleSavePulsesPerLiter}>
              <Icon name="Save" size={16} /> Guardar calibracion
            </Button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {targetPulseOptions.map((option) => (
              <div key={option.liters} className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Meta {option.liters} L</p>
                <p className="mt-1 text-lg font-bold text-text-primary">{option.pulses} pulsos</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <CommandGrid
            title="Flujo guiado"
            description="Comandos normales del proceso."
            commands={FLOW_COMMANDS}
            loadingAction={loadingAction}
            onCommand={handleCommand}
          />
          <CommandGrid
            title="Control manual"
            description="Activa o apaga componentes de forma individual."
            commands={HARDWARE_COMMANDS}
            loadingAction={loadingAction}
            onCommand={handleCommand}
          />
          <CommandGrid
            title="Seguridad"
            description="Usalo para recuperar la maquina o apagar actuadores."
            commands={SAFETY_COMMANDS}
            loadingAction={loadingAction}
            onCommand={handleCommand}
          />
        </div>

        <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-text-primary">Trama y respuesta</h2>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-sky-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Trama recibida</p>
              <p className="mt-2 break-all font-data text-sm text-text-primary">{telemetry.rawFrame || 'Sin trama valida'}</p>
              {telemetry.error ? <p className="mt-2 text-sm font-medium text-error">{telemetry.error}</p> : null}
            </div>
            <div className="rounded-xl border border-sky-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Ultimo comando</p>
              {lastResponse ? (
                <div className="mt-2 space-y-1 text-sm text-text-secondary">
                  <p>Accion: <span className="font-semibold text-text-primary">{lastResponse.action}</span></p>
                  <p>Comando: <span className="font-semibold text-text-primary">{lastResponse.commandLine || lastResponse.command}</span></p>
                  <p>Respuesta: <span className="font-semibold text-text-primary">{lastResponse.response || '-'}</span></p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-text-secondary">Sin comandos enviados.</p>
              )}
            </div>
          </div>
        </section>
      </main>

      <NotificationToast />
    </div>
  );
}
