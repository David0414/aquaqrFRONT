// src/pages/water-dispensing-control/screens/PlaceBottleDown.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { useDispenseFlow } from '../FlowProvider';

export default function PlaceBottleDown() {
  const nav = useNavigate();
  const { machine } = useDispenseFlow();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Preparar Garrafón</h2>
        <span className="text-sm text-text-secondary">Máquina #{machine.id}</span>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center text-center">
        <motion.div
          animate={{ rotate: [0, -15, 0], y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
          className="w-32 h-32 rounded-2xl bg-primary/10 flex items-center justify-center mb-6"
        >
          <Icon name="Droplets" size={44} className="text-primary" />
        </motion.div>
        <h3 className="text-2xl font-bold text-text-primary mb-2">
          Coloca el garrafón <span className="text-primary">boca abajo</span>
        </h3>
        <p className="text-text-secondary max-w-md">
          Para enjuagar y sanitizar el cuello del garrafón. Manténlo así hasta que la luz cambie.
        </p>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={() => nav('/water/choose')}>
          <Icon name="ArrowLeft" size={18} /> Atrás
        </Button>
        <Button className="flex-1" onClick={() => nav('/water/position-up')}>
          Siguiente <Icon name="ArrowRight" size={18} />
        </Button>
      </div>
    </div>
  );
}
