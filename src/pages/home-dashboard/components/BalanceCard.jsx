import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const BalanceCard = ({ balance, onRecharge, onDispense }) => {
  return (
    <div className="bg-gradient-to-br from-primary/5 to-accent/10 rounded-2xl p-6 border border-primary/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-text-secondary text-body-sm font-medium">Saldo Disponible</p>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-3xl font-bold text-primary">${balance?.toFixed(2)}</span>
            <span className="text-text-secondary text-body-sm">USD</span>
          </div>
        </div>
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
          <Icon name="Wallet" size={24} className="text-primary" />
        </div>
      </div>
      <div className="flex space-x-3">
        <Button 
          variant="default" 
          size="sm" 
          iconName="Plus" 
          iconPosition="left"
          onClick={onRecharge}
          className="flex-1"
        >
          Recargar
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          iconName="Droplets" 
          iconPosition="left"
          onClick={onDispense}
          className="flex-1"
        >
          Dispensar
        </Button>
      </div>
    </div>
  );
};

export default BalanceCard;