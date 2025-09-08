import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentMachinesCard = ({ onMachineSelect, isLoading }) => {
  // Mock recent machines data
  const recentMachines = [
    {
      id: '001',
      location: 'Plaza Central',
      address: 'Av. Principal 123',
      lastUsed: '2025-01-05T10:30:00Z',
      status: 'active',
      distance: '0.2 km'
    },
    {
      id: '002',
      location: 'Parque Norte',
      address: 'Calle Verde 456',
      lastUsed: '2025-01-04T15:45:00Z',
      status: 'active',
      distance: '0.8 km'
    },
    {
      id: '003',
      location: 'Centro Comercial',
      address: 'Plaza Shopping, Local 12',
      lastUsed: '2025-01-03T12:20:00Z',
      status: 'active',
      distance: '1.2 km'
    }
  ];

  const formatLastUsed = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Hace menos de 1 hora';
    if (diffInHours < 24) return `Hace ${diffInHours} horas`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} días`;
  };

  const handleMachineSelect = (machine) => {
    onMachineSelect({
      machineId: machine?.id,
      location: machine?.location,
      qrData: `AQUA_MACHINE_${machine?.id}_LOC_${machine?.location?.replace(/\s+/g, '_')?.toUpperCase()}`,
      timestamp: new Date()?.toISOString(),
      method: 'recent'
    });
  };

  if (recentMachines?.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Icon name="Clock" size={20} className="text-accent" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Máquinas Recientes</h3>
            <p className="text-sm text-text-secondary">Acceso rápido a tus dispensadores</p>
          </div>
        </div>

        <div className="space-y-3">
          {recentMachines?.map((machine) => (
            <div
              key={machine?.id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="MapPin" size={16} className="text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-text-primary truncate">
                      {machine?.location}
                    </h4>
                    <span className="text-xs text-text-secondary bg-background px-2 py-0.5 rounded-full">
                      ID: {machine?.id}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary truncate">
                    {machine?.address}
                  </p>
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-xs text-text-secondary">
                      {formatLastUsed(machine?.lastUsed)}
                    </span>
                    <span className="text-xs text-text-secondary">
                      📍 {machine?.distance}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMachineSelect(machine)}
                disabled={isLoading || machine?.status !== 'active'}
                iconName="ArrowRight"
                iconPosition="right"
                className="ml-3 flex-shrink-0"
              >
                Conectar
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-primary">
              Las máquinas recientes se guardan automáticamente para acceso rápido. 
              Los datos se mantienen seguros en tu dispositivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecentMachinesCard;