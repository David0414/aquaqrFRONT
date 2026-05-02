import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
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

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

function monitorAdminHeaders() {
  if (typeof window === 'undefined') return {};
  if (window.sessionStorage.getItem('agua24MonitorAdmin') !== 'true') return {};
  return {
    'X-Monitor-User': window.sessionStorage.getItem('agua24MonitorAdminUser') || 'admin',
    'X-Monitor-Password': window.sessionStorage.getItem('agua24MonitorAdminPassword') || '123',
  };
}

function buildAuthHeaders(token, extra = {}) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...monitorAdminHeaders(),
    ...extra,
  };
}

const HARDWARE_COMMANDS = [
  { key: 'bomba_on', label: 'Bomba ON', icon: 'Power', className: 'bg-[#1E3F7A] text-white hover:bg-[#183666]' },
  { key: 'valvula_enjuague_on', label: 'Enjuague ON', icon: 'Waves', className: 'bg-[#42B9D4] text-white hover:bg-[#35a9c4]' },
  { key: 'valvula_llenado_on', label: 'Llenado ON', icon: 'Droplet', className: 'bg-[#0F9F6E] text-white hover:bg-[#0d875e]' },
  { key: 'bomba_off', label: 'Bomba OFF', icon: 'PowerOff', className: 'bg-[#1E3F7A] text-white hover:bg-[#183666]' },
  { key: 'valvula_enjuague_off', label: 'Enjuague OFF', icon: 'CircleOff', className: 'bg-[#42B9D4] text-white hover:bg-[#35a9c4]' },
  { key: 'valvula_llenado_off', label: 'Llenado OFF', icon: 'CircleOff', className: 'bg-[#0F9F6E] text-white hover:bg-[#0d875e]' },
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

function moneyFromCents(amountCents) {
  return (Number(amountCents || 0) / 100).toFixed(2);
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

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#42B9D4]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-text-primary">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
    </div>
  );
}

function CommandGrid({ title, description, commands, loadingAction, onCommand }) {
  return (
    <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {commands.map((item) => (
          <Button
            key={item.key}
            variant={item.variant}
            onClick={() => onCommand(item.key)}
            loading={loadingAction === item.key}
            className={`justify-center ${item.className || ''}`}
          >
            <Icon name={item.icon} size={16} /> {item.label}
          </Button>
        ))}
      </div>
    </section>
  );
}

const emptyMachineForm = {
  id: '',
  name: '',
  location: '',
  address: '',
  hardwareId: '',
  status: 'ONLINE',
  isActive: true,
};

export default function WaterMonitor() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
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
  const [monitorSummary, setMonitorSummary] = useState({ machines: [], promotions: [], counts: {} });
  const [machineForm, setMachineForm] = useState(emptyMachineForm);
  const [machineSaving, setMachineSaving] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);
  const [qrLoadingId, setQrLoadingId] = useState('');
  const [promotionSavingKey, setPromotionSavingKey] = useState('');
  const [pointsPerLiterConfig, setPointsPerLiterConfig] = useState('10');

  useEffect(() => {
    setTelemetryEnabled(true);
    return () => setTelemetryEnabled(false);
  }, [setTelemetryEnabled]);

  useEffect(() => {
    setPulsesPerLiterInput(String(pulsesPerLiter || 360));
  }, [pulsesPerLiter]);

  const fetchMonitorSummary = async () => {
    try {
      const token = await getToken({ template: CLERK_JWT_TEMPLATE }).catch(() => null);
      const res = await fetch(`${API}/api/monitor-admin/summary`, {
        headers: buildAuthHeaders(token),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        throw new Error(data?.error || 'No se pudo cargar el monitor');
      }
      setMonitorSummary(data);
      const pointsPromotion = (data.promotions || []).find((promotion) => promotion.key === 'monthly_consumption_points');
      if (pointsPromotion?.config?.pointsPerLiter) {
        setPointsPerLiterConfig(String(pointsPromotion.config.pointsPerLiter));
      }
    } catch (error) {
      showErrorToast(error?.message || 'No se pudo cargar el panel de monitoreo');
    }
  };

  useEffect(() => {
    fetchMonitorSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStep = getTelemetryStepInfo(telemetry.currentStageCode);
  const configuredPulsesPerLiter = sanitizePulsesPerLiter(pulsesPerLiterInput, pulsesPerLiter);
  const flowmeterLiters = pulsesToLiters(telemetry.flowmeterPulses, configuredPulsesPerLiter);
  const targetPulseOptions = [5, 10, 20].map((liters) => ({
    liters,
    pulses: getTargetPulseCount(liters, configuredPulsesPerLiter),
  }));

  const activePromotions = useMemo(
    () => (monitorSummary.promotions || []).filter((promotion) => promotion.isActive),
    [monitorSummary.promotions]
  );

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

  const handleSavePulsesPerLiter = async () => {
    const nextValue = sanitizePulsesPerLiter(pulsesPerLiterInput, pulsesPerLiter);

    try {
      const token = await getToken({ template: CLERK_JWT_TEMPLATE }).catch(() => null);
      const res = await fetch(`${API}/api/dispense/config/pulses`, {
        method: 'POST',
        headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ pulsesPerLiter: nextValue }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || data?.error || 'No se pudo guardar calibracion');

      setPulsesPerLiter(data.pulsesPerLiter || nextValue);
      setPulsesPerLiterInput(String(data.pulsesPerLiter || nextValue));
      setLastResponse({
        action: 'calibracion_global',
        commandLine: `PULSOS ${data.pulsesPerLiter || nextValue}`,
        pulsesPerLiter: data.pulsesPerLiter || nextValue,
        response: 'Calibracion guardada en backend para monitor y flujo normal.',
      });
      showSuccessToast(`Calibracion guardada: ${data.pulsesPerLiter || nextValue} pulsos/L`);
    } catch (error) {
      showErrorToast(error?.message || 'No se pudo guardar calibracion');
    }
  };

  const handleMachineChange = (field, value) => {
    setMachineForm((current) => ({ ...current, [field]: value }));
  };

  const handleMachineSubmit = async () => {
    try {
      if (!machineForm.id.trim()) {
        throw new Error('El ID de maquina es requerido');
      }
      setMachineSaving(true);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE }).catch(() => null);
      const res = await fetch(`${API}/api/monitor-admin/machines`, {
        method: 'POST',
        headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(machineForm),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || 'No se pudo guardar la maquina');
      showSuccessToast(`Maquina ${data.machine.id} guardada`);
      setMachineForm(emptyMachineForm);
      fetchMonitorSummary();
    } catch (error) {
      showErrorToast(error?.message || 'No se pudo guardar la maquina');
    } finally {
      setMachineSaving(false);
    }
  };

  const handleMachineEdit = (machine) => {
    setMachineForm({
      id: machine.id || '',
      name: machine.name || '',
      location: machine.location || '',
      address: machine.address || '',
      hardwareId: machine.hardwareId || '',
      status: machine.status || 'ONLINE',
      isActive: machine.isActive !== false,
    });
  };

  const handleMachineToggle = async (machine) => {
    try {
      const token = await getToken({ template: CLERK_JWT_TEMPLATE }).catch(() => null);
      const res = await fetch(`${API}/api/monitor-admin/machines/${machine.id}`, {
        method: 'PUT',
        headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ ...machine, isActive: !machine.isActive }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || 'No se pudo actualizar la maquina');
      showSuccessToast(`Maquina ${machine.id} ${data.machine.isActive ? 'activada' : 'desactivada'}`);
      fetchMonitorSummary();
    } catch (error) {
      showErrorToast(error?.message || 'No se pudo actualizar la maquina');
    }
  };

  const handleGenerateQr = async (machineId) => {
    try {
      setQrLoadingId(machineId);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE }).catch(() => null);
      const res = await fetch(`${API}/api/monitor-admin/machines/${machineId}/qr`, {
        headers: buildAuthHeaders(token),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || 'No se pudo generar el QR');
      setSelectedQr(data);
    } catch (error) {
      showErrorToast(error?.message || 'No se pudo generar el QR');
    } finally {
      setQrLoadingId('');
    }
  };

  const handlePromotionToggle = async (promotion) => {
    try {
      setPromotionSavingKey(promotion.key);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE }).catch(() => null);
      const payload = {
        isActive: !promotion.isActive,
      };
      if (promotion.key === 'monthly_consumption_points') {
        payload.config = { pointsPerLiter: sanitizePulsesPerLiter(pointsPerLiterConfig, 10) };
      }
      const res = await fetch(`${API}/api/monitor-admin/promotions/${promotion.key}`, {
        method: 'PUT',
        headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || 'No se pudo actualizar la promocion');
      showSuccessToast(`Promocion ${data.promotion.isActive ? 'activada' : 'desactivada'}`);
      fetchMonitorSummary();
    } catch (error) {
      showErrorToast(error?.message || 'No se pudo actualizar la promocion');
    } finally {
      setPromotionSavingKey('');
    }
  };

  const handleSavePointsConfig = async () => {
    try {
      setPromotionSavingKey('monthly_consumption_points');
      const token = await getToken({ template: CLERK_JWT_TEMPLATE }).catch(() => null);
      const res = await fetch(`${API}/api/monitor-admin/promotions/monthly_consumption_points`, {
        method: 'PUT',
        headers: buildAuthHeaders(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          config: {
            pointsPerLiter: sanitizePulsesPerLiter(pointsPerLiterConfig, 10),
          },
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || 'No se pudo guardar la configuracion');
      showSuccessToast('Puntos por litro actualizados');
      fetchMonitorSummary();
    } catch (error) {
      showErrorToast(error?.message || 'No se pudo guardar la configuracion');
    } finally {
      setPromotionSavingKey('');
    }
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

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <section className="rounded-3xl border border-sky-100 bg-white/90 p-6 shadow-sm">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#42B9D4]">Panel del dueño</p>
              <h1 className="mt-2 text-3xl font-black text-[#1E3F7A]">Monitor AGUA/24</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
                Aqui administras la operacion, las maquinas y las promociones. Todas las promociones 1, 2, 3 y 4 inician activas.
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

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Seccion 1"
            title="Operacion de la maquina"
            description="Monitoreo en vivo, calibracion y acciones manuales del equipo."
          />

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
              icon="Sparkles"
              label="Promociones activas"
              value={monitorSummary.counts?.activePromotions || activePromotions.length}
              hint="Las administras mas abajo."
            />
          </div>

          <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-text-primary">Actuadores</h3>
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

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
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
            <h3 className="text-lg font-bold text-text-primary">Trama y respuesta</h3>
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
        </section>

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Seccion 2"
            title="Administracion de maquinas"
            description="Da de alta tus maquinas, guarda direccion y genera su codigo QR desde aqui."
          />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-sky-100 bg-slate-50 p-4">
              <h3 className="text-lg font-bold text-text-primary">Alta o edicion</h3>
              <div className="mt-4 space-y-3">
                <Input label="ID de maquina" value={machineForm.id} onChange={(event) => handleMachineChange('id', event.target.value)} />
                <Input label="Nombre" value={machineForm.name} onChange={(event) => handleMachineChange('name', event.target.value)} />
                <Input label="Ubicacion" value={machineForm.location} onChange={(event) => handleMachineChange('location', event.target.value)} />
                <Input label="Direccion" value={machineForm.address} onChange={(event) => handleMachineChange('address', event.target.value)} />
                <Input label="Hardware ID" value={machineForm.hardwareId} onChange={(event) => handleMachineChange('hardwareId', event.target.value)} />
                <Input label="Status" value={machineForm.status} onChange={(event) => handleMachineChange('status', event.target.value)} />
                <label className="flex items-center gap-3 rounded-xl bg-white px-3 py-3 text-sm text-text-primary">
                  <Input
                    type="checkbox"
                    checked={machineForm.isActive}
                    onChange={(event) => handleMachineChange('isActive', event.target.checked)}
                  />
                  Maquina activa
                </label>
                <div className="flex gap-3">
                  <Button onClick={handleMachineSubmit} loading={machineSaving} className="flex-1">
                    <Icon name="Save" size={16} /> Guardar maquina
                  </Button>
                  <Button variant="outline" onClick={() => setMachineForm(emptyMachineForm)}>
                    Limpiar
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {(monitorSummary.machines || []).map((machine) => (
                <article key={machine.id} className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-text-primary">{machine.id}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${machine.isActive ? 'bg-success/10 text-success' : 'bg-slate-200 text-slate-600'}`}>
                          {machine.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">{machine.name || 'Sin nombre'} · {machine.location || 'Sin ubicacion'}</p>
                      <p className="mt-1 text-sm text-text-secondary">{machine.address || 'Sin direccion guardada'}</p>
                      <p className="mt-1 text-xs text-text-secondary">Hardware: {machine.hardwareId || 'N/D'} · Estado: {machine.status || 'ONLINE'}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleMachineEdit(machine)}>
                        <Icon name="Pencil" size={14} /> Editar
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => handleGenerateQr(machine.id)} loading={qrLoadingId === machine.id}>
                        <Icon name="QrCode" size={14} /> QR
                      </Button>
                      <Button variant={machine.isActive ? 'warning' : 'success'} size="sm" onClick={() => handleMachineToggle(machine)}>
                        <Icon name={machine.isActive ? 'PauseCircle' : 'PlayCircle'} size={14} />
                        {machine.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {selectedQr ? (
            <div className="mt-6 rounded-2xl border border-sky-100 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">QR de la maquina {selectedQr.machineId}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{selectedQr.machineLocation || 'Sin ubicacion registrada'}</p>
                  <p className="mt-2 break-all text-xs text-text-secondary">{selectedQr.deepUrl}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedQr(null)}
                  className="text-sm font-semibold text-[#1E3F7A]"
                >
                  Cerrar
                </button>
              </div>
              <div className="mt-4 flex justify-center md:justify-start">
                <img src={selectedQr.qrPngDataUrl} alt={`QR ${selectedQr.machineId}`} className="h-48 w-48 rounded-2xl border border-sky-100 bg-white p-3" />
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
          <SectionHeader
            eyebrow="Seccion 3"
            title="Promociones y recompensas"
            description="Activa o desactiva promociones. La membresia premium sigue fuera por ahora."
          />

          <div className="mb-5 grid gap-4 md:grid-cols-3">
            <Metric
              icon="Sparkles"
              label="Promociones activas"
              value={monitorSummary.counts?.activePromotions || 0}
              hint="Las promociones 1, 2, 3 y 4 inician activas."
            />
            <Metric
              icon="Factory"
              label="Maquinas activas"
              value={monitorSummary.counts?.activeMachines || 0}
              hint={`${monitorSummary.counts?.machines || 0} maquinas registradas`}
            />
            <Metric
              icon="Gift"
              label="Puntos por litro"
              value={pointsPerLiterConfig}
              hint="Configurable para la promocion 4."
            />
          </div>

          <div className="rounded-2xl border border-sky-100 bg-slate-50 p-4 mb-5">
            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
              <Input
                label="Puntos por litro para recompensa por consumo mensual"
                type="number"
                min="1"
                value={pointsPerLiterConfig}
                onChange={(event) => setPointsPerLiterConfig(event.target.value)}
                description="Como en tu imagen no estaba definido, aqui lo dejas administrable desde monitoreo."
              />
              <Button onClick={handleSavePointsConfig} loading={promotionSavingKey === 'monthly_consumption_points'}>
                <Icon name="Save" size={16} /> Guardar puntos/L
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {(monitorSummary.promotions || []).map((promotion) => (
              <article key={promotion.key} className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-text-primary">{promotion.sortOrder}. {promotion.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${promotion.isActive ? 'bg-success/10 text-success' : 'bg-slate-200 text-slate-600'}`}>
                        {promotion.isActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-text-secondary">{promotion.description || promotion.summary}</p>

                    {promotion.key === 'topup_bonus' && Array.isArray(promotion.config?.tiers) ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {promotion.config.tiers.map((tier) => (
                          <span key={`${promotion.key}-${tier.amountCents}`} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#1E3F7A]">
                            {tier.label || `${moneyFromCents(tier.amountCents)} + ${moneyFromCents(tier.bonusCents)}`}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {promotion.key === 'monthly_cashback' && Array.isArray(promotion.config?.tiers) ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {promotion.config.tiers.map((tier, index) => (
                          <span key={`${promotion.key}-${index}`} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#1E3F7A]">
                            {tier.label}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {promotion.key === 'monthly_consumption_points' && Array.isArray(promotion.config?.tiers) ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {promotion.config.tiers.map((tier, index) => (
                          <span key={`${promotion.key}-${index}`} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-[#1E3F7A]">
                            {tier.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={promotion.isActive ? 'warning' : 'success'}
                      size="sm"
                      onClick={() => handlePromotionToggle(promotion)}
                      loading={promotionSavingKey === promotion.key}
                      disabled={promotion.key === 'premium_membership'}
                    >
                      <Icon name={promotion.isActive ? 'ToggleRight' : 'ToggleLeft'} size={14} />
                      {promotion.isActive ? 'Desactivar' : 'Activar'}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <NotificationToast />
    </div>
  );
}
