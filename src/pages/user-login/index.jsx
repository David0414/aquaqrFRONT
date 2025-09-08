import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';

import LoginForm from './components/LoginForm';
import SocialLoginOptions from './components/SocialLoginOptions';
import SecurityVerification from './components/SecurityVerification';
import PasswordRecovery from './components/PasswordRecovery';

const UserLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [currentView, setCurrentView] = useState('login'); // login, recovery, verification
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationData, setVerificationData] = useState(null);

  // Mock credentials for testing
  const mockCredentials = {
    email: 'usuario@aquaqr.com',
    phone: '+34 600 123 456',
    password: 'AquaQR2024!'
  };

  // Get redirect path from location state or localStorage
  const getRedirectPath = () => {
    return location?.state?.from || localStorage.getItem('redirectAfterLogin') || '/home-dashboard';
  };

  useEffect(() => {
    // Clear any existing error when view changes
    setError('');
  }, [currentView]);

  const handleLogin = async (formData) => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Validate credentials
      const isValidEmail = formData?.emailOrPhone === mockCredentials?.email;
      const isValidPhone = formData?.emailOrPhone === mockCredentials?.phone;
      const isValidPassword = formData?.password === mockCredentials?.password;

      if (!(isValidEmail || isValidPhone) || !isValidPassword) {
        throw new Error('Credenciales incorrectas. Usa: usuario@aquaqr.com o +34 600 123 456 con contraseña: AquaQR2024!');
      }

      // Check for suspicious login (simulate anti-fraud)
      const suspiciousLogin = Math.random() < 0.3; // 30% chance for demo
      
      if (suspiciousLogin) {
        setVerificationData({
          type: isValidEmail ? 'email' : 'sms',
          contact: formData?.emailOrPhone
        });
        setCurrentView('verification');
        setIsLoading(false);
        return;
      }

      // Store authentication data
      const userData = {
        id: 'user_12345',
        name: 'María González',
        email: mockCredentials?.email,
        phone: mockCredentials?.phone,
        balance: 45.80,
        joinDate: '2024-01-15',
        totalDispensed: 127.5,
        totalDonated: 12.75
      };

      localStorage.setItem('authToken', 'mock_jwt_token_' + Date.now());
      localStorage.setItem('userData', JSON.stringify(userData));
      
      if (formData?.rememberDevice) {
        localStorage.setItem('rememberDevice', 'true');
      }

      // Clear redirect path
      localStorage.removeItem('redirectAfterLogin');

      // Show success toast
      if (window.showToast) {
        window.showToast('¡Bienvenido de vuelta!', 'success', 3000);
      }

      // Navigate to intended destination
      const redirectPath = getRedirectPath();
      navigate(redirectPath, { replace: true });

    } catch (err) {
      setError(err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (providerId) => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate social login
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful social login
      const userData = {
        id: 'user_social_' + providerId,
        name: 'Usuario Social',
        email: `usuario.${providerId}@aquaqr.com`,
        phone: '+34 600 000 000',
        balance: 25.00,
        joinDate: new Date()?.toISOString()?.split('T')?.[0],
        totalDispensed: 0,
        totalDonated: 0
      };

      localStorage.setItem('authToken', 'mock_social_token_' + Date.now());
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.removeItem('redirectAfterLogin');

      if (window.showToast) {
        window.showToast(`¡Conectado con ${providerId}!`, 'success', 3000);
      }

      navigate(getRedirectPath(), { replace: true });

    } catch (err) {
      setError('Error al conectar con ' + providerId + '. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordRecovery = async (email) => {
    setIsLoading(true);
    
    try {
      // Simulate password recovery email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (window.showToast) {
        window.showToast('Email de recuperación enviado', 'success', 5000);
      }
    } catch (err) {
      setError('Error al enviar email de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecurityVerification = async (code) => {
    setIsLoading(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock verification (accept any 6-digit code)
      if (code?.length === 6) {
        const userData = {
          id: 'user_verified_12345',
          name: 'María González',
          email: mockCredentials?.email,
          phone: mockCredentials?.phone,
          balance: 45.80,
          joinDate: '2024-01-15',
          totalDispensed: 127.5,
          totalDonated: 12.75
        };

        localStorage.setItem('authToken', 'mock_verified_token_' + Date.now());
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.removeItem('redirectAfterLogin');

        if (window.showToast) {
          window.showToast('Verificación exitosa', 'success', 3000);
        }

        navigate(getRedirectPath(), { replace: true });
      } else {
        throw new Error('Código de verificación inválido');
      }
    } catch (err) {
      setError(err?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'recovery':
        return (
          <PasswordRecovery
            onRecover={handlePasswordRecovery}
            onBack={() => setCurrentView('login')}
            isLoading={isLoading}
          />
        );
      
      case 'verification':
        return (
          <SecurityVerification
            onVerify={handleSecurityVerification}
            onCancel={() => setCurrentView('login')}
            isLoading={isLoading}
            verificationType={verificationData?.type}
          />
        );
      
      default:
        return (
          <>
            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoading}
              error={error}
            />
            
            <div className="text-center">
              <button
                onClick={() => setCurrentView('recovery')}
                className="text-body-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200"
                disabled={isLoading}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <SocialLoginOptions
              onSocialLogin={handleSocialLogin}
              isLoading={isLoading}
            />
          </>
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Iniciar Sesión - AquaQR</title>
        <meta name="description" content="Accede a tu cuenta AquaQR para gestionar tu saldo y dispensar agua purificada" />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 flex flex-col">
        {/* Header */}
        <header className="relative z-10 p-4 lg:p-6">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <Link to="/qr-scanner-landing" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-200">
                <Icon name="Droplets" size={24} className="text-white" />
              </div>
              <div>
                <span className="text-heading-sm font-bold text-text-primary">AquaQR</span>
                <p className="text-caption text-text-secondary">Agua purificada inteligente</p>
              </div>
            </Link>
            
            <Link
              to="/user-registration"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-border rounded-xl text-body-sm text-text-primary hover:bg-white hover:shadow-md transition-all duration-200"
            >
              <Icon name="UserPlus" size={16} />
              <span className="font-medium">Crear cuenta</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12">
          <div className="w-full max-w-lg">
            {/* Welcome Section */}
            {currentView === 'login' && (
              <div className="text-center mb-8 space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl mb-4">
                  <Icon name="LogIn" size={28} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-heading-xl font-bold text-text-primary mb-2">
                    ¡Bienvenido de vuelta!
                  </h1>
                  <p className="text-body-base text-text-secondary max-w-md mx-auto">
                    Accede a tu cuenta para continuar dispensando agua purificada de alta calidad
                  </p>
                </div>
              </div>
            )}

            {/* Form Card */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-soft-2xl border border-border/50 p-8 space-y-8">
              {renderCurrentView()}
            </div>

            {/* Additional Links */}
            {currentView === 'login' && (
              <div className="text-center mt-8">
                <div className="inline-flex items-center space-x-2 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-border/30">
                  <Icon name="Sparkles" size={16} className="text-accent" />
                  <p className="text-body-sm text-text-secondary">
                    ¿Primera vez aquí?{' '}
                    <Link
                      to="/user-registration"
                      className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
                    >
                      Crear cuenta gratis
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* Demo Credentials Info */}
            <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200/50">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Icon name="Info" size={20} className="text-blue-600" />
                </div>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-body-base font-semibold text-blue-900 mb-1">
                      Credenciales de demostración
                    </h3>
                    <p className="text-body-sm text-blue-700">
                      Usa estas credenciales para probar la aplicación:
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-xs">
                    <div className="space-y-1">
                      <p className="text-blue-800 font-medium">Email:</p>
                      <p className="text-blue-700 font-mono bg-white/50 px-2 py-1 rounded">
                        {mockCredentials?.email}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-blue-800 font-medium">Teléfono:</p>
                      <p className="text-blue-700 font-mono bg-white/50 px-2 py-1 rounded">
                        {mockCredentials?.phone}
                      </p>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-blue-800 font-medium">Contraseña:</p>
                      <p className="text-blue-700 font-mono bg-white/50 px-2 py-1 rounded">
                        {mockCredentials?.password}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Background Decoration */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-200/20 to-blue-300/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-blue-200/20 to-cyan-300/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-2xl"></div>
        </div>
      </div>
    </>
  );
};

export default UserLogin;