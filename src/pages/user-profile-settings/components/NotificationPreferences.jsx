import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';

const NotificationPreferences = ({ user }) => {
  const [preferences, setPreferences] = useState({
    // Tipos de notificación (sin socialImpactUpdates)
    transactionConfirmations: user?.notifications?.transactionConfirmations ?? true,
    promotionalOffers:        user?.notifications?.promotionalOffers ?? true,
    securityAlerts:           user?.notifications?.securityAlerts ?? true,
    maintenanceNotices:       user?.notifications?.maintenanceNotices ?? false,
    // Canales
    emailNotifications:       user?.notifications?.emailNotifications ?? true,
    whatsappNotifications:    user?.notifications?.whatsappNotifications ?? true,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePreferences = async () => {
    setIsLoading(true);
    // TODO: persistir en tu API
    setTimeout(() => {
      setIsLoading(false);
      window.showToast?.('Preferencias de notificación actualizadas', 'success');
    }, 900);
  };

  const notificationTypes = [
    { key: 'transactionConfirmations', title: 'Confirmaciones de transacción',   description: 'Recibe confirmaciones cuando completes una transacción', icon: 'Receipt',  color: 'text-primary' },
    { key: 'securityAlerts',           title: 'Alertas de seguridad',            description: 'Notificaciones críticas de seguridad de tu cuenta',     icon: 'Shield',   color: 'text-error' },
    { key: 'promotionalOffers',        title: 'Ofertas y promociones',           description: 'Descuentos y novedades relevantes',                      icon: 'Tag',      color: 'text-warning' },
    { key: 'maintenanceNotices',       title: 'Avisos de mantenimiento',         description: 'Información de mantenimiento de dispensadores',          icon: 'Settings', color: 'text-secondary' },
  ];

  const communicationChannels = [
    { key: 'emailNotifications',    title: 'Correo electrónico', description: 'Recibe notificaciones en tu email registrado',                icon: 'Mail' },
    { key: 'whatsappNotifications', title: 'WhatsApp',           description: 'Mensajes a tu número vinculado (recomendado)',               icon: 'MessageCircle' },
  ];

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
          <Icon name="Bell" size={20} className="text-warning" />
        </div>
        <div>
          <h2 className="text-heading-base font-semibold text-text-primary">Preferencias de Notificación</h2>
          <p className="text-body-sm text-text-secondary">Elige qué te avisamos y por dónde</p>
        </div>
      </div>

      {/* Tipos */}
      <div className="space-y-4 mb-8">
        <h3 className="text-body-base font-medium text-text-primary mb-4">Tipos de notificación</h3>
        {notificationTypes.map((type) => (
          <div key={type.key} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-muted/30 transition-colors">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 flex-shrink-0 mt-1">
              <Icon name={type.icon} size={16} className={type.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-body-base font-medium text-text-primary">{type.title}</h4>
                  <p className="text-body-sm text-text-secondary mt-1">{type.description}</p>
                </div>
                <Checkbox
                  checked={preferences[type.key]}
                  onChange={(e) => handlePreferenceChange(type.key, e?.target?.checked)}
                  className="ml-4"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Canales */}
      <div className="border-t border-border pt-6 mb-6">
        <h3 className="text-body-base font-medium text-text-primary mb-4">Canales de comunicación</h3>
        {communicationChannels.map((channel) => (
          <div key={channel.key} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-muted/30 transition-colors">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
              <Icon name={channel.icon} size={16} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-body-base font-medium text-text-primary">{channel.title}</h4>
                  <p className="text-body-sm text-text-secondary mt-1">{channel.description}</p>
                </div>
                <Checkbox
                  checked={preferences[channel.key]}
                  onChange={(e) => handlePreferenceChange(channel.key, e?.target?.checked)}
                  className="ml-4"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Guardar */}
      <div className="border-t border-border pt-6">
        <Button
          variant="default"
          loading={isLoading}
          onClick={handleSavePreferences}
          iconName="Check"
          iconPosition="left"
          fullWidth
        >
          Guardar Preferencias
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
