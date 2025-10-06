// src/pages/water-dispensing-control/index.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';

import MachineInfoCard from './components/MachineInfoCard';
import BottleSizeSelector from './components/BottleSizeSelector';
import PricingCalculator from './components/PricingCalculator';
import DispenseButton from './components/DispenseButton';
import SecurityVerification from './components/SecurityVerification';
import NotificationToast, { showErrorToast, showInfoToast, showSuccessToast } from '../../components/ui/NotificationToast';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

// Puedes cambiar estos “mock” de máquina si quieres
const MOCK_MACHINE = {
  id: 'AQ-2024-001',
  location: 'Centro Comercial Plaza Norte, Local 15',
};

const WaterDispensingControl = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  // UI / estado de conexión simulado
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting | connected | disconnected
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Config desde backend (precio y opciones)
  const [pricePerLiterCents, setPricePerLiterCents] = useState(175); // fallback a $35/20L
  const [allowedLiters, setAllowedLiters] = useState([5, 10, 20]);

  // Saldo real del usuario
  const [balance, setBalance] = useState(0);

  // Selección (por defecto garrafón completo)
  const [selectedLiters, setSelectedLiters] = useState(20);

  const pricePerLiter = useMemo(() => (pricePerLiterCents || 0) / 100, [pricePerLiterCents]);
  const totalCost = useMemo(() => selectedLiters * pricePerLiter, [selectedLiters, pricePerLiter]);

  // 1) Trae config del backend (precio/env)
  const fetchConfig = async () => {
    try {
      const res = await fetch(`${API}/api/dispense/config`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo obtener config');

      setPricePerLiterCents(data.pricePerLiterCents);
      setAllowedLiters(data.allowedLiters || [5, 10, 20]);

      // Si por alguna razón el litro seleccionado no está en allowed, ajústalo
      if (!(data.allowedLiters || [5, 10, 20]).includes(selectedLiters)) {
        setSelectedLiters((data.allowedLiters || [5, 10, 20])[0]);
      }
    } catch (e) {
      showErrorToast(e.message || 'Error cargando configuración');
    }
  };

  // 2) Trae saldo real
  const fetchWallet = async () => {
    try {
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      const res = await fetch(`${API}/api/me/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No se pudo obtener el saldo');

      setBalance((data.balanceCents ?? 0) / 100);
    } catch (e) {
      showErrorToast(e.message || 'Error cargando saldo');
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchWallet();

    // simular conexión/verificación
    const t = setTimeout(() => {
      setConnectionStatus('connected');
      setIsVerified(true);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inicia dispensado (cobra en el backend y descuenta)
  const handleDispenseStart = async () => {
    try {
      setIsLoading(true);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });

      const res = await fetch(`${API}/api/dispense`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          liters: selectedLiters,
          machineId: MOCK_MACHINE.id,
          location: MOCK_MACHINE.location,
        }),
      });

      const data = await res.json();

      if (res.status === 400 && data?.error === 'INSUFFICIENT_FUNDS') {
        // mandar a recargar, preservando litros requeridos
        navigate('/balance-recharge', {
          state: {
            returnTo: '/water-dispensing-control',
            requiredAmount: Math.max(0, (data.amountCents - data.balanceCents) / 100),
            selectedLiters,
            fromInsufficientBalance: true,
          },
        });
        return;
      }

      if (!res.ok) throw new Error(data.error || 'No se pudo iniciar el dispensado');

      // Actualiza saldo local
      setBalance((data.newBalanceCents ?? 0) / 100);

      // Navega a “progreso” (si quieres mantener esa pantalla)
      navigate('/filling-progress', {
        state: {
          liters: selectedLiters,
          cost: (data.amountCents || 0) / 100,
          startTime: Date.now(),
        },
      });

      showSuccessToast('Dispensado iniciado y cobrado');
    } catch (e) {
      showErrorToast(e.message || 'Error al dispensar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <Button variant="ghost" size="icon" onClick={() => navigate('/home-dashboard')} className="h-10 w-10">
            <Icon name="ArrowLeft" size={20} />
          </Button>

          <div className="text-center">
            <h1 className="text-lg font-semibold text-text-primary">Control de Despachado</h1>
            <p className="text-sm text-text-secondary">Selecciona y dispensa agua purificada</p>
          </div>

          <Button variant="ghost" size="icon" onClick={() => showInfoToast('Soporte: +52 55 0000 0000')} className="h-10 w-10">
            <Icon name="HelpCircle" size={20} />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="px-4 py-6 pb-20 space-y-6">
 
        <MachineInfoCard
          machineId={MOCK_MACHINE.id}
          location={MOCK_MACHINE.location}
          connectionStatus={connectionStatus}
          pricePerGarrafon={(pricePerLiterCents * 20) / 100}  // $/garrafón desde config
          garrafonLiters={20}
        />

        <BottleSizeSelector
          allowedLiters={allowedLiters}
          selectedLiters={selectedLiters}
          onChange={setSelectedLiters}          // <— ya coincide
          garrafonLiters={20}
        />


        <PricingCalculator
          selectedLiters={selectedLiters}
          pricePerLiter={pricePerLiter}
          currentBalance={balance}
        />

        <DispenseButton
          selectedLiters={selectedLiters}
          totalCost={totalCost}
          currentBalance={balance}
          connectionStatus={connectionStatus}
          onDispenseStart={handleDispenseStart}
          isLoading={isLoading}
        />

        <div className="bg-surface border border-border rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Icon name="Info" size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-text-primary">Información importante</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• El saldo se descuenta al iniciar el dispensado</li>
                <li>• Conexión simulada; cuando tengas el ESP32, llama tu API interna aquí</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
};

export default WaterDispensingControl;
