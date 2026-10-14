import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { managementRequest } from '../../lib/management';
import { calibrationFromOffset, offsetFromCalibration } from '../../lib/calibration.mjs';
import { showErrorToast, showSuccessToast } from '../../components/ui/NotificationToast';

export const hardwareId = (value) => String(value || '').toUpperCase().replace(/[^0-9A-F]/g, '').padStart(2, '0').slice(-2);
export const money = (cents) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(cents || 0) / 100);

export default function useMachineManagement(machineId) {
  const { getToken } = useAuth();
  const request = useCallback((path, options) => managementRequest(path, getToken, options), [getToken]);
  const [summary, setSummary] = useState({ machines: [], promotions: [], counts: {} });
  const machine = summary.machines.find((item) => item.id === machineId) || null;
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [telemetry, setTelemetry] = useState(null), [calibration, setCalibration] = useState(null);
  const [configError, setConfigError] = useState(''), [offset, setOffset] = useState('0');
  const [busy, setBusy] = useState(''), [lastCommand, setLastCommand] = useState(null);
  const inFlight = useRef(false), selectedId = useRef(machine?.id), loadSequence = useRef(0);
  selectedId.current = machine?.id;

  const refresh = useCallback(async () => {
    const sequence = ++loadSequence.current;
    try {
      const data = await request('/api/monitor-admin/summary');
      if (sequence === loadSequence.current) { setSummary(data); setError(''); }
      return data;
    } catch (failure) { if (sequence === loadSequence.current) setError(failure.message); }
    finally { if (sequence === loadSequence.current) setLoading(false); }
  }, [request]);
  useEffect(() => { refresh(); return () => { loadSequence.current++; }; }, [refresh]);

  useEffect(() => {
    setTelemetry(null); setCalibration(null); setConfigError(''); setOffset('0'); setLastCommand(null);
    if (!machine) return undefined;
    const controller = new AbortController();
    const id = machine.id;
    const query = new URLSearchParams({ machineId: id, hardwareId: hardwareId(machine.hardwareId || id) });
    request(`/api/dispense/config?${query}`, { signal: controller.signal }).then((data) => {
      if (controller.signal.aborted || selectedId.current !== id) return;
      if (!data.pulsesPerLiter) throw new Error('No se pudo cargar el ajuste de esta máquina.');
      const base = Number(data.defaultPulsesPerLiter) || 360;
      setCalibration({ machineId: id, pulsesPerLiter: Number(data.pulsesPerLiter), base });
      setOffset(String(offsetFromCalibration(data.pulsesPerLiter, base)));
    }).catch((failure) => { if (!controller.signal.aborted) setConfigError(failure.message); });
    return () => controller.abort();
  }, [request, machine?.id, machine?.hardwareId]);

  useEffect(() => {
    if (!machine) return undefined;
    const controller = new AbortController();
    let polling = false;
    const id = machine.id;
    const poll = async () => {
      if (polling || document.visibilityState === 'hidden') return;
      polling = true;
      try {
        const data = await request(`/api/telemetry/machine/${encodeURIComponent(id)}`, { signal: controller.signal });
        if (!controller.signal.aborted && selectedId.current === id) setTelemetry({ ...data, requestedMachineId: id });
      } catch (failure) {
        if (!controller.signal.aborted && selectedId.current === id) setTelemetry((current) => ({ ...current, machineOnline: false, error: failure.message }));
      } finally { polling = false; }
    };
    poll();
    const timer = window.setInterval(poll, 2000);
    document.addEventListener('visibilitychange', poll);
    return () => { controller.abort(); window.clearInterval(timer); document.removeEventListener('visibilitychange', poll); };
  }, [request, machine?.id]);

  const command = async (action, label) => {
    if (!machine || calibration?.machineId !== machine.id || inFlight.current) return;
    inFlight.current = true; setBusy(action);
    const target = machine;
    try {
      const result = await request('/api/dispense/demo/control', { method: 'POST', body: JSON.stringify({
        action, management: true, machineId: target.id, machineLocation: target.location,
        hardwareId: hardwareId(target.hardwareId || target.id), pulsesPerLiter: calibration.pulsesPerLiter,
      }) });
      if (selectedId.current === target.id) setLastCommand({ ...result, label, at: Date.now() });
      showSuccessToast(`${label}: solicitud enviada a ${target.name || target.id}.`);
    } catch (failure) { showErrorToast(failure.message); }
    finally { inFlight.current = false; setBusy(''); }
  };

  const saveOffset = async () => {
    if (!machine || calibration?.machineId !== machine.id || inFlight.current) return;
    const target = machine;
    inFlight.current = true; setBusy('calibration');
    try {
      const pulsesPerLiter = calibrationFromOffset(offset, calibration.base);
      const data = await request('/api/dispense/config/pulses', { method: 'POST', body: JSON.stringify({
        machineId: target.id, hardwareId: hardwareId(target.hardwareId || target.id), pulsesPerLiter,
      }) });
      if (selectedId.current === target.id) {
        const saved = Number(data.pulsesPerLiter) || pulsesPerLiter;
        setCalibration({ ...calibration, pulsesPerLiter: saved });
        setOffset(String(offsetFromCalibration(saved, calibration.base)));
      }
      showSuccessToast(`Desfase guardado en ${target.name || target.id}.`);
    } catch (failure) { showErrorToast(failure.message); }
    finally { inFlight.current = false; setBusy(''); }
  };

  const expectedHardware = machine && hardwareId(machine.hardwareId || machine.id);
  const updatePremium = (id, info) => setSummary((current) => {
    const machines = current.machines.map((item) => item.id === id ? { ...item, premium: { active: info.active, endsAt: info.endsAt } } : item);
    return { ...current, machines, counts: { ...current.counts, premiumActiveMachines: machines.filter((item) => item.premium?.active).length } };
  });
  const visibleTelemetry = telemetry?.requestedMachineId === machine?.id ? telemetry : null;
  const online = Boolean(visibleTelemetry?.machineOnline && telemetry.lastSeenAt
    && hardwareId(telemetry.hardwareId || telemetry.machineHardwareId) === expectedHardware
    && Date.now() - new Date(telemetry.lastSeenAt).getTime() < 15000);
  return { machine, request, summary, loading, error, refresh, updatePremium, telemetry: visibleTelemetry, online,
    calibration: calibration?.machineId === machine?.id ? calibration : null, configError, offset, setOffset, busy, command, lastCommand, saveOffset };
}
