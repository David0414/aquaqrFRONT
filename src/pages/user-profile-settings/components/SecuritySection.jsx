import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';

const SecuritySection = ({ user }) => {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors?.[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password?.length >= 8) strength++;
    if (/[A-Z]/?.test(password)) strength++;
    if (/[a-z]/?.test(password)) strength++;
    if (/[0-9]/?.test(password)) strength++;
    if (/[^A-Za-z0-9]/?.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 0:
      case 1: return { text: 'Muy débil', color: 'text-error' };
      case 2: return { text: 'Débil', color: 'text-warning' };
      case 3: return { text: 'Regular', color: 'text-warning' };
      case 4: return { text: 'Fuerte', color: 'text-success' };
      case 5: return { text: 'Muy fuerte', color: 'text-success' };
      default: return { text: '', color: '' };
    }
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordData?.currentPassword) {
      newErrors.currentPassword = 'Ingresa tu contraseña actual';
    }

    if (!passwordData?.newPassword) {
      newErrors.newPassword = 'Ingresa una nueva contraseña';
    } else if (passwordData?.newPassword?.length < 8) {
      newErrors.newPassword = 'La contraseña debe tener al menos 8 caracteres';
    } else if (getPasswordStrength(passwordData?.newPassword) < 3) {
      newErrors.newPassword = 'La contraseña debe ser más segura';
    }

    if (!passwordData?.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (passwordData?.newPassword !== passwordData?.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSavePassword = async () => {
    if (!validatePasswordForm()) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsChangingPassword(false);
      setIsLoading(false);
      
      if (window.showToast) {
        window.showToast('Contraseña actualizada correctamente', 'success');
      }
    }, 1500);
  };

  const handleCancelPassword = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setIsChangingPassword(false);
  };

  const handleTwoFactorToggle = async (checked) => {
    setTwoFactorEnabled(checked);
    
    // Simulate API call
    setTimeout(() => {
      if (window.showToast) {
        const message = checked 
          ? 'Autenticación de dos factores activada' 
          : 'Autenticación de dos factores desactivada';
        window.showToast(message, 'success');
      }
    }, 500);
  };

  const passwordStrength = getPasswordStrength(passwordData?.newPassword);
  const strengthInfo = getPasswordStrengthText(passwordStrength);

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
          <Icon name="Shield" size={20} className="text-error" />
        </div>
        <div>
          <h2 className="text-heading-base font-semibold text-text-primary">
            Seguridad
          </h2>
          <p className="text-body-sm text-text-secondary">
            Gestiona la seguridad de tu cuenta
          </p>
        </div>
      </div>
      {/* Password Section */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-body-base font-medium text-text-primary">
              Contraseña
            </h3>
            <p className="text-body-sm text-text-secondary">
              Última actualización: {user?.lastPasswordChange}
            </p>
          </div>
          
          {!isChangingPassword && (
            <Button
              variant="outline"
              size="sm"
              iconName="Key"
              iconPosition="left"
              onClick={() => setIsChangingPassword(true)}
            >
              Cambiar
            </Button>
          )}
        </div>

        {isChangingPassword && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
            <Input
              label="Contraseña actual"
              type="password"
              value={passwordData?.currentPassword}
              onChange={(e) => handlePasswordChange('currentPassword', e?.target?.value)}
              error={passwordErrors?.currentPassword}
              required
            />

            <div className="space-y-2">
              <Input
                label="Nueva contraseña"
                type="password"
                value={passwordData?.newPassword}
                onChange={(e) => handlePasswordChange('newPassword', e?.target?.value)}
                error={passwordErrors?.newPassword}
                required
              />
              
              {passwordData?.newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength <= 2 ? 'bg-error' :
                          passwordStrength <= 3 ? 'bg-warning' : 'bg-success'
                        }`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-body-xs font-medium ${strengthInfo?.color}`}>
                      {strengthInfo?.text}
                    </span>
                  </div>
                  
                  <div className="text-body-xs text-text-secondary space-y-1">
                    <div className="flex items-center space-x-2">
                      <Icon 
                        name={passwordData?.newPassword?.length >= 8 ? "Check" : "X"} 
                        size={12} 
                        className={passwordData?.newPassword?.length >= 8 ? "text-success" : "text-error"} 
                      />
                      <span>Al menos 8 caracteres</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon 
                        name={/[A-Z]/?.test(passwordData?.newPassword) ? "Check" : "X"} 
                        size={12} 
                        className={/[A-Z]/?.test(passwordData?.newPassword) ? "text-success" : "text-error"} 
                      />
                      <span>Una letra mayúscula</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon 
                        name={/[0-9]/?.test(passwordData?.newPassword) ? "Check" : "X"} 
                        size={12} 
                        className={/[0-9]/?.test(passwordData?.newPassword) ? "text-success" : "text-error"} 
                      />
                      <span>Un número</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Input
              label="Confirmar nueva contraseña"
              type="password"
              value={passwordData?.confirmPassword}
              onChange={(e) => handlePasswordChange('confirmPassword', e?.target?.value)}
              error={passwordErrors?.confirmPassword}
              required
            />

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
              <Button
                variant="default"
                loading={isLoading}
                onClick={handleSavePassword}
                iconName="Check"
                iconPosition="left"
                className="sm:flex-1"
              >
                Actualizar Contraseña
              </Button>
              <Button
                variant="outline"
                onClick={handleCancelPassword}
                disabled={isLoading}
                iconName="X"
                iconPosition="left"
                className="sm:flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Two Factor Authentication */}
      <div className="border-t border-border pt-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-body-base font-medium text-text-primary mb-1">
              Autenticación de dos factores
            </h3>
            <p className="text-body-sm text-text-secondary">
              Añade una capa extra de seguridad a tu cuenta
            </p>
          </div>
          
          <Checkbox
            checked={twoFactorEnabled}
            onChange={(e) => handleTwoFactorToggle(e?.target?.checked)}
            className="ml-4"
          />
        </div>
        
        {twoFactorEnabled && (
          <div className="mt-4 p-4 bg-success/5 border border-success/20 rounded-xl">
            <div className="flex items-center space-x-3">
              <Icon name="Shield" size={20} className="text-success" />
              <div>
                <p className="text-body-sm font-medium text-success">
                  Autenticación de dos factores activada
                </p>
                <p className="text-body-xs text-text-secondary">
                  Tu cuenta está protegida con verificación adicional
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySection;