import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const ManualMachineInput = ({ onMachineSubmit, isLoading }) => {
  const [machineId, setMachineId] = useState('');
  const [error, setError] = useState('');

  // Mock machine database for validation
  const validMachines = {
    '001': { id: '001', location: 'Plaza Central', status: 'active' },
    '002': { id: '002', location: 'Parque Norte', status: 'active' },
    '003': { id: '003', location: 'Centro Comercial', status: 'active' },
    '004': { id: '004', location: 'Universidad', status: 'maintenance' },
    '005': { id: '005', location: 'Hospital Regional', status: 'active' }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError('');

    if (!machineId?.trim()) {
      setError('Por favor ingresa el ID de la máquina');
      return;
    }

    const machine = validMachines?.[machineId?.trim()];
    
    if (!machine) {
      setError('ID de máquina no válido. Verifica el código e intenta nuevamente.');
      return;
    }

    if (machine?.status !== 'active') {
      setError('Esta máquina está temporalmente fuera de servicio.');
      return;
    }

    // Simulate validation delay
    setTimeout(() => {
      onMachineSubmit({
        machineId: machine?.id,
        location: machine?.location,
        qrData: `AQUA_MACHINE_${machine?.id}_LOC_${machine?.location?.replace(/\s+/g, '_')?.toUpperCase()}`,
        timestamp: new Date()?.toISOString(),
        method: 'manual'
      });
    }, 1000);
  };

  const handleInputChange = (e) => {
    const value = e?.target?.value?.replace(/\D/g, '')?.slice(0, 3);
    setMachineId(value);
    if (error) setError('');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="Hash" size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-text-primary">Acceso Manual</h3>
            <p className="text-sm text-text-secondary">Ingresa el ID de la máquina</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="ID de Máquina"
            type="text"
            placeholder="Ej: 001, 002, 003"
            value={machineId}
            onChange={handleInputChange}
            error={error}
            description="Encuentra el ID en la etiqueta de la máquina"
            maxLength={3}
            className="text-center text-lg font-mono"
          />

          <Button
            type="submit"
            variant="default"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!machineId?.trim() || isLoading}
            iconName="ArrowRight"
            iconPosition="right"
          >
            Conectar a Máquina
          </Button>
        </form>

        {/* Valid Machine IDs Hint */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-text-secondary mb-2">IDs disponibles para prueba:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(validMachines)?.map(([id, machine]) => (
              <button
                key={id}
                onClick={() => setMachineId(id)}
                className={`
                  px-2 py-1 text-xs rounded-md border transition-colors
                  ${machine?.status === 'active' ?'bg-success/10 text-success border-success/20 hover:bg-success/20' :'bg-warning/10 text-warning border-warning/20'
                  }
                `}
                disabled={isLoading}
              >
                {id} - {machine?.location}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualMachineInput;