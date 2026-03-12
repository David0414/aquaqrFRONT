import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { showErrorToast } from '../../../components/ui/NotificationToast';
import { useDispenseFlow } from '../FlowProvider';

export default function PlaceBottleDown() {
  const nav = useNavigate();
  const { machine, sendStageCommand } = useDispenseFlow();
  const [rinseStatus, setRinseStatus] = useState('sending');
  const [rinseMessage, setRinseMessage] = useState('Activando enjuague...');
  const [isAdvancing, setIsAdvancing] = useState(false);

  const triggerRinse = async () => {
    try {
      setRinseStatus('sending');
      setRinseMessage('Activando enjuague...');
      await sendStageCommand('enjuague');
      setRinseStatus('success');
      setRinseMessage('Enjuague activado. Mantelo boca abajo hasta que la luz cambie.');
    } catch (err) {
      const message = err?.message || 'No se pudo activar el enjuague';
      setRinseStatus('error');
      setRinseMessage(message);
      showErrorToast(message);
    }
  };

  useEffect(() => {
    triggerRinse();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNext = async () => {
    try {
      setIsAdvancing(true);
      await sendStageCommand('enjuague');
      nav('/water/position-up');
    } catch (err) {
      showErrorToast(err?.message || 'No se pudo reenviar el enjuague');
    } finally {
      setIsAdvancing(false);
    }
  };

  const statusClasses =
    rinseStatus === 'success'
      ? 'border-success/20 bg-success/10 text-success'
      : rinseStatus === 'error'
        ? 'border-error/20 bg-error/10 text-error'
        : 'border-warning/20 bg-warning/10 text-warning';

  const statusIcon =
    rinseStatus === 'success'
      ? 'CheckCircle2'
      : rinseStatus === 'error'
        ? 'AlertCircle'
        : 'Loader';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Preparar Garrafon</h2>
        <span className="text-sm text-text-secondary">Maquina #{machine.id}</span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <motion.div
          animate={{ rotate: [0, -15, 0], y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-2xl bg-primary/10"
        >
          <Icon name="Droplets" size={44} className="text-primary" />
        </motion.div>

        <h3 className="mb-2 text-2xl font-bold text-text-primary">
          Coloca el garrafon <span className="text-primary">boca abajo</span>
        </h3>
        <p className="mx-auto max-w-md text-text-secondary">
          Para enjuagar y sanitizar el cuello del garrafon. Mantenlo asi hasta que la luz cambie.
        </p>

        <div className={`mx-auto mt-6 max-w-lg rounded-xl border px-4 py-3 text-sm ${statusClasses}`}>
          <div className="flex items-center justify-center gap-2">
            <Icon name={statusIcon} size={18} className={rinseStatus === 'sending' ? 'animate-spin' : ''} />
            <span className="font-medium">{rinseMessage}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => nav('/water/choose')}>
          <Icon name="ArrowLeft" size={18} /> Atras
        </Button>
        <Button className="flex-1" onClick={handleNext} disabled={rinseStatus === 'sending'} loading={isAdvancing}>
          Siguiente <Icon name="ArrowRight" size={18} />
        </Button>
      </div>

      {rinseStatus === 'error' ? (
        <Button variant="outline" onClick={triggerRinse}>
          Reintentar enjuague
        </Button>
      ) : null}
    </div>
  );
}
