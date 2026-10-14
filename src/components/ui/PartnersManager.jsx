import React, { useState } from 'react';
import Icon from '../AppIcon';
import ManagementDialog from '../../pages/water-monitor/ManagementDialog';

export default function PartnersManager({ partners, loading, request, onChanged, onOpenMachine }) {
  const [email, setEmail] = useState(''), [search, setSearch] = useState('');
  const [grantOpen, setGrantOpen] = useState(false), [saving, setSaving] = useState(''), [notice, setNotice] = useState(null);
  const visible = partners.filter((partner) => `${partner.name || ''} ${partner.email || ''}`.toLowerCase().includes(search.toLowerCase()));
  const grant = async (event) => {
    event.preventDefault(); if (saving) return;
    setSaving('grant'); setNotice(null);
    try {
      const data = await request('/api/management/partners', { method: 'POST', body: JSON.stringify({ email: email.trim() }) });
      await onChanged(); setGrantOpen(false); setEmail('');
      setNotice({ text: `Acceso habilitado para ${data.partner.name || data.partner.email}. Abre una máquina para asignársela.` });
    } catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setSaving(''); }
  };
  const toggle = async (partner) => {
    if (saving) return;
    setSaving(partner.id); setNotice(null);
    try {
      await request(`/api/management/partners/${encodeURIComponent(partner.id)}/access`, { method: 'PUT', body: JSON.stringify({ active: !partner.managementAccessActive }) });
      await onChanged();
      setNotice({ text: partner.managementAccessActive ? 'Acceso suspendido. Sus máquinas conservan la asignación.' : 'El socio ya puede acceder nuevamente a sus máquinas.' });
    } catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setSaving(''); }
  };
  return <section className="m-directory"><div className="m-page-heading"><div><p className="m-kicker">ADMINISTRACIÓN DE ACCESOS</p><h1>Socios y sus máquinas</h1><p>Habilita sus cuentas y consulta qué máquinas administra cada uno.</p></div><button className="m-button m-primary" onClick={() => { setNotice(null); setGrantOpen(true); }}><Icon name="UserPlus" size={17} />Dar acceso a un socio</button></div>
    {notice && !grantOpen && <p className={`m-notice ${notice.error ? 'm-error' : 'm-success'}`} role={notice.error ? 'alert' : 'status'}>{notice.text}</p>}
    <div className="m-list-toolbar"><label className="m-search"><Icon name="Search" size={18} /><input aria-label="Buscar socio" placeholder="Buscar por nombre o correo" value={search} onChange={(event) => setSearch(event.target.value)} /></label><span>{visible.length} {visible.length === 1 ? 'socio' : 'socios'}</span></div>
    {loading ? <div className="m-empty" role="status">Cargando socios…</div> : !visible.length ? <div className="m-empty"><Icon name="Users" size={34} /><h2>{search ? 'Sin coincidencias' : 'Todavía no hay socios'}</h2><p>{search ? 'Prueba otro nombre o correo.' : 'Da acceso a una cuenta y después asígnale sus máquinas.'}</p></div> : <div className="m-partner-grid">{visible.map((partner) => <article className="m-surface m-partner-card" key={partner.id}>
      <div className="m-partner-heading"><span className="m-avatar">{(partner.name || partner.email || 'SO').slice(0, 2).toUpperCase()}</span><div><h2>{partner.name || 'Socio'}</h2><p>{partner.email || 'Sin correo registrado'}</p></div><span className={`m-badge ${partner.managementAccessActive ? 'm-green' : 'm-amber'}`}>{partner.managementAccessActive ? 'Acceso activo' : 'Suspendido'}</span></div>
      <div className="m-partner-machines"><p>{(partner.ownedMachines || []).length} máquinas asignadas</p>{partner.ownedMachines?.length ? partner.ownedMachines.map((machine) => <button className="m-owner-machine" key={machine.id} onClick={() => onOpenMachine(machine.id)} disabled={Boolean(saving)}><Icon name="Box" size={18} /><span>{machine.name || machine.id}<small>{machine.id}</small></span><Icon name="ArrowUpRight" size={17} /></button>) : <div className="m-partner-empty">Sin máquinas asignadas. Asigna una desde su ficha.</div>}</div>
      <button className={`m-button ${partner.managementAccessActive ? 'm-danger-soft' : 'm-primary'}`} onClick={() => toggle(partner)} disabled={Boolean(saving)}>{saving === partner.id ? 'Guardando…' : partner.managementAccessActive ? 'Suspender acceso' : 'Reactivar acceso'}</button>
    </article>)}</div>}
    {grantOpen && <ManagementDialog title="Dar acceso a un socio" description="El socio debe tener una cuenta creada con su correo verificado." busy={Boolean(saving)} onClose={() => setGrantOpen(false)}>
      {notice?.error && <p role="alert" className="m-notice m-error">{notice.text}</p>}<form onSubmit={grant}><label className="m-field" htmlFor="partner-email"><span>Correo del socio</span><input className="m-input" id="partner-email" type="email" placeholder="socio@ejemplo.com" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={Boolean(saving)} /></label><p className="m-description">Entrará al panel de socios con ese correo. Podrás asignarle una o varias máquinas.</p><div className="m-dialog-actions"><button className="m-button" type="button" disabled={Boolean(saving)} onClick={() => setGrantOpen(false)}>Cancelar</button><button className="m-button m-primary" type="submit" disabled={Boolean(saving)}>{saving ? 'Habilitando…' : 'Habilitar acceso de socio'}</button></div></form>
    </ManagementDialog>}
  </section>;
}
