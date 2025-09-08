import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Icon from '../../components/AppIcon';
import RegistrationForm from './components/RegistrationForm';
import SocialRegistration from './components/SocialRegistration';


const UserRegistration = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is already authenticated
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      setIsAuthenticated(true);
      navigate('/home-dashboard');
    }
  }, [navigate]);

  const handleRegistrationSuccess = (userData) => {
    console.log('Registration successful:', userData);
  };

  const handleSocialSuccess = (userData) => {
    console.log('Social registration successful:', userData);
  };

  // Don't render if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Crear Cuenta - AquaQR</title>
        <meta name="description" content="Únete a AquaQR y comienza a dispensar agua purificada de forma segura y conveniente" />
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
              to="/user-login"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-border rounded-xl text-body-sm text-text-primary hover:bg-white hover:shadow-md transition-all duration-200"
            >
              <Icon name="LogIn" size={16} />
              <span className="font-medium">Iniciar sesión</span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-8 lg:py-12">
          <div className="w-full max-w-lg">
            {/* Welcome Section */}
            <div className="text-center mb-8 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl mb-4">
                <Icon name="UserPlus" size={28} className="text-primary" />
              </div>
              <div>
                <h1 className="text-heading-xl font-bold text-text-primary mb-2">
                  Crear Cuenta
                </h1>
                <p className="text-body-base text-text-secondary max-w-md mx-auto">
                  Únete a AquaQR y comienza a dispensar agua purificada de forma segura y conveniente
                </p>
              </div>
              
              {/* Benefits Preview */}
              <div className="grid grid-cols-3 gap-4 mt-6 max-w-md mx-auto">
                <div className="flex flex-col items-center space-y-2 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-border/30">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name="Zap" size={16} className="text-primary" />
                  </div>
                  <span className="text-caption font-medium text-text-primary">Acceso rápido</span>
                </div>
                
                <div className="flex flex-col items-center space-y-2 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-border/30">
                  <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                    <Icon name="Shield" size={16} className="text-success" />
                  </div>
                  <span className="text-caption font-medium text-text-primary">Seguro</span>
                </div>
                
                <div className="flex flex-col items-center space-y-2 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-border/30">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Icon name="Heart" size={16} className="text-accent" />
                  </div>
                  <span className="text-caption font-medium text-text-primary">Impacto social</span>
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-soft-2xl border border-border/50 p-8 space-y-6">
              <RegistrationForm onRegistrationSuccess={handleRegistrationSuccess} />
              
              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60"></div>
                </div>
                <div className="relative flex justify-center text-body-sm">
                  <span className="bg-white px-4 text-text-secondary font-medium">o continúa con</span>
                </div>
              </div>
              
              {/* Social Registration */}
              <SocialRegistration onSocialSuccess={handleSocialSuccess} />
            </div>

            {/* Login Prompt */}
            <div className="text-center mt-8">
              <div className="inline-flex items-center space-x-2 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-border/30">
                <Icon name="Users" size={16} className="text-primary" />
                <p className="text-body-sm text-text-secondary">
                  ¿Ya tienes cuenta?{' '}
                  <Link
                    to="/user-login"
                    className="text-primary hover:text-primary/80 font-semibold transition-colors duration-200"
                  >
                    Iniciar sesión
                  </Link>
                </p>
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

export default UserRegistration;