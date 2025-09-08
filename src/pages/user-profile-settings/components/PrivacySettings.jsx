import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import { Checkbox } from '../../../components/ui/Checkbox';
import Button from '../../../components/ui/Button';

const PrivacySettings = ({ user }) => {
  const [privacySettings, setPrivacySettings] = useState({
    dataSharing: user?.privacy?.dataSharing ?? false,
    marketingCommunications: user?.privacy?.marketingCommunications ?? true,
    analyticsTracking: user?.privacy?.analyticsTracking ?? true,
    thirdPartySharing: user?.privacy?.thirdPartySharing ?? false,
    locationTracking: user?.privacy?.locationTracking ?? true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handlePrivacyChange = (key, value) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePrivacy = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      
      if (window.showToast) {
        window.showToast('Configuración de privacidad actualizada', 'success');
      }
    }, 1000);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = () => {
    // Simulate account deletion process
    if (window.showToast) {
      window.showToast('Solicitud de eliminación enviada. Recibirás un email de confirmación.', 'warning', 7000);
    }
    setShowDeleteModal(false);
  };

  const privacyOptions = [
    {
      key: 'dataSharing',
      title: 'Compartir datos para mejoras',
      description: 'Permite que usemos tus datos de forma anónima para mejorar el servicio',
      icon: 'Share2',
      color: 'text-primary'
    },
    {
      key: 'marketingCommunications',
      title: 'Comunicaciones de marketing',
      description: 'Recibe información sobre nuevos productos y servicios',
      icon: 'Mail',
      color: 'text-warning'
    },
    {
      key: 'analyticsTracking',
      title: 'Seguimiento de análisis',
      description: 'Ayúdanos a entender cómo usas la aplicación para mejorarla',
      icon: 'BarChart3',
      color: 'text-accent'
    },
    {
      key: 'thirdPartySharing',
      title: 'Compartir con terceros',
      description: 'Permite compartir datos con socios para ofertas personalizadas',
      icon: 'Users',
      color: 'text-secondary'
    },
    {
      key: 'locationTracking',
      title: 'Seguimiento de ubicación',
      description: 'Usa tu ubicación para encontrar dispensadores cercanos',
      icon: 'MapPin',
      color: 'text-success'
    }
  ];

  return (
    <>
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <Icon name="Lock" size={20} className="text-secondary" />
          </div>
          <div>
            <h2 className="text-heading-base font-semibold text-text-primary">
              Configuración de Privacidad
            </h2>
            <p className="text-body-sm text-text-secondary">
              Controla cómo se usan tus datos personales
            </p>
          </div>
        </div>

        {/* Privacy Options */}
        <div className="space-y-4 mb-8">
          {privacyOptions?.map((option) => (
            <div key={option?.key} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-muted/30 transition-colors duration-200">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 flex-shrink-0 mt-1`}>
                <Icon name={option?.icon} size={16} className={option?.color} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-body-base font-medium text-text-primary">
                      {option?.title}
                    </h4>
                    <p className="text-body-sm text-text-secondary mt-1">
                      {option?.description}
                    </p>
                  </div>
                  
                  <Checkbox
                    checked={privacySettings?.[option?.key]}
                    onChange={(e) => handlePrivacyChange(option?.key, e?.target?.checked)}
                    className="ml-4"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Data Retention Info */}
        <div className="bg-muted/30 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <Icon name="Info" size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-body-base font-medium text-text-primary mb-2">
                Política de Retención de Datos
              </h4>
              <div className="text-body-sm text-text-secondary space-y-2">
                <p>
                  • Los datos de transacciones se conservan durante 7 años por requisitos fiscales
                </p>
                <p>
                  • Los datos de perfil se eliminan 30 días después de la solicitud de eliminación
                </p>
                <p>
                  • Los datos analíticos se anonimizan inmediatamente tras la eliminación
                </p>
                <p>
                  • Puedes solicitar una copia de todos tus datos en cualquier momento
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="border-t border-border pt-6 mb-6">
          <Button
            variant="default"
            loading={isLoading}
            onClick={handleSavePrivacy}
            iconName="Check"
            iconPosition="left"
            fullWidth
          >
            Guardar Configuración de Privacidad
          </Button>
        </div>

        {/* Danger Zone */}
        <div className="border-t border-error/20 pt-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-error/10 rounded-lg flex items-center justify-center">
              <Icon name="AlertTriangle" size={16} className="text-error" />
            </div>
            <h3 className="text-body-base font-medium text-error">
              Zona de Peligro
            </h3>
          </div>
          
          <div className="bg-error/5 border border-error/20 rounded-xl p-4">
            <h4 className="text-body-base font-medium text-text-primary mb-2">
              Eliminar cuenta
            </h4>
            <p className="text-body-sm text-text-secondary mb-4">
              Esta acción eliminará permanentemente tu cuenta y todos los datos asociados. 
              Esta acción no se puede deshacer.
            </p>
            
            <Button
              variant="destructive"
              size="sm"
              iconName="Trash2"
              iconPosition="left"
              onClick={handleDeleteAccount}
            >
              Solicitar Eliminación de Cuenta
            </Button>
          </div>
        </div>
      </div>
      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center">
                <Icon name="AlertTriangle" size={24} className="text-error" />
              </div>
              <div>
                <h3 className="text-heading-base font-semibold text-text-primary">
                  Confirmar Eliminación
                </h3>
                <p className="text-body-sm text-text-secondary">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-body-base text-text-primary">
                ¿Estás seguro de que quieres eliminar tu cuenta? Esto eliminará:
              </p>
              
              <ul className="text-body-sm text-text-secondary space-y-2 pl-4">
                <li className="flex items-center space-x-2">
                  <Icon name="X" size={16} className="text-error" />
                  <span>Todos tus datos personales</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Icon name="X" size={16} className="text-error" />
                  <span>Historial de transacciones</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Icon name="X" size={16} className="text-error" />
                  <span>Saldo restante en la cuenta</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Icon name="X" size={16} className="text-error" />
                  <span>Logros y estadísticas</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <Button
                variant="destructive"
                onClick={confirmDeleteAccount}
                iconName="Trash2"
                iconPosition="left"
                className="sm:flex-1"
              >
                Sí, Eliminar Cuenta
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                iconName="X"
                iconPosition="left"
                className="sm:flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PrivacySettings;