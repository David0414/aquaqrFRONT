import React from 'react';
import Image from '../../../components/AppImage';
import Icon from '../../../components/AppIcon';

const PaymentMethodCard = ({ 
  method, 
  isSelected = false, 
  onClick,
  pressable = false,
  className = '' 
}) => {
  const paymentMethods = {
    coins: {
      name: 'Recarga con Monedas',
      iconName: 'Coins',
      description: 'Inserta monedas en la maquina para abonar saldo',
      features: ['Moneda de 1, 5 y 10', 'Saldo en vivo']
    },
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
        w-full p-4 rounded-xl border-2 text-left
        transition-[transform,box-shadow,border-color,background-color] duration-150 ease-out
        ${isSelected 
          ? 'border-primary bg-primary/5 shadow-soft-md' 
          : 'border-border bg-card hover:border-primary/30 hover:bg-primary/2'
        }
        ${pressable ? 'shadow-[0_10px_22px_rgba(15,23,42,0.10)] hover:-translate-y-0.5 active:translate-y-[2px] active:scale-[0.985] active:shadow-[0_4px_10px_rgba(15,23,42,0.16)]' : ''}
        ${className}
      `}
    >
      <div className="flex items-center space-x-4">
        <div className="w-16 h-10 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {methodData?.logo ? (
            <Image 
              src={methodData?.logo} 
              alt={methodData?.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon name={methodData?.iconName || 'Wallet'} size={22} className="text-primary" />
          )}
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
