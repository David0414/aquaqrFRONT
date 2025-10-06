import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BalanceTopUpShortcuts = () => {
  const navigate = useNavigate();
  
  const presetAmounts = [
    { amount: 30, popular: false },
    { amount: 50, popular: true },
    { amount: 100, popular: false },
    { amount: 200, popular: false }
  ];

  const handleQuickRecharge = (amount) => {
    // Navigate to recharge page with preset amount
    navigate('/balance-recharge', { 
      state: { presetAmount: amount } 
    });
  };

  const handleCustomRecharge = () => {
    navigate('/balance-recharge');
  };

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
          <Icon name="Zap" size={20} className="text-accent" />
        </div>
        <div>
          <h3 className="text-heading-sm font-semibold text-text-primary">
            Recarga Rápida
          </h3>
          <p className="text-text-secondary text-body-sm">
            Añade fondos con un toque
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {presetAmounts?.map((preset) => (
          <button
            key={preset?.amount}
            onClick={() => handleQuickRecharge(preset?.amount)}
            className={`
              relative p-4 rounded-xl border-2 text-center
              hover:scale-105 active:scale-95 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary/20
              ${preset?.popular 
                ? 'border-primary bg-primary/5 text-primary' :'border-border bg-background hover:border-primary/30'
              }
            `}
          >
            {preset?.popular && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-caption px-2 py-1 rounded-full">
                  Popular
                </span>
              </div>
            )}
            <div className="text-lg font-bold text-text-primary">
              ${preset?.amount}
            </div>
            <div className="text-caption text-text-secondary">
              MXN
            </div>
          </button>
        ))}
      </div>
      <Button
        variant="outline"
        fullWidth
        iconName="Plus"
        iconPosition="left"
        onClick={handleCustomRecharge}
      >
        Cantidad Personalizada
      </Button>
    </div>
  );
};

export default BalanceTopUpShortcuts;