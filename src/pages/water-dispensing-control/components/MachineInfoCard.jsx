import React from 'react';
import Icon from '../../../components/AppIcon';

const MachineInfoCard = ({ 
  machineId, 
  location, 
  connectionStatus, 
  pricePerLiter,
  className = '' 
}) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          icon: 'Wifi',
          text: 'Conectado'
        };
      case 'connecting':
        return {
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          icon: 'Loader',
          text: 'Conectando...'
        };
      default:
        return {
          color: 'text-error',
          bgColor: 'bg-error/10',
          borderColor: 'border-error/20',
          icon: 'WifiOff',
          text: 'Desconectado'
        };
    }
  };

  const statusConfig = getStatusConfig(connectionStatus);

  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-text-primary mb-1">
            Dispensador #{machineId}
          </h3>
          <div className="flex items-center space-x-2 text-text-secondary">
            <Icon name="MapPin" size={16} />
            <span className="text-sm">{location}</span>
          </div>
        </div>
        
        <div className={`
          flex items-center space-x-2 px-3 py-1.5 rounded-lg border
          ${statusConfig?.bgColor} ${statusConfig?.borderColor}
        `}>
          <Icon 
            name={statusConfig?.icon} 
            size={16} 
            className={`${statusConfig?.color} ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`}
          />
          <span className={`text-sm font-medium ${statusConfig?.color}`}>
            {statusConfig?.text}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-sm text-text-secondary">Precio por litro</span>
        <span className="text-lg font-semibold text-primary">
          ${pricePerLiter?.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default MachineInfoCard;