import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';

const PaymentMethodCard = ({ 
  method, 
  isSelected = false, 
  onClick,
  className = '' 
}) => {
  const paymentMethods = {
    mercadopago: {
      name: 'Mercado Pago',
      logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=60&fit=crop',
      description: 'Pago seguro y rápido',
      features: ['Tarjetas', 'Transferencia', 'Efectivo']
    },
    stripe: {
      name: 'Tarjeta de Crédito/Débito',
      logo: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=60&fit=crop',
      description: 'Visa, Mastercard, American Express',
      features: ['Seguro SSL', 'Procesamiento instantáneo']
    }
  };

  const methodData = paymentMethods?.[method];

  return (
    <button
      onClick={() => onClick(method)}
      className={`
        w-full p-4 rounded-xl border-2 transition-all duration-200 text-left
        ${isSelected 
          ? 'border-primary bg-primary/5 shadow-soft-md' 
          : 'border-border bg-card hover:border-primary/30 hover:bg-primary/2'
        }
        ${className}
      `}
    >
      <div className="flex items-center space-x-4">
        <div className="w-16 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          <Image 
            src={methodData?.logo} 
            alt={methodData?.name}
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">{methodData?.name}</h3>
            {isSelected && (
              <Icon name="CheckCircle" size={20} className="text-primary" />
            )}
          </div>
          <p className="text-text-secondary text-body-sm mt-1">
            {methodData?.description}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {methodData?.features?.map((feature, index) => (
              <span 
                key={index}
                className="text-xs px-2 py-1 bg-muted rounded-full text-text-secondary"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
};

export default PaymentMethodCard;