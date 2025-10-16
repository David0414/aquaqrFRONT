// src/pages/user-profile-settings/index.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';

import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast, { showErrorToast } from '../../components/ui/NotificationToast';

import ProfileHeader from './components/ProfileHeader';
import PersonalInfoSection from './components/PersonalInfoSection';
import SecuritySection from './components/SecuritySection';
import NotificationPreferences from './components/NotificationPreferences';
import AccountStatistics from './components/AccountStatistics';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

function formatMonthYear(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
}

/** ============ Sección: Sesión (Cerrar sesión) ============ */
const SessionSection = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await signOut();
      navigate('/user-login', { replace: true });
    } catch (e) {
      showErrorToast(e?.message || 'No se pudo cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
          <Icon name="LogOut" size={20} className="text-warning" />
        </div>
        <div>
          <h3 className="text-heading-base font-semibold text-text-primary">Sesión</h3>
          <p className="text-body-sm text-text-secondary">
            Cierra tu sesión de forma segura en este dispositivo.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-error/30 bg-error/5 p-4">
        {/* ✅ En móvil: columna; en desktop: fila */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-error/10 flex items-center justify-center">
              <Icon name="AlertTriangle" size={18} className="text-error" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-text-primary">¿Deseas cerrar sesión?</p>
              <p className="text-body-xs text-text-secondary">
                Podrás volver a ingresar cuando lo necesites.
              </p>
            </div>
          </div>

          {/* ✅ Botón full width en móvil, compacto en desktop */}
          <Button
            variant="default"
            className="w-full sm:w-auto bg-error text-white hover:bg-error/90 border-error"
            iconName="LogOut"
            iconPosition="left"
            loading={loading}
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </div>
      </div>
    </div>
  );
};
/** ======================================================== */

const UserProfileSettings = () => {
  const navigate = useNavigate();
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [uiUser, setUiUser] = useState(null);
  const [activeSection, setActiveSection] = useState('personal');
  const [loading, setLoading] = useState(true);

  const clerkBasics = useMemo(() => {
    if (!clerkUser) return null;
    return {
      name:
        clerkUser.fullName ||
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
        clerkUser.username ||
        clerkUser.primaryEmailAddress?.emailAddress ||
        'Usuario',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      profileImage: clerkUser.imageUrl || '',
      memberSince: formatMonthYear(clerkUser.createdAt),
      createdAt: clerkUser.createdAt,
    };
  }, [clerkUser]);

  const loadMetrics = async () => {
    try {
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      if (!token) throw new Error('Sin sesión');

      const [rechargeRes, dispenseRes] = await Promise.all([
        fetch(`${API}/api/recharge/history?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API}/api/dispense/history?limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const rechargeData = await rechargeRes.json().catch(() => ({ items: [] }));
      const dispenseData = await dispenseRes.json().catch(() => ({ items: [] }));

      if (!rechargeRes.ok) throw new Error(rechargeData?.error || 'Error recargas');
      if (!dispenseRes.ok) throw new Error(dispenseData?.error || 'Error dispensados');

      const dispenses = dispenseData.items || [];
      const recharges = rechargeData.items || [];

      const totalLitersDispensed = dispenses.reduce(
        (acc, it) => acc + (Number(it.liters) || 0),
        0
      );
      const transactionCount = (dispenses.length || 0) + (recharges.length || 0);
      const totalDonated = 0;

      return { totalLitersDispensed, transactionCount, totalDonated };
    } catch (e) {
      showErrorToast(e.message || 'No se pudieron cargar tus métricas');
      return { totalLitersDispensed: 0, transactionCount: 0, totalDonated: 0 };
    }
  };

  useEffect(() => {
    const run = async () => {
      if (!clerkLoaded || !isSignedIn) return;
      setLoading(true);
      const metrics = await loadMetrics();

      setUiUser({
        name: clerkBasics?.name || 'Usuario',
        email: clerkBasics?.email || '',
        profileImage: clerkBasics?.profileImage || '',
        memberSince: clerkBasics?.memberSince || '',
        lastPasswordChange: '—',
        twoFactorEnabled: false,

        totalLitersDispensed: Math.round(metrics.totalLitersDispensed),
        totalDonated: metrics.totalDonated,
        transactionCount: metrics.transactionCount,
        membershipDays: clerkBasics?.createdAt
          ? Math.max(
              1,
              Math.floor(
                (Date.now() - new Date(clerkBasics.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )
          : 1,

        notifications: {
          transactionConfirmations: true,
          promotionalOffers: true,
          socialImpactUpdates: true,
          securityAlerts: true,
          maintenanceNotices: false,
          emailNotifications: true,
          whatsappNotifications: true,
        },
        privacy: {
          dataSharing: false,
          marketingCommunications: true,
          analyticsTracking: true,
          thirdPartySharing: false,
          locationTracking: true,
        },
      });

      setLoading(false);
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkLoaded, isSignedIn]);

  const handleUserUpdate = (updated) =>
    setUiUser((prev) => ({ ...prev, ...updated }));

  const handleImageUpload = async (file) => {
    if (!clerkUser) throw new Error('No hay sesión activa');
    await clerkUser.setProfileImage({ file });
    await clerkUser.reload();
    const freshUrl = `${clerkUser.imageUrl}?v=${Date.now()}`;
    setUiUser((prev) => ({ ...prev, profileImage: freshUrl }));
  };

  const sections = [
    { id: 'personal', title: 'Personal', icon: 'User', component: PersonalInfoSection },
    { id: 'security', title: 'Seguridad', icon: 'Shield', component: SecuritySection },
    { id: 'notifications', title: 'Notificaciones', icon: 'Bell', component: NotificationPreferences },
    { id: 'statistics', title: 'Estadísticas', icon: 'BarChart3', component: AccountStatistics },
    { id: 'session', title: 'Sesión', icon: 'LogOut', component: SessionSection },
  ];
  const ActiveComponent = sections.find((s) => s.id === activeSection)?.component;

  if (!clerkLoaded || !isSignedIn || loading || !uiUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body-sm">Cargando tu perfil…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                iconName="ArrowLeft"
                onClick={() => navigate('/home-dashboard')}
                className="lg:hidden"
                aria-label="Volver"
              />
              <div>
                <h1 className="text-heading-lg font-bold text-text-primary">Configuración</h1>
                <p className="text-body-sm text-text-secondary">
                  Gestiona tu cuenta y preferencias
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              iconName="X"
              onClick={() => navigate('/home-dashboard')}
              className="hidden lg:flex"
              aria-label="Cerrar"
            />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {/* Cabecera con datos reales + subida de imagen */}
        <ProfileHeader user={uiUser} onImageUpload={handleImageUpload} />

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left
                      transition-all duration-200
                      ${
                        activeSection === section.id
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-text-secondary hover:text-text-primary hover:bg-muted/50'
                      }
                    `}
                  >
                    <Icon
                      name={section.icon}
                      size={20}
                      className={activeSection === section.id ? 'text-primary' : 'text-text-secondary'}
                    />
                    <span className="font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Pestañas móviles (scroll con snap, sin cortes en bordes) */}
          <div className="lg:hidden mb-6">
            <div className="flex overflow-x-auto space-x-2 pb-2 -mx-1 px-1 snap-x snap-mandatory">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap
                    transition-all duration-200 flex-shrink-0 snap-start
                    ${
                      activeSection === section.id
                        ? 'bg-primary text-white'
                        : 'bg-muted text-text-secondary hover:bg-muted/80'
                    }
                  `}
                >
                  <Icon name={section.icon} size={16} />
                  <span className="text-body-sm font-medium">{section.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contenido */}
          <div className="lg:col-span-3">
            {ActiveComponent && (
              <ActiveComponent user={uiUser} onUserUpdate={handleUserUpdate} />
            )}
          </div>
        </div>
      </div>

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
};

export default UserProfileSettings;
