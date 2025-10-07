// src/pages/user-login/index.jsx
import React from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, useNavigate } from 'react-router-dom';
import { SignIn, SignedIn, useUser } from '@clerk/clerk-react';
import Icon from '../../components/AppIcon';

export default function UserLogin() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const onBrandClick = () => {
    if (isSignedIn) navigate('/home-dashboard');
  };

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - AquaQR</title>
        <meta
          name="description"
          content="Accede a tu cuenta AquaQR para gestionar tu saldo y dispensar agua purificada"
        />
        {/* safe areas en móvil */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Helmet>

      {/* Si ya está logueado, redirige */}
      <SignedIn>
        <Navigate to="/home-dashboard" replace />
      </SignedIn>

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f0fbff] via-white to-[#eef6ff]">
        {/* Header */}
        <header className="w-full">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
            <button
              type="button"
              onClick={onBrandClick}
              className="flex items-center gap-3 select-none"
              aria-label="AquaQR"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                <Icon name="Droplets" size={22} className="text-white" />
              </div>
              <div className="leading-tight text-left">
                <span className="block text-base sm:text-lg font-bold text-slate-900">AquaQR</span>
                <span className="block text-xs sm:text-sm text-slate-500">Agua purificada inteligente</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/user-registration')}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 backdrop-blur border border-slate-200 rounded-xl text-sm sm:text-[15px] text-slate-800 hover:bg-white shadow-sm transition"
            >
              <Icon name="UserPlus" size={16} />
              <span className="font-medium">Crear cuenta</span>
            </button>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 px-4 py-6">
          {/* Centrado en móvil; a la derecha en desktop */}
          <div className="mx-auto w-full max-w-6xl flex justify-center lg:justify-end px-0 lg:pr-8">
            {/* Ancho compacto en móvil */}
            <div className="w-full max-w-[340px] sm:max-w-[400px] lg:mr-10">
              {/* Título */}
              <div className="text-center mb-6">
                <h1 className="text-[26px] sm:text-4xl font-bold text-slate-900 mb-1">
                  Bienvenido de vuelta
                </h1>
                <p className="text-slate-600 text-sm sm:text-base">
                  Inicia sesión para gestionar tu saldo
                </p>
              </div>

              {/* Solo la tarjeta de Clerk */}
              <SignIn
                routing="path"
                path="/user-login"
                afterSignInUrl="/home-dashboard"
                appearance={{
                  variables: {
                    colorPrimary: '#06b6d4',
                    borderRadius: '16px',
                    fontSize: '13px', // un poco más chico en móvil
                  },
                  layout: {
                    socialButtonsPlacement: 'top',
                    socialButtonsVariant: 'blockButton',
                  },
                  elements: {
                    // Usamos el card nativo de Clerk como tarjeta
                    card:
                      'rounded-2xl border border-slate-200 bg-white/95 backdrop-blur shadow-xl p-4 sm:p-6',

                    form: 'w-full space-y-4 sm:space-y-5',
                    formField: 'w-full',
                    formFieldLabel: 'text-slate-700 font-medium text-sm mb-1',
                    formFieldInput:
                      'w-full h-11 sm:h-12 px-4 rounded-xl border border-slate-300 text-[16px] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none',

                    formButtonPrimary:
                      'w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-600 hover:to-blue-700 transition shadow-md hover:shadow-lg',

                    socialButtons: 'grid grid-cols-2 gap-3 mb-4 sm:mb-6',
                    socialButtonsBlockButton:
                      'h-10 sm:h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 shadow-none',
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

              {/* CTA alterna */}
              <div className="text-center mt-5">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur rounded-xl border border-slate-200 shadow-sm">
                  <Icon name="Sparkles" size={16} className="text-cyan-600" />
                  <p className="text-sm text-slate-600">
                    ¿No tienes cuenta?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/user-registration')}
                      className="text-cyan-700 hover:text-cyan-600 font-semibold"
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
