import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';


const RegistrationHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center space-y-6">
      {/* Back Button */}
      <div className="flex justify-start">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          iconName="ArrowLeft"
          iconPosition="left"
          className="text-text-secondary hover:text-text-primary"
        >
          Volver
        </Button>
      </div>

      {/* Logo */}
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-soft-lg">
          <Icon name="Droplets" size={32} className="text-white" strokeWidth={2.5} />
        </div>
      </div>

      {/* Title and Description */}
      <div className="space-y-3">
        <h1 className="text-heading-lg font-bold text-text-primary">
          Crear cuenta
        </h1>
        <p className="text-body-base text-text-secondary max-w-md mx-auto leading-relaxed">
          Únete a AquaQR y disfruta de agua purificada al instante. 
          Crea tu cuenta en segundos y comienza a dispensar agua de calidad.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-surface/50">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="Zap" size={20} className="text-primary" />
          </div>
          <span className="text-body-sm font-medium text-text-primary">Acceso instantáneo</span>
        </div>
        
        <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-surface/50">
          <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
            <Icon name="Shield" size={20} className="text-success" />
          </div>
          <span className="text-body-sm font-medium text-text-primary">100% seguro</span>
        </div>
        
        <div className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-surface/50">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
            <Icon name="Heart" size={20} className="text-accent" />
          </div>
          <span className="text-body-sm font-medium text-text-primary">Impacto social</span>
        </div>
      </div>
    </div>
  );
};

export default RegistrationHeader;