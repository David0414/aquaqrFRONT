// src/pages/transaction-complete/index.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';

function money(n){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2}).format(n);}

export default function SuccessReceipt() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const flow = useDispenseFlow();
  const tx = state?.tx || flow?.lastTx;

  if (!tx) {
    navigate('/water/choose', { replace: true });
    return null;
  }

  const liters = tx.liters;
  const totalCost = (tx.amountCents ?? 0) / 100;
  const remaining = (tx.newBalanceCents ?? 0) / 100;

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-xl mx-auto bg-card border border-border rounded-2xl p-8 space-y-6 print:border-0 print:shadow-none">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <Icon name="CheckCircle" size={34} className="text-success" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">¡Dispensado Exitoso!</h1>
          <p className="text-text-secondary">Tu agua purificada ha sido dispensada correctamente.</p>
        </div>

        <div className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center justify-between py-2">
            <span className="text-text-secondary">Cantidad dispensada</span>
            <span className="text-xl font-semibold text-text-primary">{liters} L</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-text-secondary">Costo total</span>
            <span className="text-xl font-semibold text-text-primary">{money(totalCost)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-border mt-2 pt-4">
            <span className="text-text-secondary">Saldo restante</span>
            <span className="text-xl font-semibold text-success">{money(remaining)}</span>
          </div>
        </div>

        <div className="text-sm text-text-secondary">
          <p><strong>Ubicación:</strong> {tx.location}</p>
          <p><strong>ID Máquina:</strong> {tx.machineId} {tx.txId ? `• TX: ${tx.txId}` : ''}</p>
          <p><strong>Fecha:</strong> {new Date(tx.at ?? Date.now()).toLocaleString('es-MX')}</p>
        </div>

        <div className="flex gap-3 print:hidden">
          <Button variant="secondary" className="flex-1" onClick={() => navigate('/home-dashboard')}>
            <Icon name="Home" size={18}/> Inicio
          </Button>
          <Button className="flex-1" onClick={() => window.print()}>
            <Icon name="Download" size={18}/> Descargar PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
