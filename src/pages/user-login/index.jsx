import React from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SignIn, SignedIn, useUser } from '@clerk/clerk-react';
import Icon from '../../components/AppIcon';
import Agua24Brand from '../../components/Agua24Brand';

const loginHighlights = [
  {
    icon: 'Droplets',
    title: 'Dispensado simple',
    description: 'Accede a tu saldo y activa tu recarga con una interfaz mas clara y moderna.',
  },
  {
    icon: 'ShieldCheck',
    title: 'Acceso seguro',
    description: 'Tu cuenta centraliza historial, recargas y control de uso en un solo lugar.',
  },
  {
    icon: 'Sparkles',
    title: 'Experiencia premium',
    description: 'Diseno enfocado en confianza, velocidad y una operacion diaria mas agradable.',
  },
];

const loginStats = [
  { value: '24/7', label: 'Disponible' },
  { value: '1 app', label: 'Saldo + agua' },
  { value: 'QR', label: 'Acceso rapido' },
];

export default function UserLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSignedIn } = useUser();
  const showMonitorLogin = new URLSearchParams(location.search).get('monitor') === '1';
  const [monitorOpen, setMonitorOpen] = React.useState(showMonitorLogin);
  const [adminUser, setAdminUser] = React.useState('');
  const [adminPassword, setAdminPassword] = React.useState('');
  const [adminError, setAdminError] = React.useState('');

  const onBrandClick = () => {
    if (isSignedIn) navigate('/home-dashboard');
  };

  const handleMonitorLogin = (event) => {
    event.preventDefault();

    if (adminUser.trim() !== 'admin' || adminPassword !== '123') {
      setAdminError('Usuario o contrasena incorrectos');
      return;
    }

    window.sessionStorage.setItem('agua24MonitorAdmin', 'true');
    window.sessionStorage.setItem('agua24MonitorAdminUser', 'admin');
    window.sessionStorage.setItem('agua24MonitorAdminPassword', '123');
    navigate('/water-monitor', { replace: true });
  };

  return (
    <>
      <Helmet>
        <title>Iniciar sesion - AGUA/24</title>
        <meta
          name="description"
          content="Accede a AGUA/24 para gestionar tu saldo y dispensar agua purificada"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Helmet>

      {!showMonitorLogin ? (
        <SignedIn>
          <Navigate to="/home-dashboard" replace />
        </SignedIn>
      ) : null}

      <div className="min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#d7fbff_0,#eefbff_28%,#f8fcff_58%,#edf4ff_100%)]">
        <header className="w-full">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-6">
            <button
              type="button"
              onClick={onBrandClick}
              className="flex items-center gap-3 select-none"
              aria-label="AGUA/24"
            >
              <Agua24Brand className="h-12" />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMonitorOpen((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-100 bg-white/80 px-3 py-2 text-sm text-[#1E3F7A] shadow-sm backdrop-blur transition hover:bg-white sm:px-4 sm:text-[15px]"
              >
                <Icon name="MonitorCog" size={16} />
                <span className="font-medium">Monitoreo</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/user-registration')}
                className="inline-flex items-center gap-2 rounded-xl border border-sky-100 bg-white/80 px-3 py-2 text-sm text-[#1E3F7A] shadow-sm backdrop-blur transition hover:bg-white sm:px-4 sm:text-[15px]"
              >
                <Icon name="UserPlus" size={16} />
                <span className="font-medium">Crear cuenta</span>
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <section className="hidden lg:block">
              <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(234,248,255,0.92))] p-8 shadow-[0_30px_80px_rgba(30,63,122,0.14)]">
                <div className="absolute -right-20 top-8 h-40 w-40 rounded-full bg-cyan-200/60 blur-3xl" />
                <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-sky-300/40 blur-3xl" />
                <div className="relative max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1E3F7A]">
                    <Icon name="Sparkles" size={14} className="text-[#42B9D4]" />
                    Siempre cerca, siempre pura
                  </div>
                  <h1 className="mt-6 text-5xl font-black leading-[1.05] text-[#12356b]">
                    Inicia con una experiencia mas limpia, confiable y profesional.
                  </h1>
                  <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
                    AGUA/24 conecta recargas, saldo y dispensado en un entorno visual mas robusto para que la app se sienta moderna desde el primer acceso.
                  </p>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {loginStats.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                        <p className="text-2xl font-black text-[#1E3F7A]">{item.value}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 space-y-3">
                    {loginHighlights.map((item) => (
                      <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-white/80 bg-white/70 px-4 py-4 backdrop-blur">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#42B9D4_0%,#1E3F7A_100%)] shadow-sm">
                          <Icon name={item.icon} size={20} className="text-white" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-[#1E3F7A]">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <div className="w-full max-w-[360px] justify-self-center sm:max-w-[430px] lg:justify-self-end">
              <div className="rounded-[32px] border border-white/80 bg-white/78 p-4 shadow-[0_30px_80px_rgba(30,63,122,0.14)] backdrop-blur-xl sm:p-6">
                <div className="mb-6 text-center">
                  <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#42B9D4_0%,#1E3F7A_100%)] shadow-lg">
                    <Icon name="LogIn" size={24} className="text-white" />
                  </div>
                  <h1 className="mb-1 mt-4 text-[28px] font-black text-[#12356b] sm:text-4xl">
                  Bienvenido de vuelta
                  </h1>
                  <p className="text-sm leading-6 text-slate-600 sm:text-base">
                    Entra para gestionar saldo, recargas y uso de maquina desde una vista mas cuidada.
                  </p>
                </div>

                <SignIn
                  routing="path"
                  path="/user-login"
                  afterSignInUrl="/home-dashboard"
                  appearance={{
                    variables: {
                      colorPrimary: '#42B9D4',
                      borderRadius: '18px',
                      fontSize: '13px',
                    },
                    layout: {
                      socialButtonsPlacement: 'top',
                      socialButtonsVariant: 'blockButton',
                    },
                    elements: {
                      rootBox: 'w-full max-w-none',
                      cardBox: 'w-full max-w-none',
                      card:
                        'w-full max-w-none rounded-[26px] border border-sky-100/80 bg-white/96 shadow-none p-4 sm:p-6',
                      form: 'w-full min-w-0 space-y-4 sm:space-y-5',
                      formField: 'w-full min-w-0',
                      formFieldLabel: 'text-slate-700 font-semibold text-sm mb-1',
                      formFieldInput:
                        'w-full min-w-0 h-11 sm:h-12 px-4 rounded-2xl border border-sky-100 bg-slate-50/70 text-[16px] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 outline-none',
                      formButtonPrimary:
                        'w-full h-11 sm:h-12 rounded-2xl bg-[linear-gradient(90deg,#42B9D4_0%,#1E3F7A_100%)] text-white font-semibold transition shadow-[0_14px_30px_rgba(30,63,122,0.2)] hover:shadow-[0_18px_36px_rgba(30,63,122,0.28)]',
                      socialButtons: 'grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 sm:mb-6',
                      socialButtonsBlockButton:
                        'h-10 sm:h-11 rounded-2xl border border-sky-100 bg-white hover:bg-sky-50 shadow-none',
                      socialButtonsBlockButtonText: 'text-slate-800 font-medium text-sm',
                      dividerRow: 'hidden',
                      dividerText: 'hidden',
                      dividerLine: 'hidden',
                      header: 'hidden',
                      headerTitle: 'hidden',
                      headerSubtitle: 'hidden',
                      footer: 'hidden',
                      footerAction: 'hidden',
                    },
                  }}
                />

                {monitorOpen ? (
                  <form
                    onSubmit={handleMonitorLogin}
                    className="mt-5 rounded-[24px] border border-sky-100 bg-[linear-gradient(145deg,rgba(245,251,255,0.98),rgba(232,246,255,0.92))] p-4 shadow-sm"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <Icon name="MonitorCog" size={18} className="text-[#42B9D4]" />
                      <h2 className="font-semibold text-[#1E3F7A]">Acceso de monitoreo</h2>
                    </div>
                    <div className="space-y-3">
                      <input
                        value={adminUser}
                        onChange={(event) => {
                          setAdminUser(event.target.value);
                          setAdminError('');
                        }}
                        placeholder="Usuario"
                        className="h-11 w-full rounded-2xl border border-sky-100 bg-white px-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                      />
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(event) => {
                          setAdminPassword(event.target.value);
                          setAdminError('');
                        }}
                        placeholder="Contrasena"
                        className="h-11 w-full rounded-2xl border border-sky-100 bg-white px-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                      />
                      {adminError ? <p className="text-sm font-medium text-red-600">{adminError}</p> : null}
                      <button
                        type="submit"
                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#1E3F7A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#173263]"
                      >
                        <Icon name="LockKeyhole" size={16} />
                        Entrar al monitor
                      </button>
                    </div>
                  </form>
                ) : null}

                <div className="mt-5 text-center">
                  <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-sky-100 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                    <Icon name="Sparkles" size={16} className="text-[#42B9D4]" />
                    <p className="text-sm text-slate-600">
                      No tienes cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/user-registration')}
                        className="font-semibold text-[#1E3F7A] hover:text-[#42B9D4]"
                      >
                        Crear cuenta gratis
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
