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
    <div className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 ${className}`}>
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-2xl">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-error/40 text-error">
          <Icon name="X" size={42} strokeWidth={2.5} />
        </div>

        <h3 className="mt-4 text-xl font-bold text-text-primary">Maquina en uso</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-secondary">
          Alguien mas esta usando esta maquina en este momento. Espera a que termine el dispensado o intenta de nuevo mas tarde.
        </p>
        {unlockTime ? (
          <p className="mt-2 text-xs font-medium text-warning">
            Reserva activa hasta aprox. {unlockTime}.
          </p>
        ) : null}
        {onBackHome ? (
          <Button variant="default" size="sm" className="mt-5 min-w-32" onClick={onBackHome}>
            <Icon name="Home" size={16} /> Ir a inicio
          </Button>
        ) : null}
      </div>
    </div>
  );
}
