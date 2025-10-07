// src/pages/water-dispensing-control/screens/SelectAmount.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import MachineInfoCard from '../components/MachineInfoCard';
import BottleSizeSelector from '../components/BottleSizeSelector';
import PricingCalculator from '../components/PricingCalculator';
import { useDispenseFlow } from '../FlowProvider';

export default function SelectAmount() {
  const nav = useNavigate();
  const {
    machine, connectionStatus,
    allowedLiters, selectedLiters, setSelectedLiters,
    pricePerLiter, pricePerLiterCents,
    fetchConfig, fetchWallet, balanceCents,
  } = useDispenseFlow();

  useEffect(() => { fetchConfig(); fetchWallet(); }, []); // eslint-disable-line

  return (
    <div className="space-y-6">
      <MachineInfoCard
        machineId={machine.id}
        location={machine.location}
        connectionStatus={connectionStatus}
        pricePerGarrafon={(pricePerLiterCents * 20) / 100}
        garrafonLiters={20}
      />

      <BottleSizeSelector
        allowedLiters={allowedLiters}
        selectedLiters={selectedLiters}
        onChange={setSelectedLiters}
        garrafonLiters={20}
      />

      <PricingCalculator
        selectedLiters={selectedLiters}
        pricePerLiter={pricePerLiter}
        currentBalance={(balanceCents ?? 0) / 100}
      />

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => nav('/home-dashboard')}>
          <Icon name="X" size={18} /> Cancelar
        </Button>
        <Button className="flex-1" onClick={() => nav('/water/position-down')}>
          Continuar <Icon name="ArrowRight" size={18} />
        </Button>
      </div>
    </div>
  );
}
