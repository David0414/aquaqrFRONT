// src/pages/water-dispensing-control/components/MachineInfoCard.jsx
import React from 'react';
import Icon from '../../../components/AppIcon';

const MachineInfoCard = ({
  machineId,
  location,
  connectionStatus,         // 'connected' | 'connecting' | 'disconnected'
  pricePerGarrafon = 35,    // MXN
  garrafonLiters = 20,
  className = '',
}) => {
  const pricePerLiter = pricePerGarrafon / garrafonLiters;

  const money = (n) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(n);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'connected':
        return {
          color: 'text-success',
          bgColor: 'bg-success/10',
          borderColor: 'border-success/20',
          icon: 'Wifi',
          text: 'Conectado',
        };
      case 'connecting':
        return {
          color: 'text-warning',
          bgColor: 'bg-warning/10',
          borderColor: 'border-warning/20',
          icon: 'Loader',
          text: 'Conectando...',
        };
      default:
        return {
          color: 'text-error',
          bgColor: 'bg-error/10',
          borderColor: 'border-error/20',
          icon: 'WifiOff',
          text: 'Desconectado',
        };
    }
  };

  const status = getStatusConfig(connectionStatus);

  return (
    <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-text-primary truncate">
            Dispensador #{machineId}
          </h3>
          <div className="flex items-center space-x-2 text-text-secondary mt-0.5">
            <Icon name="MapPin" size={16} />
            <span className="text-sm truncate">{location}</span>
          </div>
        </div>

        <div
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${status.bgColor} ${status.borderColor}`}
        >
          <Icon
            name={status.icon}
            size={16}
            className={`${status.color} ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`}
          />
          <span className={`text-sm font-medium ${status.color}`}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
        {/* Garrafón */}
        <div className="flex flex-col items-end sm:items-end text-right">
          <span className="text-xs text-text-secondary">
            Precio por garrafón ({garrafonLiters}L)
          </span>
          <span className="text-xl font-semibold text-primary tabular-nums leading-tight">
            {money(pricePerGarrafon)}
          </span>
        </div>

        {/* Litro */}
        <div className="flex flex-col items-end sm:items-end text-right">
          <span className="text-xs text-text-secondary">Precio por litro</span>
          <span className="text-xl font-semibold text-text-primary tabular-nums leading-tight">
            {money(pricePerLiter)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MachineInfoCard;
