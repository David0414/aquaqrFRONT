import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Agua24Brand from '../../components/Agua24Brand';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
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

const HARDWARE_COMMANDS = [
  { key: 'bomba_on', label: 'Bomba ON', icon: 'Power', className: 'bg-[#1E3F7A] text-white hover:bg-[#183666]' },
  { key: 'valvula_enjuague_on', label: 'Enjuague ON', icon: 'Waves', className: 'bg-[#42B9D4] text-white hover:bg-[#35a9c4]' },
  { key: 'valvula_llenado_on', label: 'Llenado ON', icon: 'Droplet', className: 'bg-[#0F9F6E] text-white hover:bg-[#0d875e]' },
  { key: 'bomba_off', label: 'Bomba OFF', icon: 'PowerOff', className: 'bg-[#334155] text-white hover:bg-[#1e293b]' },
  { key: 'valvula_enjuague_off', label: 'Enjuague OFF', icon: 'CircleOff', className: 'bg-[#64748b] text-white hover:bg-[#475569]' },
  { key: 'valvula_llenado_off', label: 'Llenado OFF', icon: 'CircleOff', className: 'bg-[#475569] text-white hover:bg-[#334155]' },
];

const SAFETY_COMMANDS = [
  { key: 'apagar_valvulas_forzado', label: 'Apagar todo', icon: 'ShieldAlert', variant: 'warning' },
  { key: 'reiniciar_sistema', label: 'Reiniciar a 00', icon: 'RotateCcw', variant: 'danger' },
];

const MONITOR_TABS = [
  { key: 'overview', label: 'Resumen', icon: 'LayoutDashboard' },
  { key: 'machines', label: 'Maquinas', icon: 'Factory' },
  { key: 'promotions', label: 'Promociones', icon: 'Gift' },
];

const MACHINE_STATUS_OPTIONS = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
  { value: 'INSTALLING', label: 'Instalacion' },
];

const emptyMachineForm = {
  id: '',
  name: '',
  location: '',
  address: '',
  hardwareId: '',
  status: 'ONLINE',
  isActive: true,
};

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

function normalizeHardwareId(value) {
  const clean = String(value || '').trim().toUpperCase().replace(/[^0-9A-F]/g, '');
  return clean ? clean.padStart(2, '0').slice(-2) : '';
}

function formatSeenAt(value) {
  if (!value) return 'Sin lectura';
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}

function buildTelemetryMachineFallback(telemetry) {
  const hardwareId = normalizeHardwareId(telemetry?.machineHardwareId);
  if (!hardwareId) return null;

  return {
    id: hardwareId,
    name: `Maquina ${hardwareId}`,
    location: 'Detectada por telemetria',
    address: 'Aun no registrada en el monitor',
    hardwareId,
    status: telemetry?.machineOnline ? 'ONLINE' : 'SINCRONIZANDO',
    isActive: true,
    detectedOnly: true,
    stickerUrl: null,
  };
}

function StatusPill({ active, labelOn, labelOff, darkMode }) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${active ? 'border-emerald-300 bg-emerald-500/10' : darkMode ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm font-medium ${darkMode ? 'text-slate-100' : 'text-text-primary'}`}>{active ? labelOn : labelOff}</span>
        <span className={`h-3 w-3 rounded-full ${active ? 'bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]' : 'bg-slate-300'}`} />
      </div>
    </div>
  );
}

function Metric({ icon, label, value, hint, darkMode }) {
  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-950/65' : 'border-sky-100 bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${darkMode ? 'bg-slate-900' : 'bg-sky-50'}`}>
          <Icon name={icon} size={19} className="text-[#42B9D4]" />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-text-secondary'}`}>{label}</p>
          <p className={`mt-1 text-xl font-bold ${darkMode ? 'text-white' : 'text-text-primary'}`}>{value}</p>
          {hint ? <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-text-secondary'}`}>{hint}</p> : null}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, description, darkMode }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#42B9D4]">{eyebrow}</p>
      <h2 className={`mt-2 text-2xl font-black ${darkMode ? 'text-white' : 'text-text-primary'}`}>{title}</h2>
      <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>{description}</p>
    </div>
  );
}

