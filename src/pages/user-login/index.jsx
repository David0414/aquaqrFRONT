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
        <meta name="description" content="Accede a tu cuenta AquaQR para gestionar tu saldo y dispensar agua purificada" />
      </Helmet>

      <SignedIn><Navigate to="/home-dashboard" replace /></SignedIn>

      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#f0fbff] via-white to-[#eef6ff]">
        {/* Header - ARREGLADO PARA MÓVIL */}
        <header className="w-full bg-white/50 backdrop-blur-sm border-b border-slate-200">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:py-4 flex items-center justify-between">
            <button 
              type="button" 
              onClick={onBrandClick} 
              className="flex items-center gap-2 sm:gap-3 select-none" 
              aria-label="AquaQR"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shrink-0">
                <Icon name="Droplets" size={20} className="text-white sm:w-6 sm:h-6" />
              </div>
              <div className="leading-tight text-left hidden sm:block">
                <span className="block text-lg font-bold text-slate-900">AquaQR</span>
                <span className="block text-sm text-slate-500">Agua purificada inteligente</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/user-registration')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/80 backdrop-blur border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 hover:bg-white shadow-sm transition shrink-0"
            >
              <Icon name="UserPlus" size={14} className="sm:w-4 sm:h-4" />
              <span className="font-medium">Crear cuenta</span>
            </button>
          </div>
        </header>

        {/* Main centrado */}
        <main className="flex-1 flex items-center justify-center px-4 py-4 sm:py-8 overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            {/* Título */}
            <div className="text-center mb-4 sm:mb-6">
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
                Bienvenido de vuelta
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Inicia sesión para gestionar tu saldo
              </p>
            </div>

            {/* Tarjeta del formulario */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg sm:shadow-xl p-4 sm:p-6">
              <SignIn
                routing="path"
                path="/user-login"
                afterSignInUrl="/home-dashboard"
                appearance={{
                  layout: {
                    socialButtonsPlacement: "top",
                    socialButtonsVariant: "blockButton",
                  },
                  elements: {
                    rootBox: "w-full",
                    card: "w-full !shadow-none !border-0 !p-0",
                    
                    // Formulario compacto
                    form: "w-full space-y-2",
                    formFieldRow: "w-full",
                    formField: "w-full",
                    formFieldLabel: "text-slate-700 font-medium text-xs mb-1",
                    formFieldInput:
                      "w-full h-10 px-3 text-sm rounded-lg border border-slate-300 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all outline-none",

                    formButtonPrimary:
                      "w-full h-10 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg",

                    // Botones sociales compactos
                    socialButtons: "w-full flex flex-col gap-2 mb-2",
                    socialButtonsBlockButton:
                      "w-full h-9 rounded-lg border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all text-sm",
                    socialButtonsBlockButtonText: "text-slate-800 font-medium text-sm",

                    // Divisor compacto
                    dividerRow: "my-2",
                    dividerText: "text-slate-400 text-xs",
                    dividerLine: "bg-slate-200",

                    // Footer compacto
                    footerAction: "mt-2",
                    footerActionText: "text-slate-600 text-xs",
                    footerActionLink: "text-cyan-600 hover:text-cyan-700 font-semibold text-xs",

                    // Ocultar header
                    header: "hidden",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                  },
                }}
              />
            </div>

            {/* CTA alterna */}
            <div className="text-center mt-4 sm:mt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-lg border border-slate-200 shadow-sm">
                <Icon name="Sparkles" size={14} className="text-cyan-600" />
                <p className="text-xs text-slate-600">
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate('/user-registration')}
                    className="text-cyan-700 hover:text-cyan-600 font-semibold transition-colors"
                  >
                    Crear cuenta gratis
                  </button>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}