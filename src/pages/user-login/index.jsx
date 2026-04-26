import React from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { SignIn, SignedIn, useUser } from '@clerk/clerk-react';
import Icon from '../../components/AppIcon';
import Agua24Brand from '../../components/Agua24Brand';

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

      <div className="min-h-[100dvh] overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#d8f7ff_0,#f8fdff_36%,#eef9ff_100%)]">
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
              <div className="max-w-xl">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#42B9D4]">
                  Siempre cerca, siempre pura
                </p>
                <h1 className="text-5xl font-black leading-tight text-[#1E3F7A]">
                  Agua purificada con una experiencia mas fresca.
                </h1>
                <p className="mt-5 text-lg leading-8 text-slate-600">
                  AGUA/24 conecta recargas, saldo y dispensado en una app clara, segura y lista para operar todos los dias.
                </p>
                <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
                  {[
                    ['Droplets', 'Pura'],
                    ['Clock3', '24/7'],
                    ['ShieldCheck', 'Segura'],
                  ].map(([icon, label]) => (
                    <div key={label} className="rounded-xl border border-sky-100 bg-white/75 p-4 text-center shadow-sm">
                      <Icon name={icon} size={22} className="mx-auto text-[#42B9D4]" />
                      <p className="mt-2 text-sm font-semibold text-[#1E3F7A]">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <div className="w-full max-w-[340px] justify-self-center sm:max-w-[400px] lg:justify-self-end">
              <div className="mb-6 text-center">
                <h1 className="mb-1 text-[26px] font-bold text-[#1E3F7A] sm:text-4xl">
                  Bienvenido de vuelta
                </h1>
                <p className="text-sm text-slate-600 sm:text-base">
                  Inicia sesion para gestionar tu saldo
                </p>
              </div>

              <SignIn
                routing="path"
                path="/user-login"
                afterSignInUrl="/home-dashboard"
                appearance={{
                  variables: {
                    colorPrimary: '#42B9D4',
                    borderRadius: '16px',
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
                      'w-full max-w-none rounded-2xl border border-sky-100 bg-white/95 backdrop-blur shadow-xl p-4 sm:p-6',
                    form: 'w-full min-w-0 space-y-4 sm:space-y-5',
                    formField: 'w-full min-w-0',
                    formFieldLabel: 'text-slate-700 font-medium text-sm mb-1',
                    formFieldInput:
                      'w-full min-w-0 h-11 sm:h-12 px-4 rounded-xl border border-sky-100 text-[16px] focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 outline-none',
                    formButtonPrimary:
                      'w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-[#42B9D4] to-[#1E3F7A] text-white font-semibold transition shadow-md hover:shadow-lg',
                    socialButtons: 'grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 sm:mb-6',
                    socialButtonsBlockButton:
                      'h-10 sm:h-11 rounded-xl border border-sky-100 bg-white hover:bg-sky-50 shadow-none',
                    socialButtonsBlockButtonText: 'text-slate-800 font-medium text-sm',
                    dividerRow: 'hidden',
                    dividerText: 'hidden',
                    dividerLine: 'hidden',
                    header: 'hidden',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                  },
                }}
              />

              {monitorOpen ? (
                <form
                  onSubmit={handleMonitorLogin}
                  className="mt-5 rounded-2xl border border-sky-100 bg-white/90 p-4 shadow-sm"
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
                      className="h-11 w-full rounded-xl border border-sky-100 px-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                    />
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(event) => {
                        setAdminPassword(event.target.value);
                        setAdminError('');
                      }}
                      placeholder="Contrasena"
                      className="h-11 w-full rounded-xl border border-sky-100 px-3 text-sm outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200"
                    />
                    {adminError ? <p className="text-sm font-medium text-red-600">{adminError}</p> : null}
                    <button
                      type="submit"
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1E3F7A] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#173263]"
                    >
                      <Icon name="LockKeyhole" size={16} />
                      Entrar al monitor
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="mt-5 text-center">
                <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-sky-100 bg-white/80 px-4 py-2.5 shadow-sm backdrop-blur">
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
        </main>
      </div>
    </>
  );
}
