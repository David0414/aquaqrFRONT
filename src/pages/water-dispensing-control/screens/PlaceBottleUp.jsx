// src/pages/water-dispensing-control/screens/PlaceBottleUp.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { showErrorToast, showSuccessToast } from '../../../components/ui/NotificationToast';
import { useDispenseFlow } from '../FlowProvider';

export default function PlaceBottleUp() {
  const navigate = useNavigate();
  const { startDispense, selectedLiters } = useDispenseFlow();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);
      const tx = await startDispense(); // cobra del saldo y arranca
      showSuccessToast('Dispensado iniciado');
      navigate('/filling-progress', { state: { tx } });
    } catch (err) {
      if (err?.code === 'INSUFFICIENT_FUNDS') {
        navigate('/balance-recharge', {
          state: {
            returnTo: '/water/position-up',
            requiredAmount: err.requiredAmount,
            selectedLiters,
            fromInsufficientBalance: true,
          },
        });
      } else {
        showErrorToast(err?.message || 'Error al iniciar el dispensado');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-text-primary">Acomodar Garrafón</h2>

      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-32 h-32 rounded-2xl bg-success/10 flex items-center justify-center mb-6"
        >
          <Icon name="Target" size={44} className="text-success" />
        </motion.div>
        <h3 className="text-2xl font-bold text-text-primary mb-2">
          Colócalo <span className="text-success">boca arriba y centrado</span>
        </h3>
        <p className="text-text-secondary max-w-md">
          Asegúrate de que el cuello quede firme en el centro para evitar derrames.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => navigate('/water/position-down')}>
          <Icon name="ArrowLeft" size={18} /> Atrás
        </Button>
        <Button className="flex-1" onClick={handleStart} loading={loading}>
          <Icon name="Play" size={18} /> Iniciar dispensado
        </Button>
      </div>
    </div>
  );
}
