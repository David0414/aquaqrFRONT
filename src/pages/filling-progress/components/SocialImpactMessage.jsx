import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const SocialImpactMessage = ({ donationAmount = 0 }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const impactMessages = [
    {
      icon: "Droplets",
      title: "Agua Purificada",
      message: `Estás recibiendo agua purificada con tecnología de última generación.\nCada litro pasa por 7 etapas de filtración.`,
      highlight: "99.9% pura"
    },
    {
      icon: "Heart",
      title: "Impacto Social",
      message: `Con tu compra, has contribuido $${donationAmount?.toFixed(2)} a comunidades sin acceso al agua potable.\nJuntos hemos donado más de $15,000 este año.`,
      highlight: "Gracias por ayudar"
    },
    {
      icon: "Leaf",
      title: "Cuidado Ambiental",
      message: `Al usar nuestro servicio, evitas el consumo de 2 botellas plásticas.\nHasta ahora has evitado 847 botellas plásticas.`,
      highlight: "Planeta más limpio"
    },
    {
      icon: "Users",
      title: "Comunidad AquaQR",
      message: `Eres parte de una comunidad de 12,450 usuarios comprometidos.\nJuntos hemos dispensado 2.3 millones de litros de agua pura.`,
      highlight: "Unidos por el agua"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => 
        (prev + 1) % impactMessages?.length
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [impactMessages?.length]);

  const currentMessage = impactMessages?.[currentMessageIndex];

  return (
    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
      <div className="text-center space-y-4">
        {/* Icon */}
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Icon 
            name={currentMessage?.icon} 
            size={32} 
            className="text-primary"
          />
        </div>

        {/* Title */}
        <h3 className="text-heading-sm font-semibold text-text-primary">
          {currentMessage?.title}
        </h3>

        {/* Message */}
        <p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-line">
          {currentMessage?.message}
        </p>

        {/* Highlight */}
        <div className="inline-block px-4 py-2 bg-primary/10 rounded-full">
          <span className="text-body-sm font-medium text-primary">
            {currentMessage?.highlight}
          </span>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center space-x-2 pt-2">
          {impactMessages?.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentMessageIndex 
                  ? 'bg-primary scale-125' :'bg-border'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialImpactMessage;