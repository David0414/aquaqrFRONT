import React from 'react';
import Icon from '../../../components/AppIcon';

const ConnectionStatusIndicator = ({ status, machineInfo, onRetry }) => {
  const statusConfig = {
    connecting: {
      icon: 'Loader2',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20',
      title: 'Conectando...',
      message: 'Estableciendo conexión con la máquina',
      showRetry: false,
      animate: 'animate-spin'
    },
    connected: {
      icon: 'CheckCircle',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      title: 'Conectado',
      message: 'Conexión establecida correctamente',
      showRetry: false,
      animate: ''
    },
    error: {
      icon: 'XCircle',
      color: 'text-error',
      bgColor: 'bg-error/10',
      borderColor: 'border-error/20',
      title: 'Error de Conexión',
      message: 'No se pudo conectar con la máquina',
      showRetry: true,
      animate: ''
    },
    validating: {
      icon: 'Shield',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      title: 'Validando...',
      message: 'Verificando autenticidad del código QR',
      showRetry: false,
      animate: 'animate-pulse'
    },
    offline: {
      icon: 'WifiOff',
      color: 'text-text-secondary',
      bgColor: 'bg-muted',
      borderColor: 'border-border',
      title: 'Sin Conexión',
      message: 'Verifica tu conexión a internet',
      showRetry: true,
      animate: ''
    }
  };

  const config = statusConfig?.[status] || statusConfig?.error;

  if (!status || status === 'idle') {
    return null;
  }

  return (
    <div className={`
      fixed top-4 left-4 right-4 z-50 mx-auto max-w-md
      ${config?.bgColor} ${config?.borderColor} border rounded-lg p-4
      backdrop-blur-sm shadow-soft-lg
    `}>
      <div className="flex items-start space-x-3">
        <Icon 
          name={config?.icon} 
          size={20} 
          className={`${config?.color} ${config?.animate} flex-shrink-0 mt-0.5`}
        />
        
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium ${config?.color} text-sm`}>
            {config?.title}
          </h4>
          <p className="text-xs text-text-secondary mt-1">
            {config?.message}
          </p>
          
          {machineInfo && (
            <div className="mt-2 p-2 bg-background/50 rounded-md">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Máquina:</span>
                <span className="font-medium text-text-primary">
                  {machineInfo?.location} (ID: {machineInfo?.machineId})
                </span>
              </div>
            </div>
          )}
        </div>

        {config?.showRetry && onRetry && (
          <button
            onClick={onRetry}
            className={`
              p-1 rounded-md hover:bg-black/5 transition-colors
              ${config?.color} opacity-70 hover:opacity-100
            `}
            aria-label="Reintentar conexión"
          >
            <Icon name="RefreshCw" size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatusIndicator;