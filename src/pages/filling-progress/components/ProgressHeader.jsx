import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressHeader = ({ 
  machineId, 
  location, 
  connectionStatus, 
  onCancel 
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-background border-b border-border">
      <div className="flex items-center space-x-3">
        <button
          onClick={onCancel}
          className="p-2 rounded-lg hover:bg-muted transition-colors duration-200"
          aria-label="Cancelar dispensado"
        >
          <Icon name="ArrowLeft" size={20} className="text-text-secondary" />
        </button>
        
        <div>
          <h1 className="text-heading-sm font-semibold text-text-primary">
            Dispensando Agua
          </h1>
          <p className="text-body-sm text-text-secondary">
            Máquina {machineId} • {location}
          </p>
        </div>
      </div>

      <div className={`
        flex items-center space-x-2 px-3 py-1.5 rounded-full text-body-xs font-medium
        ${connectionStatus === 'connected' ?'bg-success/10 text-success' 
          : connectionStatus === 'connecting' ?'bg-warning/10 text-warning' :'bg-error/10 text-error'
        }
      `}>
        <div className={`
          w-2 h-2 rounded-full
          ${connectionStatus === 'connected' ?'bg-success animate-pulse' 
            : connectionStatus === 'connecting' ?'bg-warning animate-pulse' :'bg-error'
          }
        `} />
        <span>
          {connectionStatus === 'connected' && 'Conectado'}
          {connectionStatus === 'connecting' && 'Conectando...'}
          {connectionStatus === 'disconnected' && 'Desconectado'}
        </span>
      </div>
    </div>
  );
};

export default ProgressHeader;