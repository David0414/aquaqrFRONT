// src/pages/user-registration/index.jsx
import React from 'react';
import { Helmet } from 'react-helmet';
import { Navigate, useNavigate } from 'react-router-dom';
import { SignUp, SignedIn, useUser } from '@clerk/clerk-react';
import Icon from '../../components/AppIcon';

export default function UserRegistration() {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  const onBrandClick = () => {
    if (isSignedIn) navigate('/home-dashboard');
  };

  return (
    <>
      <Helmet>
        <title>Crear Cuenta - AquaQR</title>
        <meta name="description" content="Crea tu cuenta AquaQR y comienza a disfrutar de agua purificada inteligente" />
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
              onClick={() => navigate('/user-login')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/80 backdrop-blur border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm text-slate-800 hover:bg-white shadow-sm transition shrink-0"
            >
              <Icon name="LogIn" size={14} className="sm:w-4 sm:h-4" />
              <span className="font-medium">Iniciar sesión</span>
            </button>
          </div>
        </header>

        {/* Main centrado */}
        <main className="flex-1 flex items-center justify-center px-4 py-4 sm:py-8 overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            {/* Título */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-2 sm:mb-3 shadow-lg">
                <Icon name="Sparkles" size={20} className="text-white sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
                Comienza gratis
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Crea tu cuenta en segundos
              </p>
            </div>

            {/* Tarjeta del formulario */}
            <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-lg sm:shadow-xl p-4 sm:p-6">
              <SignUp
                routing="path"
                path="/user-registration"
                afterSignUpUrl="/home-dashboard"
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
                    
                    // Links adicionales
                    footerPages: "mt-2 flex flex-wrap justify-center gap-x-3",
                    footerPagesLink: "text-slate-500 hover:text-slate-700 text-xs transition-colors",

                    // Ocultar header
                    header: "hidden",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                  },
                }}
              />
            </div>

            {/* Beneficios - Solo desktop */}
            <div className="mt-6 hidden sm:grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-white/60 backdrop-blur border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center mb-1.5">
                  <Icon name="Zap" size={18} className="text-cyan-600" />
                </div>
                <p className="text-xs text-slate-600 font-medium">Registro rápido</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-white/60 backdrop-blur border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center mb-1.5">
                  <Icon name="Shield" size={18} className="text-blue-600" />
                </div>
                <p className="text-xs text-slate-600 font-medium">100% seguro</p>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-white/60 backdrop-blur border border-slate-200">
                <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center mb-1.5">
                  <Icon name="Droplets" size={18} className="text-teal-600" />
                </div>
                <p className="text-xs text-slate-600 font-medium">Agua al instante</p>
              </div>
            </div>

            {/* CTA alterna */}
            <div className="text-center mt-4 sm:mt-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-lg border border-slate-200 shadow-sm">
                <Icon name="ArrowRight" size={14} className="text-cyan-600" />
                <p className="text-xs text-slate-600">
                  ¿Ya tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate('/user-login')}
                    className="text-cyan-700 hover:text-cyan-600 font-semibold transition-colors"
                  >
                    Iniciar sesión
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