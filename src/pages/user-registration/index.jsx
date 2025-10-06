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
        {/* Header */}
        <header className="w-full">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between">
            <button type="button" onClick={onBrandClick} className="flex items-center gap-3 select-none" aria-label="AquaQR">
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
              onClick={() => navigate('/user-login')}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 backdrop-blur border border-slate-200 rounded-xl text-sm sm:text-[15px] text-slate-800 hover:bg-white shadow-sm transition"
            >
              <Icon name="LogIn" size={16} />
              <span className="font-medium">Iniciar sesión</span>
            </button>
          </div>
        </header>

        {/* Main centrado - OPTIMIZADO MÓVIL */}
        <main className="flex-1 flex items-center justify-center px-4 py-4 sm:py-8">
          <div className="w-full max-w-md">
            {/* Título - MÁS COMPACTO EN MÓVIL */}
            <div className="text-center mb-4 sm:mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 mb-3 sm:mb-4 shadow-lg">
                <Icon name="Sparkles" size={24} className="text-white sm:w-7 sm:h-7" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
                Comienza gratis
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Crea tu cuenta y accede a agua purificada inteligente
              </p>
            </div>

            {/* Tarjeta del formulario - PADDING OPTIMIZADO */}
            <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur shadow-xl p-4 sm:p-6">
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
                    
                    // Formulario perfectamente centrado - ESPACIADO COMPACTO
                    form: "w-full space-y-3",
                    formFieldRow: "w-full",
                    formField: "w-full",
                    formFieldLabel: "text-slate-700 font-medium text-sm mb-1.5",
                    formFieldInput:
                      "w-full h-10 px-4 rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none text-sm",

                    formButtonPrimary:
                      "w-full h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg",

                    // Botones sociales - MÁS COMPACTOS
                    socialButtons: "w-full flex flex-col sm:flex-row gap-2 mb-4",
                    socialButtonsBlockButton:
                      "flex-1 h-10 rounded-xl border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all",
                    socialButtonsBlockButtonText: "text-slate-800 font-medium text-sm",

                    // Divisor personalizado - MENOS ESPACIO
                    dividerRow: "my-4",
                    dividerText: "text-slate-400 text-xs px-4",
                    dividerLine: "bg-slate-200",

                    // Footer con enlaces - MÁS COMPACTO
                    footerAction: "mt-4",
                    footerActionText: "text-slate-600 text-xs",
                    footerActionLink: "text-cyan-600 hover:text-cyan-700 font-semibold",
                    
                    // Links adicionales (términos y privacidad) - MÁS COMPACTO
                    footerPages: "mt-3",
                    footerPagesLink: "text-slate-500 hover:text-slate-700 text-xs transition-colors",

                    // Ocultar header por defecto de Clerk
                    header: "hidden",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                  },
                }}
              />
            </div>

            {/* Beneficios */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center mb-2">
                  <Icon name="Zap" size={20} className="text-cyan-600" />
                </div>
                <p className="text-xs text-slate-600 font-medium">Registro rápido</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2">
                  <Icon name="Shield" size={20} className="text-blue-600" />
                </div>
                <p className="text-xs text-slate-600 font-medium">100% seguro</p>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-xl bg-white/60 backdrop-blur border border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center mb-2">
                  <Icon name="Droplets" size={20} className="text-teal-600" />
                </div>
                <p className="text-xs text-slate-600 font-medium">Agua al instante</p>
              </div>
            </div>

            {/* CTA alterna */}
            <div className="text-center mt-6">
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/80 backdrop-blur rounded-xl border border-slate-200 shadow-sm">
                <Icon name="ArrowRight" size={16} className="text-cyan-600" />
                <p className="text-sm text-slate-600">
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