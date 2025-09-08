import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const ActionButtons = ({ onDispenseMore, className = '' }) => {
  const navigate = useNavigate();

  const handleReturnToDashboard = () => {
    navigate('/home-dashboard');
  };

  const handleViewHistory = () => {
    navigate('/transaction-history');
  };

  const handleDispenseMore = () => {
    if (onDispenseMore) {
      onDispenseMore();
    } else {
      navigate('/water-dispensing-control');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Primary Action */}
      <Button
        variant="default"
        size="lg"
        fullWidth
        iconName="Home"
        iconPosition="left"
        onClick={handleReturnToDashboard}
        className="bg-gradient-to-r from-primary to-accent text-white"
      >
        Volver al Inicio
      </Button>

      {/* Secondary Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="default"
          fullWidth
          iconName="Droplets"
          iconPosition="left"
          onClick={handleDispenseMore}
          className="border-primary/20 text-primary hover:bg-primary/5"
        >
          Dispensar Más
        </Button>

        <Button
          variant="outline"
          size="default"
          fullWidth
          iconName="History"
          iconPosition="left"
          onClick={handleViewHistory}
          className="border-border text-text-secondary hover:bg-muted"
        >
          Ver Historial
        </Button>
      </div>

      {/* Help Section */}
      <div className="pt-4 border-t border-border">
        <div className="text-center space-y-2">
          <p className="text-body-sm text-text-secondary">
            ¿Necesitas ayuda con tu transacción?
          </p>
          <Button
            variant="ghost"
            size="sm"
            iconName="HelpCircle"
            iconPosition="left"
            onClick={() => {
              if (window.showToast) {
                window.showToast('Contacta con soporte: soporte@aquaqr.com', 'info', 8000);
              }
            }}
            className="text-primary hover:bg-primary/5"
          >
            Contactar Soporte
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ActionButtons;