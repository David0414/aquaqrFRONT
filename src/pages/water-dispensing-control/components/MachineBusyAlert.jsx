import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

function formatUnlockTime(expiresAt) {
  if (!expiresAt) return '';
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MachineBusyAlert({ error, onBackHome, className = '' }) {
  if (!error) return null;

  const unlockTime = formatUnlockTime(error.expiresAt);

  return (
    <div className={`rounded-xl border border-warning/30 bg-warning/10 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-warning/15">
          <Icon name="Lock" size={20} className="text-warning" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-text-primary">Maquina en uso</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Alguien mas esta usando esta maquina en este momento. Espera a que termine el dispensado o intenta de nuevo mas tarde.
          </p>
          {unlockTime ? (
            <p className="mt-2 text-xs font-medium text-warning">
              Reserva activa hasta aprox. {unlockTime}.
            </p>
          ) : null}
          {onBackHome ? (
            <Button variant="secondary" size="sm" className="mt-3" onClick={onBackHome}>
              <Icon name="Home" size={16} /> Ir al inicio
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
