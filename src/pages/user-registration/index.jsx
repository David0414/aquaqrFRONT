import React from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, useNavigate } from 'react-router-dom';
import { SignUp, SignedIn, useUser } from '@clerk/clerk-react';
import Icon from '../../components/AppIcon';
import Agua24Brand from '../../components/Agua24Brand';

const registrationBenefits = [
  {
    icon: 'Wallet',
    title: 'Recarga tu saldo',
    description: 'Ten control rapido de tus recargas y movimientos desde una sola cuenta.',
  },
  {
    icon: 'QrCode',
    title: 'Conecta con QR',
    description: 'Accede a las maquinas mas facil y con una experiencia mas fluida.',
  },
  {
    icon: 'BadgeCheck',
    title: 'Historial ordenado',
    description: 'Consulta tu actividad con una interfaz mas cuidada y confiable.',
  },
];

const registrationStats = [
  { value: '1 min', label: 'Registro rapido' },
  { value: '24/7', label: 'Uso continuo' },
  { value: '100%', label: 'Cuenta digital' },
];

export default function UserRegistration() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const onBrandClick = () => {
    if (isSignedIn) navigate('/home-dashboard');
  };

  return (
    <>
      <Helmet>
        <title>Crear cuenta - AGUA/24</title>
        <meta
          name="description"
          content="Crea tu cuenta AGUA/24 y comienza a disfrutar de agua purificada inteligente"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Helmet>

      <SignedIn>
        <Navigate to="/home-dashboard" replace />
      </SignedIn>

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

            <button
              type="button"
              onClick={() => navigate('/user-login')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-800 shadow-sm backdrop-blur transition hover:bg-white sm:px-4 sm:text-[15px]"
            >
              <Icon name="LogIn" size={16} />
              <span className="font-medium">Iniciar sesion</span>
            </button>
          </div>
        </header>

        <main className="px-4 py-6">
          <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
            <section className="hidden lg:block">
              <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,255,255,0.82),rgba(234,248,255,0.92))] p-8 shadow-[0_30px_80px_rgba(30,63,122,0.14)]">
                <div className="absolute -left-12 top-16 h-36 w-36 rounded-full bg-cyan-200/60 blur-3xl" />
                <div className="absolute bottom-4 right-0 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
                <div className="relative max-w-xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1E3F7A]">
                    <Icon name="UserPlus" size={14} className="text-[#42B9D4]" />
                    Nuevo acceso AGUA/24
                  </div>
                  <h1 className="mt-6 text-5xl font-black leading-[1.05] text-[#12356b]">
                    Crea tu cuenta con una primera impresion mas moderna y confiable.
                  </h1>
                  <p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">
                    El registro ahora se siente mas cuidado visualmente y comunica mejor el valor de la app desde el inicio.
                  </p>

                  <div className="mt-8 grid grid-cols-3 gap-3">
                    {registrationStats.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                        <p className="text-2xl font-black text-[#1E3F7A]">{item.value}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 space-y-3">
                    {registrationBenefits.map((item) => (
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
                    <Icon name="UserPlus" size={24} className="text-white" />
                  </div>
                  <h1 className="mb-1 mt-4 text-[28px] font-black text-[#12356b] sm:text-4xl">
                    Crea tu cuenta
                  </h1>
                  <p className="text-sm leading-6 text-slate-600 sm:text-base">
                    Empieza a recargar, consultar saldo y usar tus maquinas desde una experiencia mas pulida.
                  </p>
                </div>

                <SignUp
                  routing="path"
                  path="/user-registration"
                  afterSignUpUrl="/home-dashboard"
                  signInUrl="/user-login"
                  appearance={{
                    variables: {
                      colorPrimary: '#06b6d4',
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
                        'w-full max-w-none rounded-[26px] border border-slate-200/80 bg-white/96 shadow-none p-4 sm:p-6',
                      form: 'w-full min-w-0 space-y-4 sm:space-y-5',
                      formField: 'w-full min-w-0',
                      formFieldLabel: 'text-slate-700 font-semibold text-sm mb-1',
                      formFieldInput:
                        'w-full min-w-0 h-11 sm:h-12 px-4 rounded-2xl border border-slate-200 bg-slate-50/70 text-[16px] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none',
                      formButtonPrimary:
                        'w-full h-11 sm:h-12 rounded-2xl bg-[linear-gradient(90deg,#42B9D4_0%,#1E3F7A_100%)] text-white font-semibold transition shadow-[0_14px_30px_rgba(30,63,122,0.2)] hover:shadow-[0_18px_36px_rgba(30,63,122,0.28)]',
                      socialButtons: 'grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 sm:mb-6',
                      socialButtonsBlockButton:
                        'h-10 sm:h-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 shadow-none',
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

                <div className="mt-5 text-center">
                  <div className="flex w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur">
                    <Icon name="ArrowRight" size={16} className="text-cyan-600" />
                    <p className="text-sm text-slate-600">
                      Ya tienes cuenta?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/user-login')}
                        className="font-semibold text-cyan-700 hover:text-cyan-600"
                      >
                        Inicia sesion
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