function CommandGrid({ title, description, commands, loadingAction, onCommand, darkMode }) {
  return (
    <section className={`rounded-3xl border p-5 shadow-sm ${darkMode ? 'border-slate-800 bg-slate-950/65' : 'border-sky-100 bg-white'}`}>
      <div className="mb-4">
        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-text-primary'}`}>{title}</h3>
        <p className={`mt-1 text-sm ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>{description}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
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
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [selectedMachineId, setSelectedMachineId] = useState('');

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentStep = getTelemetryStepInfo(telemetry.currentStageCode);
  const configuredPulsesPerLiter = sanitizePulsesPerLiter(pulsesPerLiterInput, pulsesPerLiter);
  const flowmeterLiters = pulsesToLiters(telemetry.flowmeterPulses, configuredPulsesPerLiter);
  const targetPulseOptions = [5, 10, 20].map((liters) => ({
    liters,
    pulses: getTargetPulseCount(liters, configuredPulsesPerLiter),
  }));

  const telemetryMachine = useMemo(() => buildTelemetryMachineFallback(telemetry), [telemetry]);

  const displayedMachines = useMemo(() => {
    const machines = [...(monitorSummary.machines || [])];
    if (!telemetryMachine) return machines;

    const exists = machines.some((machine) => (
      machine.id === telemetryMachine.id
      || normalizeHardwareId(machine.hardwareId) === telemetryMachine.hardwareId
    ));

    if (!exists) {
      machines.unshift(telemetryMachine);
    }

    return machines;
  }, [monitorSummary.machines, telemetryMachine]);

  useEffect(() => {
    if (!displayedMachines.length) return;
    setSelectedMachineId((current) => {
      if (current && displayedMachines.some((machine) => machine.id === current)) return current;
      return displayedMachines[0]?.id || '';
    });
  }, [displayedMachines]);

  const selectedMachine = useMemo(
    () => displayedMachines.find((machine) => machine.id === selectedMachineId) || null,
    [displayedMachines, selectedMachineId]
  );

  const machineSelectOptions = useMemo(
    () => displayedMachines.map((machine) => ({
      value: machine.id,
      label: `${machine.id}${machine.name ? ` · ${machine.name}` : ''}`,
    })),
    [displayedMachines]
  );

  const activePromotions = useMemo(
    () => (monitorSummary.promotions || []).filter((promotion) => promotion.isActive),
    [monitorSummary.promotions]
  );

  const selectedMachineHardwareId = normalizeHardwareId(selectedMachine?.hardwareId || selectedMachine?.id);
  const telemetryHardwareId = normalizeHardwareId(telemetry.machineHardwareId);
  const selectedMachineHasTelemetry = Boolean(
    telemetry.lastSeenAt
    && selectedMachineHardwareId
    && telemetryHardwareId
    && selectedMachineHardwareId === telemetryHardwareId
  );

  const activeMachineLabel = useMemo(() => {
    if (selectedMachine) {
      return `${selectedMachine.id}${selectedMachine.location ? ` · ${selectedMachine.location}` : ''}`;
    }
    if (telemetryHardwareId) return `Maquina ${telemetryHardwareId}`;
    return 'Sin maquina detectada';
  }, [selectedMachine, telemetryHardwareId]);

  const connectionHeadline = selectedMachineHasTelemetry
    ? 'Maquina conectada'
    : selectedMachine
      ? 'Sin telemetria reciente'
      : 'Esperando maquina';
  const connectionSubtitle = selectedMachineHasTelemetry
    ? `Ultima lectura: ${formatSeenAt(telemetry.lastSeenAt)}`
    : selectedMachine
      ? `Estado configurado: ${selectedMachine.status || 'ONLINE'}`
      : `Ultima lectura: ${formatSeenAt(telemetry.lastSeenAt)}`;

  const handleCommand = async (action) => {
    try {
      const nextPpl = sanitizePulsesPerLiter(pulsesPerLiterInput, pulsesPerLiter);
      setPulsesPerLiter(nextPpl);
      setPulsesPerLiterInput(String(nextPpl));
      setLoadingAction(action);
      const data = await sendStageCommand(action, { pulsesPerLiter: nextPpl });
      setLastResponse(data);
      showSuccessToast(`Comando enviado: ${action}`);
    } catch (error) {
      showErrorToast(error?.message || 'No se pudo enviar el comando');
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
      const payload = { isActive: !promotion.isActive };
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

  const shellClass = darkMode
    ? 'min-h-screen bg-[radial-gradient(circle_at_top_left,#0f1a2c_0,#10182a_38%,#09111f_100%)] text-slate-100'
    : 'min-h-screen bg-[radial-gradient(circle_at_top_left,#d8f7ff_0,#f8fdff_36%,#eef9ff_100%)] text-slate-900';
  const topBarClass = darkMode ? 'border-slate-800 bg-slate-950/85' : 'border-sky-100 bg-white/85';
  const panelClass = darkMode ? 'border-slate-800 bg-slate-950/70' : 'border-sky-100 bg-white/92';
  const cardClass = darkMode ? 'border-slate-800 bg-slate-950/65' : 'border-sky-100 bg-white';
  const mutedClass = darkMode ? 'border-slate-800 bg-slate-900/80' : 'border-sky-100 bg-slate-50';

  return (
    <div className={shellClass}>
      <header className={`sticky top-0 z-30 border-b backdrop-blur ${topBarClass}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Agua24Brand className="h-11" />
          <div className="flex items-center gap-2">
            <Button variant={darkMode ? 'secondary' : 'outline'} size="sm" onClick={() => setDarkMode((current) => !current)}>
              <Icon name={darkMode ? 'Sun' : 'Moon'} size={16} /> {darkMode ? 'Tema claro' : 'Tema oscuro'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/home-dashboard')}>
              <Icon name="Home" size={16} /> App
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <Icon name="LogOut" size={16} /> Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <section className={`rounded-3xl border p-6 shadow-sm ${panelClass}`}>
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#42B9D4]">Panel del dueno</p>
              <h1 className={`mt-2 text-3xl font-black ${darkMode ? 'text-white' : 'text-[#1E3F7A]'}`}>Monitor AGUA/24</h1>
              <p className={`mt-2 max-w-2xl text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>
                Cada maquina puede tener su propia vista, su propio QR y su propia telemetria.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {MONITOR_TABS.map((tab) => (
                  <Button
                    key={tab.key}
                    variant={activeTab === tab.key ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Icon name={tab.icon} size={15} /> {tab.label}
                  </Button>
                ))}
              </div>
              <div className="mt-5 max-w-md">
                <Select
                  label="Maquina a administrar"
                  options={machineSelectOptions}
                  value={selectedMachineId}
                  onChange={setSelectedMachineId}
                  placeholder="Selecciona una maquina"
                />
              </div>
            </div>

            <div className={`rounded-3xl border p-5 ${selectedMachineHasTelemetry ? (darkMode ? 'border-emerald-900 bg-emerald-950/40' : 'border-emerald-200 bg-emerald-50') : (darkMode ? 'border-amber-900 bg-amber-950/30' : 'border-amber-200 bg-amber-50')}`}>
              <div className="flex items-start gap-3">
                <Icon
                  name={selectedMachineHasTelemetry ? 'Wifi' : 'WifiOff'}
                  size={24}
                  className={selectedMachineHasTelemetry ? 'text-emerald-500' : 'text-amber-500'}
                />
                <div>
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-text-primary'}`}>{connectionHeadline}</p>
                  <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>{connectionSubtitle}</p>
                  <p className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>Administrando: {activeMachineLabel}</p>
                  <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-text-secondary'}`}>Hardware esperado: {selectedMachineHardwareId || 'Sin configurar'} · Hardware leido: {telemetryHardwareId || 'Sin lectura'}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {activeTab === 'overview' ? (
          <section className={`rounded-3xl border p-6 shadow-sm ${cardClass}`}>
            <SectionHeader eyebrow="Seccion 1" title="Operacion en vivo" description="Monitoreo, calibracion y control manual de la maquina seleccionada." darkMode={darkMode} />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Metric icon="ListChecks" label="Paso actual" value={`${currentStep.code}: ${currentStep.shortLabel || currentStep.label}`} hint={currentStep.instruction} darkMode={darkMode} />
              <Metric icon="Gauge" label="Caudalimetro" value={`${telemetry.flowmeterPulses ?? 0} pulsos`} hint={`${flowmeterLiters.toFixed(3)} litros estimados`} darkMode={darkMode} />
              <Metric icon="FlaskConical" label="pH" value={telemetry.phDecimal ?? '--'} hint={telemetry.phVoltage ? `${telemetry.phVoltage} V` : 'Sin voltaje'} darkMode={darkMode} />
              <Metric icon="Factory" label="Maquina administrada" value={activeMachineLabel} hint="Selecciona otra maquina desde la parte superior." darkMode={darkMode} />
            </div>

            <section className={`mt-5 rounded-3xl border p-5 ${cardClass}`}>
              <div className="mb-4">
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-text-primary'}`}>Actuadores</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <StatusPill active={telemetry.pumpOn} labelOn="Bomba encendida" labelOff="Bomba apagada" darkMode={darkMode} />
                <StatusPill active={telemetry.fillValveOn} labelOn="Llenado abierto" labelOff="Llenado cerrado" darkMode={darkMode} />
                <StatusPill active={telemetry.rinseValveOn} labelOn="Enjuague abierto" labelOff="Enjuague cerrado" darkMode={darkMode} />
              </div>
            </section>

            <section className={`mt-5 rounded-3xl border p-5 ${cardClass}`}>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
                <Input
                  label="Calibracion del caudalimetro"
                  type="number"
                  min="1"
                  step="1"
                  value={pulsesPerLiterInput}
                  onChange={(event) => setPulsesPerLiterInput(event.target.value)}
                  description="Pulsos necesarios para medir 1 litro."
                />
                <Button onClick={handleSavePulsesPerLiter}>
                  <Icon name="Save" size={16} /> Guardar calibracion
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {targetPulseOptions.map((option) => (
                  <div key={option.liters} className={`rounded-2xl border px-4 py-3 ${mutedClass}`}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-text-secondary'}`}>Meta {option.liters} L</p>
                    <p className={`mt-1 text-lg font-bold ${darkMode ? 'text-white' : 'text-text-primary'}`}>{option.pulses} pulsos</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <CommandGrid title="Control manual" description="Activa o apaga componentes de forma individual." commands={HARDWARE_COMMANDS} loadingAction={loadingAction} onCommand={handleCommand} darkMode={darkMode} />
              <CommandGrid title="Seguridad" description="Usalo para recuperar la maquina o apagar actuadores." commands={SAFETY_COMMANDS} loadingAction={loadingAction} onCommand={handleCommand} darkMode={darkMode} />
            </div>

            <section className={`mt-5 rounded-3xl border p-5 ${cardClass}`}>
              <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-text-primary'}`}>Trama y respuesta</h3>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div className={`rounded-2xl border p-4 ${mutedClass}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-text-secondary'}`}>Trama recibida</p>
                  <p className={`mt-2 break-all font-data text-sm ${darkMode ? 'text-white' : 'text-text-primary'}`}>{telemetry.rawFrame || 'Sin trama valida'}</p>
                  {telemetry.error ? <p className="mt-2 text-sm font-medium text-error">{telemetry.error}</p> : null}
                </div>
                <div className={`rounded-2xl border p-4 ${mutedClass}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-text-secondary'}`}>Ultimo comando</p>
                  {lastResponse ? (
                    <div className={`mt-2 space-y-1 text-sm ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>
                      <p>Accion: <span className={`font-semibold ${darkMode ? 'text-white' : 'text-text-primary'}`}>{lastResponse.action}</span></p>
                      <p>Comando: <span className={`font-semibold ${darkMode ? 'text-white' : 'text-text-primary'}`}>{lastResponse.commandLine || lastResponse.command}</span></p>
                      <p>Respuesta: <span className={`font-semibold ${darkMode ? 'text-white' : 'text-text-primary'}`}>{lastResponse.response || '-'}</span></p>
                    </div>
                  ) : (
                    <p className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>Sin comandos enviados.</p>
                  )}
                </div>
              </div>
            </section>
          </section>
        ) : null}

        {activeTab === 'machines' ? (
          <section className={`rounded-3xl border p-6 shadow-sm ${cardClass}`}>
            <SectionHeader eyebrow="Seccion 2" title="Administracion de maquinas" description="Aqui eliges la maquina del panel, configuras su estado y ves su sticker local." darkMode={darkMode} />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
              <div className={`rounded-3xl border p-4 ${mutedClass}`}>
                <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-text-primary'}`}>Alta o edicion</h3>
                <div className="mt-4 space-y-3">
                  <Input label="ID de maquina" value={machineForm.id} onChange={(event) => handleMachineChange('id', event.target.value)} />
                  <Input label="Nombre" value={machineForm.name} onChange={(event) => handleMachineChange('name', event.target.value)} />
                  <Input label="Ubicacion" value={machineForm.location} onChange={(event) => handleMachineChange('location', event.target.value)} />
                  <Input label="Direccion" value={machineForm.address} onChange={(event) => handleMachineChange('address', event.target.value)} />
                  <Input label="Hardware ID" value={machineForm.hardwareId} onChange={(event) => handleMachineChange('hardwareId', event.target.value)} />
                  <Select label="Estado" options={MACHINE_STATUS_OPTIONS} value={machineForm.status} onChange={(value) => handleMachineChange('status', value)} />
                  <label className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm ${darkMode ? 'bg-slate-950/70 text-white' : 'bg-white text-text-primary'}`}>
                    <input
                      type="checkbox"
                      checked={machineForm.isActive}
                      onChange={(event) => handleMachineChange('isActive', event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
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
                {displayedMachines.map((machine) => (
                  <article key={machine.id} className={`rounded-3xl border p-4 shadow-sm ${cardClass}`}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-text-primary'}`}>{machine.id}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${machine.isActive ? 'bg-success/10 text-success' : 'bg-slate-200 text-slate-600'}`}>
                            {machine.isActive ? 'Activa' : 'Inactiva'}
                          </span>
                          {machine.detectedOnly ? (
                            <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-sky-500">
                              Solo telemetria
                            </span>
                          ) : null}
                        </div>
                        <p className={`mt-1 text-sm ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>{machine.name || 'Sin nombre'} · {machine.location || 'Sin ubicacion'}</p>
                        <p className={`mt-1 text-sm ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>{machine.address || 'Sin direccion guardada'}</p>
                        <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-text-secondary'}`}>Hardware: {machine.hardwareId || machine.id || 'N/D'} · Estado: {machine.status || 'ONLINE'}</p>
                        {selectedMachineId === machine.id ? (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-sky-500">Maquina seleccionada en el panel del dueno</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleMachineEdit(machine)}>
                          <Icon name="Pencil" size={14} /> Editar
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setSelectedMachineId(machine.id)}>
                          <Icon name="Monitor" size={14} /> Administrar
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleGenerateQr(machine.id)} loading={qrLoadingId === machine.id} disabled={machine.detectedOnly}>
                          <Icon name="QrCode" size={14} /> QR
                        </Button>
                        <Button variant={machine.isActive ? 'warning' : 'success'} size="sm" onClick={() => handleMachineToggle(machine)} disabled={machine.detectedOnly}>
                          <Icon name={machine.isActive ? 'PauseCircle' : 'PlayCircle'} size={14} />
                          {machine.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {selectedMachine ? (
              <div className={`mt-6 rounded-3xl border p-5 ${mutedClass}`}>
                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="flex justify-center lg:justify-start">
                    <img
                      src={selectedMachine.stickerUrl ? `${API}${selectedMachine.stickerUrl}` : `${API}/stickers/${selectedMachine.id}.png`}
                      alt={`Sticker ${selectedMachine.id}`}
                      className="h-48 w-48 rounded-2xl border border-sky-100 bg-white p-2 object-contain"
                      onError={(event) => {
                        event.currentTarget.src = `${API}/stickers/AQ-001.png`;
                      }}
                    />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-text-primary'}`}>Sticker local de {selectedMachine.id}</h3>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>
                      Si existe `Backend/stickers/{selectedMachine.id}.png`, lo mostramos aqui. Si no, usamos `AQ-001.png`.
                    </p>
                    <p className={`mt-3 text-sm ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>
                      Esta vista ya funciona como pagina por maquina: seleccionas una y el panel superior queda apuntando a esa maquina.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {selectedQr ? (
              <div className={`mt-6 rounded-3xl border p-5 ${mutedClass}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-text-primary'}`}>QR generado de {selectedQr.machineId}</h3>
                    <p className={`mt-1 text-sm ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>{selectedQr.machineLocation || 'Sin ubicacion registrada'}</p>
                    <p className={`mt-2 break-all text-xs ${darkMode ? 'text-slate-400' : 'text-text-secondary'}`}>{selectedQr.deepUrl}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedQr(null)} className="text-sm font-semibold text-[#42B9D4]">
                    Cerrar
                  </button>
                </div>
                <div className="mt-4 flex justify-center md:justify-start">
                  <img src={selectedQr.qrPngDataUrl} alt={`QR ${selectedQr.machineId}`} className="h-48 w-48 rounded-2xl border border-sky-100 bg-white p-3" />
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {activeTab === 'promotions' ? (
          <section className={`rounded-3xl border p-6 shadow-sm ${cardClass}`}>
            <SectionHeader eyebrow="Seccion 3" title="Promociones y recompensas" description="Las deje mas claras para que se entiendan rapido." darkMode={darkMode} />

            <div className="mb-5 grid gap-4 md:grid-cols-3">
              <Metric icon="Sparkles" label="Promociones activas" value={monitorSummary.counts?.activePromotions || 0} hint="Las promociones 1, 2, 3 y 4 inician activas." darkMode={darkMode} />
              <Metric icon="Factory" label="Maquinas activas" value={monitorSummary.counts?.activeMachines || 0} hint={`${monitorSummary.counts?.machines || 0} maquinas registradas`} darkMode={darkMode} />
              <Metric icon="Gift" label="Puntos por litro" value={pointsPerLiterConfig} hint="Configurable para la promocion 4." darkMode={darkMode} />
            </div>

            <div className={`mb-5 rounded-3xl border p-4 ${mutedClass}`}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
                <Input
                  label="Puntos por litro"
                  type="number"
                  min="1"
                  value={pointsPerLiterConfig}
                  onChange={(event) => setPointsPerLiterConfig(event.target.value)}
                  description="Aqui controlas cuantos puntos genera cada litro consumido."
                />
                <Button onClick={handleSavePointsConfig} loading={promotionSavingKey === 'monthly_consumption_points'}>
                  <Icon name="Save" size={16} /> Guardar puntos/L
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {activePromotions.concat((monitorSummary.promotions || []).filter((promotion) => !promotion.isActive)).map((promotion) => (
                <article key={promotion.key} className={`rounded-3xl border p-4 shadow-sm ${cardClass}`}>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-text-primary'}`}>{promotion.sortOrder}. {promotion.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${promotion.isActive ? 'bg-success/10 text-success' : 'bg-slate-200 text-slate-600'}`}>
                          {promotion.isActive ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p className={`mt-2 text-sm font-medium ${darkMode ? 'text-slate-100' : 'text-text-primary'}`}>{promotion.summary || 'Sin resumen configurado'}</p>
                      <p className={`mt-2 text-sm leading-6 ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>{promotion.description || 'Sin descripcion configurada'}</p>
                      <div className={`mt-3 rounded-2xl border p-3 text-xs ${mutedClass}`}>
                        <p className={`font-semibold uppercase tracking-wide ${darkMode ? 'text-white' : 'text-text-primary'}`}>Configuracion</p>
                        <pre className={`mt-2 overflow-auto whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-text-secondary'}`}>{JSON.stringify(promotion.config || {}, null, 2)}</pre>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <Button
                        variant={promotion.isActive ? 'warning' : 'success'}
                        onClick={() => handlePromotionToggle(promotion)}
                        loading={promotionSavingKey === promotion.key}
                      >
                        <Icon name={promotion.isActive ? 'PauseCircle' : 'PlayCircle'} size={16} />
                        {promotion.isActive ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <NotificationToast />
    </div>
  );
}
