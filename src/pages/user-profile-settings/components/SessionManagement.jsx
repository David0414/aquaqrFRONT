import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SessionManagement = ({ user }) => {
  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: 'iPhone 15 Pro',
      browser: 'Safari',
      location: 'Ciudad de México, México',
      ipAddress: '192.168.1.100',
      lastActive: '2024-05-05 18:15:00',
      isCurrent: true,
      os: 'iOS 17.4'
    },
    {
      id: 2,
      device: 'MacBook Pro',
      browser: 'Chrome',
      location: 'Ciudad de México, México',
      ipAddress: '192.168.1.101',
      lastActive: '2024-05-05 14:30:00',
      isCurrent: false,
      os: 'macOS 14.4'
    },
    {
      id: 3,
      device: 'Samsung Galaxy S24',
      browser: 'Chrome Mobile',
      location: 'Guadalajara, México',
      ipAddress: '10.0.0.50',
      lastActive: '2024-05-04 09:45:00',
      isCurrent: false,
      os: 'Android 14'
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const getDeviceIcon = (device) => {
    if (device?.toLowerCase()?.includes('iphone') || device?.toLowerCase()?.includes('android')) {
      return 'Smartphone';
    } else if (device?.toLowerCase()?.includes('macbook') || device?.toLowerCase()?.includes('laptop')) {
      return 'Laptop';
    } else if (device?.toLowerCase()?.includes('ipad') || device?.toLowerCase()?.includes('tablet')) {
      return 'Tablet';
    }
    return 'Monitor';
  };

  const formatLastActive = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minutos`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  const handleLogoutSession = async (sessionId) => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSessions(prev => prev?.filter(session => session?.id !== sessionId));
      setIsLoading(false);
      
      if (window.showToast) {
        window.showToast('Sesión cerrada correctamente', 'success');
      }
    }, 1000);
  };

  const handleLogoutAllOther = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSessions(prev => prev?.filter(session => session?.isCurrent));
      setIsLoading(false);
      
      if (window.showToast) {
        window.showToast('Todas las otras sesiones han sido cerradas', 'success');
      }
    }, 1500);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="Monitor" size={20} className="text-accent" />
          </div>
          <div>
            <h2 className="text-heading-base font-semibold text-text-primary">
              Gestión de Sesiones
            </h2>
            <p className="text-body-sm text-text-secondary">
              Controla dónde has iniciado sesión
            </p>
          </div>
        </div>
        
        {sessions?.filter(s => !s?.isCurrent)?.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            iconName="LogOut"
            iconPosition="left"
            onClick={handleLogoutAllOther}
            loading={isLoading}
          >
            Cerrar Otras
          </Button>
        )}
      </div>
      {/* Current Session Info */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-3 mb-2">
          <Icon name="Shield" size={20} className="text-primary" />
          <h3 className="text-body-base font-medium text-primary">
            Sesión Actual
          </h3>
        </div>
        <p className="text-body-sm text-text-secondary">
          Esta es la sesión que estás usando ahora mismo. Se cerrará automáticamente 
          después de 30 días de inactividad por seguridad.
        </p>
      </div>
      {/* Sessions List */}
      <div className="space-y-4">
        {sessions?.map((session) => (
          <div 
            key={session?.id}
            className={`
              p-4 rounded-xl border transition-all duration-200
              ${session?.isCurrent 
                ? 'bg-primary/5 border-primary/20' :'bg-muted/30 border-border hover:bg-muted/50'
              }
            `}
          >
            <div className="flex items-start space-x-4">
              {/* Device Icon */}
              <div className={`
                w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
                ${session?.isCurrent ? 'bg-primary/20' : 'bg-muted'}
              `}>
                <Icon 
                  name={getDeviceIcon(session?.device)} 
                  size={20} 
                  className={session?.isCurrent ? 'text-primary' : 'text-text-secondary'} 
                />
              </div>
              
              {/* Session Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="text-body-base font-medium text-text-primary">
                    {session?.device}
                  </h4>
                  {session?.isCurrent && (
                    <span className="px-2 py-1 bg-primary/20 text-primary text-body-xs font-medium rounded-md">
                      Actual
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 text-body-sm text-text-secondary">
                  <div className="flex items-center space-x-2">
                    <Icon name="Globe" size={14} />
                    <span>{session?.browser} • {session?.os}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Icon name="MapPin" size={14} />
                    <span>{session?.location}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Icon name="Wifi" size={14} />
                    <span>{session?.ipAddress}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Icon name="Clock" size={14} />
                    <span>Última actividad: {formatLastActive(session?.lastActive)}</span>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              {!session?.isCurrent && (
                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="LogOut"
                    onClick={() => handleLogoutSession(session?.id)}
                    loading={isLoading}
                    className="text-error hover:text-error hover:border-error/50"
                  >
                    Cerrar
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Security Tips */}
      <div className="border-t border-border pt-6 mt-6">
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Icon name="AlertTriangle" size={20} className="text-warning flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-body-base font-medium text-text-primary mb-2">
                Consejos de Seguridad
              </h4>
              <div className="text-body-sm text-text-secondary space-y-1">
                <p>• Cierra sesión en dispositivos que no reconozcas</p>
                <p>• Revisa regularmente tus sesiones activas</p>
                <p>• Usa redes WiFi seguras para acceder a tu cuenta</p>
                <p>• Cambia tu contraseña si sospechas actividad no autorizada</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionManagement;