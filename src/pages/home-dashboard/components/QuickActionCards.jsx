import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';

const QuickActionCards = () => {
  const navigate = useNavigate();
  
  const quickActions = [
    {
      id: 'dispense',
      title: 'Dispensar Agua',
      description: 'Escanea QR y dispensa',
      icon: 'Droplets',
      color: 'primary',
      path: '/water-dispensing-control'
    },
    {
      id: 'recharge',
      title: 'Recargar Saldo',
      description: 'Añade fondos a tu cuenta',
      icon: 'CreditCard',
      color: 'accent',
      path: '/balance-recharge'
    },
    {
      id: 'history',
      title: 'Historial',
      description: 'Ver transacciones',
      icon: 'History',
      color: 'secondary',
      path: '/transaction-history'
    }
  ];

  const handleActionClick = (path) => {
    navigate(path);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {quickActions?.map((action) => (
        <button
          key={action?.id}
          onClick={() => handleActionClick(action?.path)}
          className={`
            bg-card rounded-2xl p-6 border border-border text-left
            hover:shadow-soft-lg hover:scale-105 active:scale-95
            transition-all duration-200 ease-out-custom
            focus:outline-none focus:ring-2 focus:ring-primary/20
          `}
        >
          <div className="flex items-center space-x-4">
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              ${action?.color === 'primary' ? 'bg-primary/10' : ''}
              ${action?.color === 'accent' ? 'bg-accent/10' : ''}
              ${action?.color === 'secondary' ? 'bg-secondary/10' : ''}
            `}>
              <Icon 
                name={action?.icon} 
                size={24} 
                className={`
                  ${action?.color === 'primary' ? 'text-primary' : ''}
                  ${action?.color === 'accent' ? 'text-accent' : ''}
                  ${action?.color === 'secondary' ? 'text-secondary' : ''}
                `}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-heading-sm font-semibold text-text-primary mb-1">
                {action?.title}
              </h3>
              <p className="text-body-sm text-text-secondary">
                {action?.description}
              </p>
            </div>
            <Icon name="ChevronRight" size={20} className="text-text-secondary" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActionCards;