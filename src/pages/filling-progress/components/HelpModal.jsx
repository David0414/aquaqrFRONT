import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const HelpModal = ({ isOpen, onClose }) => {
  const helpOptions = [
    {
      icon: "MessageCircle",
      title: "Chat en Vivo",
      description: "Habla con nuestro equipo de soporte",
      action: "Iniciar chat"
    },
    {
      icon: "Phone",
      title: "Llamar Soporte",
      description: "Línea directa 24/7",
      action: "Llamar ahora",
      phone: "+1 (555) 123-4567"
    },
    {
      icon: "Mail",
      title: "Enviar Email",
      description: "Respuesta en menos de 2 horas",
      action: "Enviar email",
      email: "soporte@aquaqr.com"
    },
    {
      icon: "AlertCircle",
      title: "Reportar Problema",
      description: "Problema con la máquina o dispensado",
      action: "Reportar"
    }
  ];

  const troubleshootingSteps = [
    "Verifica que la máquina esté conectada (luz verde)",
    "Asegúrate de que tu recipiente esté bien colocado",
    "Revisa que tengas saldo suficiente",
    "Si el problema persiste, contacta soporte"
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-heading-sm font-semibold text-text-primary">
            ¿Necesitas Ayuda?
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted transition-colors duration-200"
            aria-label="Cerrar ayuda"
          >
            <Icon name="X" size={20} className="text-text-secondary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Troubleshooting */}
          <div>
            <h3 className="text-body-lg font-semibold text-text-primary mb-3">
              Solución Rápida
            </h3>
            <div className="space-y-2">
              {troubleshootingSteps?.map((step, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-body-xs font-medium text-primary">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-body-sm text-text-secondary">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Options */}
          <div>
            <h3 className="text-body-lg font-semibold text-text-primary mb-3">
              Contactar Soporte
            </h3>
            <div className="space-y-3">
              {helpOptions?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (option?.phone) {
                      window.open(`tel:${option?.phone}`);
                    } else if (option?.email) {
                      window.open(`mailto:${option?.email}`);
                    }
                  }}
                  className="w-full flex items-center space-x-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors duration-200 text-left"
                >
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon name={option?.icon} size={20} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-body-sm font-medium text-text-primary">
                      {option?.title}
                    </p>
                    <p className="text-body-xs text-text-secondary">
                      {option?.description}
                    </p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-text-secondary" />
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Stop */}
          <div className="p-4 bg-error/10 rounded-lg border border-error/20">
            <div className="flex items-center space-x-3 mb-3">
              <Icon name="AlertTriangle" size={20} className="text-error" />
              <h4 className="text-body-sm font-semibold text-error">
                Parada de Emergencia
              </h4>
            </div>
            <p className="text-body-xs text-text-secondary mb-3">
              Si hay algún problema de seguridad, puedes detener el dispensado inmediatamente.
            </p>
            <Button 
              variant="destructive" 
              size="sm" 
              fullWidth
              iconName="Square"
              onClick={() => {
                // Emergency stop logic would go here
                onClose();
              }}
            >
              Detener Dispensado
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;