import React, { useEffect, useState } from 'react';
import Icon from '../../components/AppIcon';
import ManagementDialog from './ManagementDialog';

const initialForm = (machine) => ({ id: machine?.id || '', name: machine?.name || '', location: machine?.location || '',
  address: machine?.address || '', hardwareId: machine?.hardwareId || '', pricePerGarrafon: ((machine?.pricePerGarrafonCents ?? 3500) / 100).toFixed(2),
  status: machine?.status || 'ONLINE', isActive: machine?.isActive !== false, coinsEnabled: Boolean(machine?.coinsEnabled) });

export default function MachineSettings({ machine, isAdmin, request, onSaved, onBusyChange, creating = false, existingIds = [] }) {
  const [form, setForm] = useState(() => initialForm(machine));
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [deleting, setDeleting] = useState(false);
  useEffect(() => { setForm(initialForm(machine)); setError(''); }, [machine?.id]);
  useEffect(() => { onBusyChange?.(busy); return () => onBusyChange?.(false); }, [busy, onBusyChange]);
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const save = async (event) => {
    event.preventDefault(); if (busy) return;
    const id = form.id.trim().toUpperCase();
    if (creating && existingIds.includes(id)) { setError('Ese identificador ya existe. Abre esa máquina para editarla.'); return; }
    setBusy(true); setError('');
    try {
      const payload = { ...form, id };
      if (!isAdmin) { delete payload.coinsEnabled; delete payload.hardwareId; }
      const data = await request(`/api/monitor-admin/machines${creating || machine?.detectedOnly ? '' : `/${encodeURIComponent(machine.id)}`}`, {
        method: creating || machine?.detectedOnly ? 'POST' : 'PUT', body: JSON.stringify(payload),
      });
      await onSaved(data.machine.id);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const remove = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await request(`/api/monitor-admin/machines/${encodeURIComponent(machine.id)}`, { method: 'DELETE' }); setDeleting(false); await onSaved(null); }
    catch (failure) { setError(failure.message); setDeleting(false); }
    finally { setBusy(false); }
  };
  return <section className="m-surface m-settings"><div className="m-section-title"><span className="m-feature-icon"><Icon name="PencilLine" size={20} /></span><div><h2>{creating ? 'Registra tu máquina' : 'Datos y precio de la máquina'}</h2><p>{creating ? 'Identifica la máquina y define su precio de venta.' : `Los cambios se guardan únicamente en ${machine.id}.`}</p></div></div>
    {error && <p role="alert" className="m-notice m-error">{error}</p>}
    <form onSubmit={save} className="m-form-grid">
      {creating && <label className="m-field"><span>Identificador de la máquina</span><input className="m-input" required pattern="[A-Za-z0-9_-]+" value={form.id} onChange={(event) => change('id', event.target.value)} placeholder="Ej. AQ-003" disabled={busy} /></label>}
      <label className="m-field"><span>Nombre de la máquina</span><input className="m-input" required value={form.name} onChange={(event) => change('name', event.target.value)} placeholder="Ej. Sucursal Centro" disabled={busy} /></label>
      <label className="m-field"><span>Ubicación visible para el cliente</span><input className="m-input" value={form.location} onChange={(event) => change('location', event.target.value)} placeholder="Ej. Plaza Norte, local 15" disabled={busy} /></label>
      <label className="m-field m-span-all"><span>Dirección</span><input className="m-input" value={form.address} onChange={(event) => change('address', event.target.value)} placeholder="Calle, número y colonia" disabled={busy} /></label>
      <label className="m-field"><span>Precio del garrafón de 20 L (MXN)</span><input className="m-input" type="number" min="0.01" step="0.01" required value={form.pricePerGarrafon} onChange={(event) => change('pricePerGarrafon', event.target.value)} disabled={busy} /><small>Se usa para cobrar el agua y calcular los paquetes de clientes.</small></label>
      <label className="m-field"><span>Estado operativo</span><select className="m-input" value={form.status} onChange={(event) => change('status', event.target.value)} disabled={busy}>{[['ONLINE', 'Disponible'], ['OFFLINE', 'Fuera de servicio'], ['MAINTENANCE', 'En mantenimiento'], ['INSTALLING', 'En instalación']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><small>Este estado organiza el catálogo; la conexión se consulta en tiempo real.</small></label>
      <label className="m-check-field m-span-all"><input type="checkbox" checked={form.isActive} onChange={(event) => change('isActive', event.target.checked)} disabled={busy} /><div><strong>Habilitada para clientes</strong><span>Permite que los clientes utilicen esta máquina.</span></div></label>
      {isAdmin && <><label className="m-check-field m-span-all"><input type="checkbox" checked={form.coinsEnabled} onChange={(event) => change('coinsEnabled', event.target.checked)} disabled={busy} /><div><strong>Aceptar monedas</strong><span>Habilita el registro de recargas con monedas en esta máquina.</span></div></label>
        <details className="m-diagnostics m-span-all" open={creating}><summary>Identificación técnica <Icon name="ChevronDown" size={16} /></summary><label className="m-field"><span>Identificador del controlador (hardware)</span><input className="m-input" pattern="[A-Fa-f0-9]{1,2}" maxLength={2} value={form.hardwareId} onChange={(event) => change('hardwareId', event.target.value)} placeholder="Ej. 01" disabled={busy} /><small>Debe corresponder al controlador físico instalado.</small></label></details></>}
      <div className="m-form-actions m-span-all"><span>{creating ? 'Podrás asignar un socio después de registrarla.' : `Máquina ${machine.id}`}</span><button className="m-button m-primary" type="submit" disabled={busy}><Icon name="Save" size={17} />{busy ? 'Guardando…' : creating || machine?.detectedOnly ? 'Registrar máquina' : 'Guardar cambios'}</button></div>
    </form>
    {isAdmin && !creating && !machine.detectedOnly && <details className="m-danger-zone"><summary>Eliminar esta máquina</summary><p>Las máquinas con historial de pagos deben desactivarse para conservar sus registros.</p><button className="m-button m-danger-soft" disabled={busy} onClick={() => setDeleting(true)}><Icon name="Trash2" size={16} />Eliminar máquina</button></details>}
    {deleting && <ManagementDialog title={`Eliminar ${machine.id}`} description="Se eliminará del catálogo. Esta acción no se puede deshacer." busy={busy} onClose={() => setDeleting(false)}><div className="m-dialog-actions"><button className="m-button" disabled={busy} onClick={() => setDeleting(false)}>Conservar máquina</button><button className="m-button m-danger" disabled={busy} onClick={remove}>{busy ? 'Eliminando…' : 'Confirmar eliminación'}</button></div></ManagementDialog>}
  </section>;
}

export function MachineAssignment({ machine, partners, request, onSaved, onBusyChange }) {
  const [partnerId, setPartnerId] = useState(machine.partnerId || ''), [busy, setBusy] = useState(false), [error, setError] = useState('');
  useEffect(() => { setPartnerId(machine.partnerId || ''); }, [machine.id, machine.partnerId]);
  useEffect(() => { onBusyChange?.(busy); return () => onBusyChange?.(false); }, [busy, onBusyChange]);
  const save = async (event) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try { await request(`/api/management/machines/${encodeURIComponent(machine.id)}/partner`, { method: 'PUT', body: JSON.stringify({ partnerId: partnerId || null }) }); await onSaved(machine.id); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <section className="m-surface m-assignment"><div className="m-section-title"><span className="m-feature-icon"><Icon name="UserRoundCheck" size={21} /></span><div><h2>Socio responsable</h2><p>Decide quién puede administrar {machine.name || machine.id}.</p></div></div>
    <div className="m-current-owner"><span className="m-avatar">{(machine.partner?.name || machine.partner?.email || '—').slice(0, 2).toUpperCase()}</span><div><span>Asignación actual</span><strong>{machine.partner?.name || machine.partner?.email || 'Sin socio asignado'}</strong><p>{machine.partner?.email || 'Por ahora, solo la administra el administrador.'}</p></div></div>
    {error && <p role="alert" className="m-notice m-error">{error}</p>}
    {machine.detectedOnly ? <p className="m-notice">Registra la máquina en Datos y precio antes de asignarla.</p> : <form onSubmit={save} className="m-assignment-form"><label className="m-field" htmlFor="assignment-partner"><span>Asignar a un socio</span><select id="assignment-partner" className="m-input" value={partnerId} onChange={(event) => setPartnerId(event.target.value)} disabled={busy}><option value="">Sin socio asignado</option>{partners.map((partner) => <option key={partner.id} value={partner.id} disabled={!partner.managementAccessActive}>{partner.name || partner.email}{!partner.managementAccessActive ? ' · Acceso suspendido' : ''}</option>)}</select><small>El socio tendrá acceso a los controles de esta máquina. Premium se mantiene ligado a la máquina.</small></label><button type="submit" className="m-button m-primary" disabled={busy || partnerId === (machine.partnerId || '')}><Icon name="UserRoundCheck" size={17} />{busy ? 'Guardando…' : 'Guardar asignación'}</button></form>}
  </section>;
}
