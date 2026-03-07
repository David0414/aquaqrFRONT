// src/pages/water-dispensing-control/screens/SelectAmount.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import MachineInfoCard from '../components/MachineInfoCard';
import BottleSizeSelector from '../components/BottleSizeSelector';
import PricingCalculator from '../components/PricingCalculator';
import { showErrorToast, showSuccessToast } from '../../../components/ui/NotificationToast';
import { useDispenseFlow } from '../FlowProvider';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

const DEMO_ACTIONS = [
  { key: 'bomba_on', label: 'Bomba ON', variant: 'success' },
  { key: 'bomba_off', label: 'Bomba OFF', variant: 'secondary' },
  { key: 'valvula_enjuague_on', label: 'Enjuague ON', variant: 'success' },
  { key: 'valvula_enjuague_off', label: 'Enjuague OFF', variant: 'secondary' },
  { key: 'valvula_llenado_on', label: 'Llenado ON', variant: 'success' },
  { key: 'valvula_llenado_off', label: 'Llenado OFF', variant: 'secondary' },
  { key: 'inputs', label: 'Leer Inputs (7)', variant: 'outline' },
];

export default function SelectAmount() {
  const nav = useNavigate();
  const { getToken } = useAuth();
  const {
    machine, connectionStatus,
    allowedLiters, selectedLiters, setSelectedLiters,
    pricePerLiter, pricePerLiterCents,
    fetchConfig, fetchWallet, balanceCents,
  } = useDispenseFlow();
  const [viewMode, setViewMode] = useState('normal'); // normal | demo
  const [loadingAction, setLoadingAction] = useState('');
  const [demoResponse, setDemoResponse] = useState(null);

  useEffect(() => { fetchConfig(); fetchWallet(); }, []); // eslint-disable-line

  const canContinue = useMemo(() => viewMode === 'normal', [viewMode]);

  const handleDemoAction = async (action) => {
    try {
      setLoadingAction(action);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      const res = await fetch(`${API}/api/dispense/demo/control`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.detail || data?.error || 'Error enviando comando demo');

      setDemoResponse(data);
      showSuccessToast(`Comando "${action}" enviado`);
    } catch (err) {
      showErrorToast(err?.message || 'No se pudo enviar comando demo');
    } finally {
      setLoadingAction('');
    }
  };

  return (
    <div className="space-y-6">
      <MachineInfoCard
        machineId={machine.id}
        location={machine.location}
        connectionStatus={connectionStatus}
        pricePerGarrafon={(pricePerLiterCents * 20) / 100}
        garrafonLiters={20}
      />

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setViewMode('normal')}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            viewMode === 'normal'
              ? 'bg-primary text-primary-foreground'
              : 'text-text-secondary hover:bg-muted'
          }`}
        >
          Dispensar
        </button>
        <button
          type="button"
          onClick={() => setViewMode('demo')}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            viewMode === 'demo'
              ? 'bg-primary text-primary-foreground'
              : 'text-text-secondary hover:bg-muted'
          }`}
        >
          Demo
        </button>
      </div>

      {viewMode === 'normal' ? (
        <>
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
        </>
      ) : (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <h3 className="text-base font-semibold text-text-primary">Control Demo (Waterserver)</h3>
          <p className="text-sm text-text-secondary">
            Estos botones mandan comandos al backend para controlar tu waterserver (bomba/válvulas/inputs).
          </p>

          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACTIONS.map((item) => (
              <Button
                key={item.key}
                variant={item.variant}
                onClick={() => handleDemoAction(item.key)}
                loading={loadingAction === item.key}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-background p-3 text-sm">
            <p className="font-medium text-text-primary">Última respuesta</p>
            {demoResponse ? (
              <div className="mt-2 space-y-1 text-text-secondary">
                <p>Acción: <span className="font-medium text-text-primary">{demoResponse.action}</span></p>
                <p>Comando: <span className="font-medium text-text-primary">{demoResponse.command}</span></p>
                <p>Server: <span className="font-medium text-text-primary">{demoResponse.response || '-'}</span></p>
              </div>
            ) : (
              <p className="mt-2 text-text-secondary">Sin comandos enviados aún.</p>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => nav('/home-dashboard')}>
          <Icon name="X" size={18} /> Cancelar
        </Button>
        <Button className="flex-1" onClick={() => nav('/water/position-down')} disabled={!canContinue}>
          Continuar <Icon name="ArrowRight" size={18} />
        </Button>
      </div>
    </div>
  );
}
