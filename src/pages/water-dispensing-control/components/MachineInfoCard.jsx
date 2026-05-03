import React from 'react';
import Icon from '../../../components/AppIcon';

const MachineInfoCard = ({
  machineId,
  location,
  connectionStatus,
  pricePerGarrafon = 35,
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
          text: 'Conectando',
        };
      default:
        return {
          color: 'text-error',
          bgColor: 'bg-error/10',
          borderColor: 'border-error/20',
          icon: 'WifiOff',
          text: 'Sin conexion',
        };
    }
  };

  const status = getStatusConfig(connectionStatus);

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-text-primary">Maquina #{machineId}</h3>
          <div className="mt-0.5 flex items-center space-x-2 text-text-secondary">
            <Icon name="MapPin" size={16} />
            <span className="truncate text-sm">{location}</span>
          </div>
        </div>

        <div className={`flex items-center space-x-2 rounded-lg border px-3 py-1.5 ${status.bgColor} ${status.borderColor}`}>
          <Icon
            name={status.icon}
            size={16}
            className={`${status.color} ${connectionStatus === 'connecting' ? 'animate-spin' : ''}`}
          />
          <span className={`text-sm font-medium ${status.color}`}>{status.text}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-border pt-3 sm:grid-cols-2">
        <div className="flex flex-col items-end text-right">
          <span className="text-xs text-text-secondary">Precio {garrafonLiters}L</span>
          <span className="text-xl font-semibold leading-tight text-primary tabular-nums">
            {money(pricePerGarrafon)}
          </span>
        </div>

        <div className="flex flex-col items-end text-right">
          <span className="text-xs text-text-secondary">Precio/L</span>
          <span className="text-xl font-semibold leading-tight text-text-primary tabular-nums">
            {money(pricePerLiter)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MachineInfoCard;
