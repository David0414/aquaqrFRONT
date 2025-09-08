import React from 'react';
import Icon from '../../../components/AppIcon';

const InstructionsPanel = ({ className = '' }) => {
  const instructions = [
    {
      icon: 'QrCode',
      title: 'Escanea el Código QR',
      description: 'Apunta tu cámara hacia el código QR ubicado en la máquina dispensadora',
      tips: ['Mantén el teléfono estable', 'Asegúrate de tener buena iluminación']
    },
    {
      icon: 'Hash',
      title: 'O Ingresa el ID Manual',
      description: 'Si no puedes escanear, ingresa el ID de 3 dígitos de la máquina',
      tips: ['Encuentra el ID en la etiqueta frontal', 'Verifica que esté activa']
    },
    {
      icon: 'Clock',
      title: 'Acceso Rápido',
      description: 'Usa máquinas recientes para conectarte más rápido',
      tips: ['Se guardan automáticamente', 'Ordenadas por uso reciente']
    }
  ];

  return (
    <div className={`bg-card rounded-2xl border border-border p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon name="HelpCircle" size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-text-primary">¿Cómo Empezar?</h3>
          <p className="text-sm text-text-secondary">Sigue estos pasos para conectarte</p>
        </div>
      </div>
      <div className="space-y-6">
        {instructions?.map((instruction, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name={instruction?.icon} size={16} className="text-accent" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-text-primary mb-1">
                {instruction?.title}
              </h4>
              <p className="text-sm text-text-secondary mb-2">
                {instruction?.description}
              </p>
              
              <ul className="space-y-1">
                {instruction?.tips?.map((tip, tipIndex) => (
                  <li key={tipIndex} className="flex items-center space-x-2 text-xs text-text-secondary">
                    <div className="w-1 h-1 bg-accent rounded-full flex-shrink-0"></div>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-primary/5 rounded-lg">
        <div className="flex items-start space-x-2">
          <Icon name="Shield" size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary mb-1">Seguridad Garantizada</p>
            <p className="text-xs text-primary/80">
              Todos los códigos QR están protegidos con verificación HMAC para garantizar 
              que solo accedas a máquinas auténticas de AquaQR.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionsPanel;