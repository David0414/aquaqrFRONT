import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, useClerk } from '@clerk/clerk-react';
import Agua24Brand from '../../components/Agua24Brand';
import Icon from '../../components/AppIcon';
import NotificationToast, { showSuccessToast } from '../../components/ui/NotificationToast';
import { useManagementAccess } from '../../components/ui/ManagementGuard';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';
import { clearAdminSession } from '../../lib/management';
import PartnersManager from '../../components/ui/PartnersManager';
import MachinePremiumPanel from '../../components/ui/MachinePremiumPanel';
import useMachineManagement, { money } from './useMachineManagement';
import MachineModel from './MachineModel';
import MachineControls from './MachineControls';
import MachineSettings, { MachineAssignment } from './MachineSettings';
import ManagementDialog from './ManagementDialog';
import { MachineQr, PremiumRates, PromotionSettings } from './ManagementCatalogs';
import './management.css';

const THEME_KEY = 'agua24-monitor-dark-mode';
const sections = [
  { key: 'controls', label: 'Controles', icon: 'SlidersHorizontal' },
  { key: 'premium', label: 'Premium y estadísticas', icon: 'Crown' },
  { key: 'settings', label: 'Datos y precio', icon: 'PencilLine' },
  { key: 'qr', label: 'Código QR', icon: 'QrCode' },
];
const adminPages = [{ key: 'machines', label: 'Máquinas', icon: 'Boxes' }, { key: 'partners', label: 'Socios', icon: 'Users' },
  { key: 'rates', label: 'Tarifas Premium', icon: 'Crown' }, { key: 'promotions', label: 'Promociones', icon: 'Gift' }];

export default function WaterMonitor() {
  const navigate = useNavigate(), location = useLocation();
  const { isSignedIn } = useAuth(), { signOut } = useClerk();
  const access = useManagementAccess(), isAdmin = access?.role === 'ADMIN';
  const { setTelemetryEnabled } = useDispenseFlow();
  const params = new URLSearchParams(location.search);
  const page = isAdmin && ['partners', 'rates', 'promotions'].includes(params.get('view')) ? params.get('view') : 'machines';
  const selectedId = page === 'machines' ? params.get('machineId') : null;
  const section = params.get('premiumPayment') ? 'premium' : ['controls', 'premium', 'settings', 'qr', ...(isAdmin ? ['assignment'] : [])].includes(params.get('section')) ? params.get('section') : 'controls';
  const ops = useMachineManagement(selectedId), { machine, summary, request } = ops;
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'true');
  const [partners, setPartners] = useState([]), [partnersLoading, setPartnersLoading] = useState(isAdmin), [partnersError, setPartnersError] = useState('');
  const [search, setSearch] = useState(''), [filter, setFilter] = useState('all'), [listPage, setListPage] = useState(1);
  const [formBusy, setFormBusy] = useState(false), [premiumBusy, setPremiumBusy] = useState(false), [createOpen, setCreateOpen] = useState(false);
  const blocked = Boolean(ops.busy) || formBusy || premiumBusy;
  useEffect(() => { setTelemetryEnabled(false); return () => setTelemetryEnabled(false); }, [setTelemetryEnabled]);
  useEffect(() => { localStorage.setItem(THEME_KEY, String(darkMode)); }, [darkMode]);
  const loadPartners = useCallback(async () => {
    if (!isAdmin) return;
    try { const data = await request('/api/management/partners'); setPartners(data.items || []); setPartnersError(''); }
    catch (error) { setPartnersError(error.message); }
    finally { setPartnersLoading(false); }
  }, [isAdmin, request]);
  useEffect(() => { loadPartners(); }, [loadPartners]);
  const refreshAll = async () => { await Promise.all([ops.refresh(), loadPartners()]); };
  const go = (view = 'machines', id, nextSection = 'controls', replace = false) => {
    if (blocked) return;
    const next = new URLSearchParams();
    if (view !== 'machines') next.set('view', view);
    if (id) { next.set('machineId', id); next.set('section', nextSection); }
    navigate(`${location.pathname}${next.size ? `?${next}` : ''}`, { replace });
  };
  const saved = async (id) => {
    await refreshAll(); setCreateOpen(false);
    const next = new URLSearchParams();
    if (id) { next.set('machineId', id); next.set('section', 'settings'); }
    navigate(`${location.pathname}${next.size ? `?${next}` : ''}`, { replace: true });
    showSuccessToast(id ? `Cambios guardados en ${id}.` : 'Máquina eliminada del catálogo.');
  };
  const assigned = async () => { await refreshAll(); showSuccessToast('Socio responsable actualizado.'); };
  const logout = async () => { if (blocked) return; clearAdminSession(); if (isSignedIn) await signOut(); navigate(isAdmin ? '/user-login?panel=1&access=admin' : '/partner-login', { replace: true }); };
  const filtered = useMemo(() => summary.machines.filter((item) => {
    const text = `${item.id} ${item.name || ''} ${item.location || ''} ${item.partner?.name || ''} ${item.partner?.email || ''}`.toLowerCase();
    return text.includes(search.trim().toLowerCase()) && (filter === 'all' || filter === 'premium' && item.premium?.active || filter === 'unassigned' && !item.partnerId || filter === 'active' && item.isActive);
  }), [summary.machines, search, filter]);
  useEffect(() => { setListPage(1); }, [search, filter]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 6)), currentListPage = Math.min(listPage, pageCount);
  const listed = filtered.slice((currentListPage - 1) * 6, currentListPage * 6);
  const fleet = summary.machines, totalPremium = fleet.filter((item) => item.premium?.active).length;
  const owner = machine?.partner?.name || machine?.partner?.email || 'Sin socio asignado';
  const visibleSections = isAdmin ? [...sections, { key: 'assignment', label: 'Socio responsable', icon: 'UserRoundCheck' }] : sections;
  const navigation = isAdmin ? adminPages : [{ key: 'machines', label: 'Mis máquinas', icon: 'Boxes' }];

  return <div className={`management-panel management-workspace ${darkMode ? 'management-dark' : 'management-light'}`}>
    <aside className="m-sidebar"><div className="m-brand"><Agua24Brand className="m-brand-logo" showTagline={false} /></div><div className="m-workspace-label"><span className="m-workspace-dot" />{isAdmin ? 'Administración' : 'Espacio de socio'}</div>
      <nav className="m-sidebar-nav" aria-label={isAdmin ? 'Panel de administrador' : 'Panel de socio'}>{navigation.map((item) => <button key={item.key} className={page === item.key ? 'is-current' : ''} aria-current={page === item.key ? 'page' : undefined} onClick={() => go(item.key)} disabled={blocked}><Icon name={item.icon} size={20} /><span>{item.label}</span>{item.key === 'machines' && <small>{fleet.length}</small>}</button>)}</nav>
      <div className="m-sidebar-note"><Icon name={isAdmin ? 'ShieldCheck' : 'Sparkles'} size={24} /><h2>{isAdmin ? 'Todo, por máquina.' : 'Tu operación, clara.'}</h2><p>{isAdmin ? 'Abre una máquina para editarla, controlar sus componentes o asignar su socio.' : 'Tus controles siempre están incluidos. Premium agrega estadísticas a cada máquina.'}</p></div>
      <div className="m-sidebar-account"><span className="m-avatar">{(access?.name || (isAdmin ? 'AD' : 'SO')).slice(0, 2).toUpperCase()}</span><div><strong>{access?.name || (isAdmin ? 'Administrador' : 'Socio')}</strong><span>{isAdmin ? 'Acceso administrativo' : 'Solo tus máquinas'}</span></div></div>
    </aside>
    <div className="m-main-shell"><header className="m-topbar"><div><Icon name={isAdmin ? 'ShieldCheck' : 'LayoutDashboard'} size={17} /><span>{isAdmin ? 'Panel de administrador' : 'Panel de socio'}</span><span className="m-topbar-divider">/</span><strong>{machine?.name || navigation.find((item) => item.key === page)?.label}</strong></div><div className="m-topbar-actions"><button className="m-icon-button" onClick={refreshAll} disabled={blocked} aria-label="Actualizar panel" title="Actualizar panel"><Icon name="RefreshCw" size={18} /></button><button className="m-icon-button" onClick={() => setDarkMode((value) => !value)} aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} title={darkMode ? 'Tema claro' : 'Tema oscuro'}><Icon name={darkMode ? 'Sun' : 'Moon'} size={18} /></button><button className="m-button m-logout" onClick={logout} disabled={blocked}><Icon name="LogOut" size={16} /><span>Salir</span></button></div></header>
      <main className="m-main" id="management-content">
        {ops.error && <p role="alert" className="m-notice m-error">{ops.error} <button onClick={ops.refresh}>Reintentar</button></p>}
        {partnersError && isAdmin && <p role="alert" className="m-notice m-error">{partnersError} <button onClick={loadPartners}>Reintentar cargar socios</button></p>}
        {page === 'machines' && !selectedId && <div className="m-page-enter" key="fleet"><section className="m-fleet-hero"><div><p className="m-kicker">{isAdmin ? 'CENTRO DE OPERACIONES' : 'BIENVENIDO A TU ESPACIO'}</p><h1>{isAdmin ? 'Cada máquina, en orden.' : 'Tus máquinas, bajo control.'}</h1><p>{isAdmin ? 'Abre una máquina para ver sus controles, editarla o asignar su socio responsable.' : 'Elige una máquina para controlarla, ajustar su agua o consultar su Premium.'}</p></div><div className="m-hero-art" aria-hidden="true"><span className="m-orbit m-orbit-one" /><span className="m-orbit m-orbit-two" /><MachineModel machine={fleet[0] || { id: 'AGUA/24' }} /><span className="m-hero-art-caption"><Icon name="Droplets" size={16} />AGUA / 24 · Conectada contigo</span></div></section>
          <div className="m-fleet-counters"><div><Icon name="Boxes" size={21} /><span>{isAdmin ? 'Máquinas en tu operación' : 'Máquinas asignadas'}<strong>{fleet.length}</strong></span></div><div><Icon name="BadgeCheck" size={21} /><span>Habilitadas para clientes<strong>{fleet.filter((item) => item.isActive).length}</strong></span></div><div><Icon name={isAdmin ? 'UserRoundCheck' : 'Crown'} size={21} /><span>{isAdmin ? 'Sin socio asignado' : 'Con Premium activo'}<strong>{isAdmin ? fleet.filter((item) => !item.partnerId).length : totalPremium}</strong></span></div></div>
          <div className="m-fleet-title"><div><h2>{isAdmin ? 'Todas las máquinas' : 'Mis máquinas'}</h2><p>Abre una ficha para ver sus funciones y configuración.</p></div>{isAdmin ? <button className="m-button m-primary" onClick={() => setCreateOpen(true)}><Icon name="Plus" size={17} />Registrar máquina</button> : <span>{filtered.length} {filtered.length === 1 ? 'máquina' : 'máquinas'}</span>}</div>
          <div className="m-list-toolbar"><label className="m-search"><Icon name="Search" size={18} /><input aria-label="Buscar máquina" placeholder={isAdmin ? 'Máquina, ubicación o socio' : 'Busca tu máquina o ubicación'} value={search} onChange={(event) => setSearch(event.target.value)} /></label><div className="m-filter-group" aria-label="Filtrar máquinas">{[['all', 'Todas'], ['active', 'Habilitadas'], [isAdmin ? 'unassigned' : 'premium', isAdmin ? 'Sin socio' : 'Premium']].map(([key, label]) => <button key={key} aria-pressed={filter === key} className={filter === key ? 'is-current' : ''} onClick={() => setFilter(key)}>{label}</button>)}</div></div>
          {ops.loading ? <div className="m-machine-grid" role="status" aria-label="Cargando máquinas">{[1, 2, 3].map((key) => <div key={key} className="m-machine-skeleton" />)}</div> : !listed.length ? <div className="m-empty"><Icon name="Boxes" size={38} /><h2>{fleet.length ? 'No encontramos esa máquina' : isAdmin ? 'Registra tu primera máquina' : 'Aún no tienes máquinas asignadas'}</h2><p>{fleet.length ? 'Cambia tu búsqueda o el filtro.' : isAdmin ? 'Añade una máquina y después asígnala a su socio responsable.' : 'El administrador debe asignarte una máquina para que aparezca aquí.'}</p></div> : <div className="m-machine-grid">{listed.map((item, index) => <button key={item.id} className="m-machine-card" aria-label={`Administrar ${item.name || item.id} · ${item.id}`} onClick={() => go('machines', item.id, item.detectedOnly ? 'settings' : 'controls')} style={{ '--card-order': index }}><div className="m-machine-card-art"><span className={`m-badge ${item.isActive ? 'm-green' : 'm-amber'}`}>{item.detectedOnly ? 'Por registrar' : item.isActive ? 'Habilitada' : 'Pausada'}</span><MachineModel machine={item} compact /><span className="m-machine-card-id">{item.id}</span></div><div className="m-machine-card-body"><div><h3>{item.name || `Máquina ${item.id}`}</h3><Icon name="ArrowUpRight" size={19} /></div><p><Icon name="MapPin" size={14} />{item.location || 'Ubicación por definir'}</p><div className="m-machine-card-meta"><span>{money(item.pricePerGarrafonCents)}<small>/ 20 L</small></span><span className={`m-badge ${item.premium?.active ? 'm-gold' : ''}`}><Icon name={item.premium?.active ? 'Crown' : 'SlidersHorizontal'} size={13} />{item.premium ? item.premium.active ? 'Premium activo' : 'Acceso normal' : 'Consultar Premium'}</span></div>{isAdmin && <div className="m-machine-card-owner"><Icon name="UserRound" size={15} /><span>{item.partner?.name || item.partner?.email || 'Sin socio asignado'}</span></div>}<span className="m-machine-card-action">Administrar máquina <Icon name="ArrowRight" size={15} /></span></div></button>)}</div>}
          {pageCount > 1 && <div className="m-pagination"><button className="m-button" disabled={currentListPage === 1} onClick={() => setListPage(currentListPage - 1)}>Anterior</button><span>Página {currentListPage} de {pageCount}</span><button className="m-button" disabled={currentListPage === pageCount} onClick={() => setListPage(currentListPage + 1)}>Siguiente</button></div>}
        </div>}
        {page === 'machines' && selectedId && (ops.loading ? <div className="m-empty" role="status">Abriendo máquina…</div> : !machine ? <div className="m-empty"><Icon name="LockKeyhole" size={32} /><h1>Máquina no disponible</h1><p>No está en las máquinas que puedes administrar.</p><button className="m-button" onClick={() => go()}>Volver a mis máquinas</button></div> : <div className="m-page-enter" key={machine.id}><button className="m-back-link" onClick={() => go()} disabled={blocked}><Icon name="ArrowLeft" size={17} />{isAdmin ? 'Todas las máquinas' : 'Mis máquinas'}</button>
          <section className="m-machine-hero"><MachineModel machine={machine} online={ops.online} interactive /><div className="m-machine-identity"><p className="m-kicker">MÁQUINA {machine.id}</p><h1>{machine.name || machine.id}</h1><p className="m-machine-location"><Icon name="MapPin" size={17} />{machine.location || 'Ubicación por definir'}</p><div className="m-machine-badges"><span className={`m-badge ${ops.online ? 'm-green' : 'm-amber'}`}><Icon name={ops.online ? 'Wifi' : 'WifiOff'} size={14} />{ops.telemetry ? ops.online ? 'En línea' : 'Sin señal reciente' : 'Consultando conexión'}</span><span className={`m-badge ${machine.premium?.active ? 'm-gold' : ''}`}><Icon name={machine.premium?.active ? 'Crown' : 'SlidersHorizontal'} size={14} />{machine.premium?.active ? 'Premium activo' : 'Acceso normal'}</span></div><p className="m-caption">{ops.online ? `Última lectura: ${new Date(ops.telemetry.lastSeenAt).toLocaleTimeString('es-MX')}` : 'Los controles y ajustes pertenecen únicamente a esta máquina.'}</p></div><div className="m-machine-owner"><span>{isAdmin ? 'Socio responsable' : 'Precio de venta · 20 L'}</span><strong>{isAdmin ? owner : money(machine.pricePerGarrafonCents)}</strong><p>{isAdmin ? machine.partner?.email || 'Puedes asignarle un socio desde esta ficha.' : 'Puedes modificarlo en Datos y precio.'}</p>{isAdmin && <button className="m-button" disabled={blocked} onClick={() => go('machines', machine.id, 'assignment')}><Icon name="UserRoundCheck" size={16} />{machine.partnerId ? 'Cambiar socio' : 'Asignar socio'}</button>}</div></section>
          <nav className="m-machine-tabs" aria-label={`Funciones de ${machine.id}`}>{visibleSections.map((item) => <button key={item.key} aria-current={section === item.key ? 'page' : undefined} className={section === item.key ? 'is-current' : ''} onClick={() => go('machines', machine.id, item.key)} disabled={blocked}><Icon name={item.icon} size={18} /><span>{item.label}</span></button>)}</nav>
          <div className="m-section-enter" key={`${machine.id}:${section}`}>
            {section === 'controls' && <MachineControls ops={ops} />}
            {section === 'premium' && <MachinePremiumPanel key={machine.id} machineId={machine.id} isAdmin={isAdmin} darkMode={darkMode} onBusyChange={setPremiumBusy} onPremiumChange={ops.updatePremium} />}
            {section === 'settings' && <MachineSettings key={machine.id} machine={machine} isAdmin={isAdmin} request={request} onSaved={saved} onBusyChange={setFormBusy} />}
            {section === 'qr' && <MachineQr key={machine.id} machine={machine} request={request} />}
            {section === 'assignment' && isAdmin && <MachineAssignment key={machine.id} machine={machine} partners={partners} request={request} onSaved={assigned} onBusyChange={setFormBusy} />}
          </div>
        </div>)}
        {isAdmin && page === 'partners' && <div className="m-page-enter" key="partners"><PartnersManager partners={partners} loading={partnersLoading} request={request} onChanged={refreshAll} onOpenMachine={(id) => go('machines', id, 'assignment')} /></div>}
        {isAdmin && page === 'rates' && <div className="m-page-enter" key="rates"><PremiumRates request={request} /></div>}
        {isAdmin && page === 'promotions' && <div className="m-page-enter" key="promotions"><PromotionSettings promotions={summary.promotions} request={request} onChanged={ops.refresh} /></div>}
      </main>
    </div>
    {createOpen && isAdmin && <ManagementDialog title="Nueva máquina" busy={formBusy} onClose={() => setCreateOpen(false)}><MachineSettings creating isAdmin request={request} onSaved={saved} onBusyChange={setFormBusy} existingIds={fleet.filter((item) => !item.detectedOnly).map((item) => item.id)} /></ManagementDialog>}
    <NotificationToast />
  </div>;
}
