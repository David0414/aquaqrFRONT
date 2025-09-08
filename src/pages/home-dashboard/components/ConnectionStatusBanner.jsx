import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const ConnectionStatusBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      // Hide success banner after 3 seconds
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const dismissBanner = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className={`
      fixed top-4 left-4 right-4 z-50 rounded-lg border backdrop-blur-sm
      ${isOnline 
        ? 'bg-success/10 border-success/20 text-success' :'bg-warning/10 border-warning/20 text-warning'
      }
      animate-scale-in shadow-soft-lg
    `}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Icon 
            name={isOnline ? "Wifi" : "WifiOff"} 
            size={20} 
            className={isOnline ? "text-success" : "text-warning"}
          />
          <div>
            <p className="text-body-sm font-medium">
              {isOnline ? 'Conexión Restaurada' : 'Sin Conexión a Internet'}
            </p>
            <p className="text-caption opacity-80">
              {isOnline 
                ? 'Todas las funciones están disponibles' :'Algunas funciones pueden no estar disponibles'
              }
            </p>
          </div>
        </div>
        
        <button
          onClick={dismissBanner}
          className="p-1 rounded-md hover:bg-black/5 transition-colors duration-200 opacity-60 hover:opacity-100"
          aria-label="Cerrar notificación"
        >
          <Icon name="X" size={16} />
        </button>
      </div>
    </div>
  );
};

export default ConnectionStatusBanner;