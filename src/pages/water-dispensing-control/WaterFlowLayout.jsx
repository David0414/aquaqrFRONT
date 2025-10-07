// src/pages/water-dispensing-control/WaterFlowLayout.jsx
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';

export default function WaterFlowLayout() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 h-16">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10">
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-text-primary">Dispensación de Agua</h1>
            <p className="text-sm text-text-secondary">Flujo guiado</p>
          </div>
          <div className="h-10 w-10" />
        </div>
      </header>

      <main className="px-4 py-6 pb-24">
        <Outlet />
      </main>

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
}
