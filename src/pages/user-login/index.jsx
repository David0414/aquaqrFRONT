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
              onClick={() => navigate('/user-registration')}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 backdrop-blur border border-slate-200 rounded-xl text-sm sm:text-[15px] text-slate-800 hover:bg-white shadow-sm transition"
            >
              <Icon name="UserPlus" size={16} />
              <span className="font-medium">Crear cuenta</span>
            </button>
          </div>
        </header>

        {/* Main centrado - OPTIMIZADO MÓVIL */}
        <main className="flex-1 flex items-center justify-center px-4 py-4 sm:py-8">
          <div className="w-full max-w-md">
            {/* Título - MÁS COMPACTO EN MÓVIL */}
            <div className="text-center mb-4 sm:mb-8">
              <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
                Bienvenido de vuelta
              </h1>
              <p className="text-sm sm:text-base text-slate-600">
                Inicia sesión para gestionar tu saldo
              </p>
            </div>

            {/* Tarjeta del formulario - PADDING OPTIMIZADO */}
            <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur shadow-xl p-4 sm:p-6">
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
                    
                    // Formulario perfectamente centrado
                    form: "w-full space-y-5",
                    formFieldRow: "w-full",
                    formField: "w-full",
                    formFieldLabel: "text-slate-700 font-medium text-sm mb-2",
                    formFieldInput:
                      "w-full h-12 px-4 rounded-xl border border-slate-300 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all outline-none",

                    formButtonPrimary:
                      "w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg",

                    // Botones sociales
                    socialButtons: "w-full flex flex-col sm:flex-row gap-3 mb-6",
                    socialButtonsBlockButton:
                      "flex-1 h-11 rounded-xl border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all",
                    socialButtonsBlockButtonText: "text-slate-800 font-medium text-sm",

                    // Divisor personalizado
                    dividerRow: "my-6",
                    dividerText: "text-slate-400 text-sm px-4",
                    dividerLine: "bg-slate-200",

                    // Footer con enlaces
                    footerAction: "mt-6",
                    footerActionText: "text-slate-600 text-sm",
                    footerActionLink: "text-cyan-600 hover:text-cyan-700 font-semibold",

                    // Ocultar header por defecto de Clerk
                    header: "hidden",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                  },
                }}
              />
            </div>

            {/* CTA alterna */}
            <div className="text-center mt-6">
              <div className="inline-flex items-center gap-2 px-5 py-3 bg-white/80 backdrop-blur rounded-xl border border-slate-200 shadow-sm">
                <Icon name="Sparkles" size={16} className="text-cyan-600" />
                <p className="text-sm text-slate-600">
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