import React from 'react';
import Icon from '../../../components/AppIcon';

const SocialImpactCard = ({ totalDonations, impactMetrics }) => {
  const progressPercentage = Math.min((totalDonations / 1000) * 100, 100);
  
  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
          <Icon name="Heart" size={20} className="text-success" />
        </div>
        <div>
          <h3 className="text-heading-sm font-semibold text-text-primary">Impacto Social</h3>
          <p className="text-text-secondary text-body-sm">Tu contribución hace la diferencia</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-body-sm text-text-secondary">Donaciones Acumuladas</span>
            <span className="text-body-sm font-semibold text-success">${totalDonations?.toFixed(2)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-success to-success/80 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-caption text-text-secondary mt-1">
            Meta: $1,000 - {progressPercentage?.toFixed(0)}% completado
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{impactMetrics?.familiesHelped}</div>
            <div className="text-caption text-text-secondary">Familias Ayudadas</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{impactMetrics?.litersProvided}L</div>
            <div className="text-caption text-text-secondary">Agua Proporcionada</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialImpactCard;