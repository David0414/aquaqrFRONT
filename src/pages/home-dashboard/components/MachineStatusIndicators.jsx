import React from 'react';
import Icon from '../../../components/AppIcon';

const MachineStatusIndicators = ({ recentMachines }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-success';
      case 'offline':
        return 'text-error';
      case 'maintenance':
        return 'text-warning';
      default:
        return 'text-secondary';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'En Línea';
      case 'offline':
        return 'Fuera de Línea';
      case 'maintenance':
        return 'Mantenimiento';
      default:
        return 'Desconocido';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return 'CheckCircle';
      case 'offline':
        return 'XCircle';
      case 'maintenance':
        return 'AlertTriangle';
      default:
        return 'HelpCircle';
    }
  };

  const formatLastUsed = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `Hace ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays}d`;
    }
  };

  if (!recentMachines || recentMachines?.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center">
          <Icon name="Clock" size={20} className="text-secondary" />
        </div>
        <div>
          <h3 className="text-heading-sm font-semibold text-text-primary">
            Máquinas Recientes
          </h3>
          <p className="text-text-secondary text-body-sm">
            Dispensadores que has utilizado
          </p>
        </div>
      </div>
      <div className="space-y-3">
        {recentMachines?.map((machine) => (
          <div
            key={machine?.id}
            className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/40 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center">
                <Icon name="Droplets" size={16} className="text-primary" />
              </div>
              <div>
                <h4 className="text-body-sm font-medium text-text-primary">
                  {machine?.name}
                </h4>
                <p className="text-caption text-text-secondary">
                  {machine?.location}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-caption text-text-secondary">
                {formatLastUsed(machine?.lastUsed)}
              </p>
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-caption font-medium text-primary">
                  Disponible
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
        <div className="flex items-center space-x-2">
          <Icon name="QrCode" size={16} className="text-primary" />
          <p className="text-caption text-primary">
            Escanea el QR de cualquier máquina para dispensar agua
          </p>
        </div>
      </div>
    </div>
  );
};

export default MachineStatusIndicators;