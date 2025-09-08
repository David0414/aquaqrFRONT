import React from 'react';
import Icon from '../../../components/AppIcon';

const PromotionalBanner = ({ className = '' }) => {
  const promotions = [
    {
      id: 1,
      title: "¡Recarga $100 y obtén $10 extra!",
      description: "Promoción válida hasta fin de mes",
      icon: "Gift",
      bgColor: "bg-gradient-to-r from-success/10 to-success/5",
      borderColor: "border-success/20",
      textColor: "text-success"
    },
    {
      id: 2,
      title: "Contribuye al medio ambiente",
      description: "Cada recarga ayuda a purificar 100L adicionales para comunidades",
      icon: "Leaf",
      bgColor: "bg-gradient-to-r from-primary/10 to-primary/5",
      borderColor: "border-primary/20",
      textColor: "text-primary"
    }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      {promotions?.map((promo) => (
        <div
          key={promo?.id}
          className={`
            p-4 rounded-xl border ${promo?.bgColor} ${promo?.borderColor}
          `}
        >
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg bg-white/50 ${promo?.textColor}`}>
              <Icon name={promo?.icon} size={20} />
            </div>
            <div className="flex-1">
              <h3 className={`font-semibold ${promo?.textColor} mb-1`}>
                {promo?.title}
              </h3>
              <p className="text-text-secondary text-body-sm">
                {promo?.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PromotionalBanner;