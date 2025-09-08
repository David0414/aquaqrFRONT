import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';

const SocialImpactSection = ({ impactData, className = '' }) => {
  const [animateValues, setAnimateValues] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateValues(true);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const impactMetrics = [
    {
      icon: 'Leaf',
      label: 'CO₂ Reducido',
      value: impactData?.co2Reduced,
      unit: 'kg',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      icon: 'Recycle',
      label: 'Plástico Evitado',
      value: impactData?.plasticAvoided,
      unit: 'botellas',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: 'Heart',
      label: 'Donación Acumulada',
      value: impactData?.totalDonation,
      unit: '$',
      color: 'text-error',
      bgColor: 'bg-error/10'
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Impact Header */}
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center">
            <Icon name="Globe" size={32} className="text-success" />
          </div>
        </div>
        <h2 className="text-heading-base font-bold text-text-primary">
          ¡Tu Impacto Positivo!
        </h2>
        <p className="text-body-base text-text-secondary">
          Cada litro cuenta para un mundo mejor
        </p>
      </div>
      {/* Impact Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {impactMetrics?.map((metric, index) => (
          <div
            key={index}
            className={`
              bg-card rounded-2xl p-4 border border-border text-center
              transition-all duration-500 ease-out
              ${animateValues ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
            `}
            style={{ transitionDelay: `${index * 100}ms` }}
          >
            <div className={`w-12 h-12 ${metric?.bgColor} rounded-xl flex items-center justify-center mx-auto mb-3`}>
              <Icon name={metric?.icon} size={24} className={metric?.color} />
            </div>
            <div className="space-y-1">
              <p className={`text-heading-sm font-bold ${metric?.color}`}>
                {metric?.unit === '$' ? '$' : ''}{metric?.value}{metric?.unit !== '$' ? ` ${metric?.unit}` : ''}
              </p>
              <p className="text-body-xs text-text-secondary">
                {metric?.label}
              </p>
            </div>
          </div>
        ))}
      </div>
      {/* Progress Bar */}
      <div className="bg-surface rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-body-sm font-medium text-text-primary">
            Progreso de Donación Mensual
          </span>
          <span className="text-body-sm text-text-secondary">
            {impactData?.monthlyProgress}%
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div 
            className={`
              h-full bg-gradient-to-r from-primary to-accent rounded-full
              transition-all duration-1000 ease-out
              ${animateValues ? 'w-full' : 'w-0'}
            `}
            style={{ width: animateValues ? `${impactData?.monthlyProgress}%` : '0%' }}
          />
        </div>
        <p className="text-body-xs text-text-secondary mt-2 text-center">
          ${impactData?.monthlyDonated} de ${impactData?.monthlyGoal} donados este mes
        </p>
      </div>
      {/* Achievement Badge */}
      {impactData?.newAchievement && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Icon name="Award" size={24} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-body-sm font-semibold text-primary">
                ¡Nuevo Logro Desbloqueado!
              </p>
              <p className="text-body-xs text-text-secondary">
                {impactData?.achievementText}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialImpactSection;