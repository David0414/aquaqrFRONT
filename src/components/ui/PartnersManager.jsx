import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Button from './Button';
import Input from './Input';
import Icon from '../AppIcon';
import { managementRequest } from '../../lib/management';

export default function PartnersManager({ machines, onChanged, darkMode }) {
  const { getToken } = useAuth();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [saving, setSaving] = useState('');
  const [notice, setNotice] = useState(null);
  const registeredMachines = machines.filter((machine) => !machine.detectedOnly);
  const card = darkMode ? 'border-slate-700 bg-slate-950 text-white' : 'border-sky-200 bg-white text-slate-900';
  const field = `h-11 w-full rounded-xl border px-3 text-sm ${darkMode ? 'border-slate-600 bg-slate-900 text-white' : 'border-sky-200 bg-white'}`;

  const loadPartners = useCallback(async () => {
    try {
      setLoading(true);
      const data = await managementRequest('/api/management/partners', getToken);
      setPartners(data.items || []);
    } catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setLoading(false); }
  }, [getToken]);
  useEffect(() => { loadPartners(); }, [loadPartners]);
  useEffect(() => {
    setPartnerId(machines.find((item) => item.id === selectedMachineId)?.partnerId || '');
  }, [machines, selectedMachineId]);

  const grantAccess = async (event) => {
    event.preventDefault(); setSaving('grant'); setNotice(null);
    try {
      const data = await managementRequest('/api/management/partners', getToken, { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
      setNotice({ text: `Acceso habilitado para ${data.partner.name || data.partner.email}. Ahora puedes asignarle una máquina.` });
      setEmail(''); await loadPartners();
    } catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setSaving(''); }
  };
  const saveAssignment = async (event) => {
    event.preventDefault(); if (!selectedMachineId) return;
    setSaving('assign'); setNotice(null);
    try {
      await managementRequest(`/api/management/machines/${encodeURIComponent(selectedMachineId)}/partner`, getToken, { method: 'PUT', body: JSON.stringify({ partnerId: partnerId || null }) });
      setNotice({ text: partnerId ? 'Máquina asignada. El socio ya puede administrarla desde su panel.' : 'Asignación retirada. La máquina sigue disponible para el administrador.' });
      await loadPartners(); await onChanged();
    } catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setSaving(''); }
  };
  const toggleAccess = async (partner) => {
    setSaving(partner.id); setNotice(null);
    try {
      await managementRequest(`/api/management/partners/${encodeURIComponent(partner.id)}/access`, getToken, { method: 'PUT', body: JSON.stringify({ active: !partner.managementAccessActive }) });
      setNotice({ text: partner.managementAccessActive ? 'Acceso suspendido. Las máquinas conservan su asignación.' : 'Acceso del socio reactivado.' });
      await loadPartners(); await onChanged();
    } catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setSaving(''); }
  };

  return (
    <section className="space-y-5">
      <div><h2 className="text-2xl font-black">Socios y sus máquinas</h2><p className={`mt-2 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>Habilita el acceso de cada socio y asigna las máquinas que puede administrar.</p></div>
      {notice ? <div role="alert" className={`rounded-xl border p-4 ${notice.error ? 'border-red-300 bg-red-50 text-red-800' : 'border-emerald-300 bg-emerald-50 text-emerald-900'}`}>{notice.text}</div> : null}
      <div className="grid gap-5 xl:grid-cols-2">
        <form onSubmit={grantAccess} className={`space-y-4 rounded-2xl border p-5 ${card}`}>
          <h3 className="flex items-center gap-2 text-lg font-bold"><Icon name="UserPlus" size={20} /> Dar acceso a un socio</h3>
          <p className="text-sm">El socio debe crear su cuenta y verificar su correo. Ingresará con esa misma cuenta.</p>
          <Input id="partner-email" label="Correo del socio" type="email" value={email} required inputClassName={field} onChange={(event) => setEmail(event.target.value)} placeholder="socio@ejemplo.com" />
          <Button type="submit" loading={saving === 'grant'} disabled={Boolean(saving)}>Habilitar acceso de socio</Button>
        </form>
        <form onSubmit={saveAssignment} className={`space-y-4 rounded-2xl border p-5 ${card}`}>
          <h3 className="flex items-center gap-2 text-lg font-bold"><Icon name="Factory" size={20} /> Asignar una máquina</h3>
          <div><label htmlFor="assignment-machine" className="mb-1 block text-sm font-medium">Máquina registrada</label>
            <select id="assignment-machine" className={field} required value={selectedMachineId} onChange={(event) => setSelectedMachineId(event.target.value)}>
              <option value="">Selecciona una máquina</option>
              {registeredMachines.map((machine) => <option key={machine.id} value={machine.id}>{machine.id} · {machine.name || machine.location || 'Sin nombre'}</option>)}
            </select>
          </div>
          <div><label htmlFor="assignment-partner" className="mb-1 block text-sm font-medium">Socio responsable</label>
            <select id="assignment-partner" className={field} value={partnerId} onChange={(event) => setPartnerId(event.target.value)} disabled={!selectedMachineId}>
              <option value="">Sin socio asignado</option>
              {partners.map((partner) => <option key={partner.id} value={partner.id} disabled={!partner.managementAccessActive}>{partner.name || partner.email || partner.id}{!partner.managementAccessActive ? ' (suspendido)' : ''}</option>)}
            </select>
          </div>
          {!registeredMachines.length ? <p className="text-sm">Primero registra una máquina en el apartado Máquinas.</p> : null}
          <Button type="submit" loading={saving === 'assign'} disabled={!selectedMachineId || Boolean(saving)}>Guardar asignación</Button>
        </form>
      </div>
      <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold">{partners.length} {partners.length === 1 ? 'socio registrado' : 'socios registrados'}</h3><Button variant="outline" size="sm" onClick={loadPartners} disabled={loading}>Actualizar</Button></div>
      {loading ? <p role="status">Cargando socios…</p> : !partners.length ? <div className={`rounded-2xl border p-6 ${card}`}>Aún no hay socios. Habilita la primera cuenta para empezar.</div> : (
        <div className="grid gap-4 xl:grid-cols-2">{partners.map((partner) => (
          <article key={partner.id} className={`rounded-2xl border p-5 ${card}`}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h4 className="break-words text-lg font-bold">{partner.name || partner.email || 'Socio'}</h4><p className="break-all text-sm">{partner.email}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${partner.managementAccessActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{partner.managementAccessActive ? 'Acceso activo' : 'Suspendido'}</span></div>
            <p className="mt-4 text-sm font-semibold">Máquinas asignadas: {partner.ownedMachines.length}</p>
            {partner.ownedMachines.length ? <ul className="mt-2 space-y-2 text-sm">{partner.ownedMachines.map((machine) => <li key={machine.id} className={`rounded-xl px-3 py-2 ${darkMode ? 'bg-slate-900' : 'bg-sky-50'}`}><strong>{machine.id}</strong> · {machine.name || machine.location || 'Sin nombre'}{!machine.isActive ? ' · Inactiva' : ''}</li>)}</ul> : <p className="mt-2 text-sm">Sin máquinas asignadas.</p>}
            <Button className="mt-4" variant={partner.managementAccessActive ? 'warning' : 'success'} size="sm" loading={saving === partner.id} disabled={Boolean(saving)} onClick={() => toggleAccess(partner)}>{partner.managementAccessActive ? 'Suspender acceso' : 'Reactivar acceso'}</Button>
          </article>
        ))}</div>
      )}
    </section>
  );
}
