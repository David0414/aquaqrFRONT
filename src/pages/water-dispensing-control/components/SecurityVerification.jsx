import React from 'react';
import Icon from '../../../components/AppIcon';

const SecurityVerification = ({ 
  machineId, 
  isVerified = false, 
  className = '' 
}) => {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-full
          ${isVerified 
            ? 'bg-success/10 text-success' :'bg-warning/10 text-warning'
          }
        `}>
          <Icon 
            name={isVerified ? 'ShieldCheck' : 'Shield'} 
            size={20} 
          />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-text-primary">
            {isVerified ? 'Dispensador verificado' : 'Verificando dispensador...'}
          </h4>
          <p className="text-sm text-text-secondary">
            {isVerified 
              ? `Dispensador #${machineId} autenticado correctamente`
              : 'Validando código QR y conexión segura'
            }
          </p>
        </div>
        
        {isVerified && (
          <Icon name="CheckCircle" size={20} className="text-success" />
        )}
      </div>
      {isVerified && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">Última verificación</span>
            <span className="text-text-primary font-medium">
              {new Date()?.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityVerification;