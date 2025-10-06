import React, { useState, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';

import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { showErrorToast, showSuccessToast } from '../../../components/ui/NotificationToast';

const SecuritySection = ({ user: uiUser }) => {
  const { user, isLoaded } = useUser();

  const passwordEnabled = user?.passwordEnabled ?? false; // Clerk nos dice si ya tiene password

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
    if (passwordErrors?.[field]) {
      setPasswordErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // ------------------ fuerza de contraseña ------------------
  const getPasswordStrength = (password) => {
    let strength = 0;
    if ((password || '').length >= 8) strength++;
    if (/[A-Z]/.test(password || '')) strength++;
    if (/[a-z]/.test(password || '')) strength++;
    if (/[0-9]/.test(password || '')) strength++;
    if (/[^A-Za-z0-9]/.test(password || '')) strength++;
    return strength; // 0..5
  };

  const passwordStrength = useMemo(
    () => getPasswordStrength(passwordData?.newPassword),
    [passwordData?.newPassword]
  );

  const strengthInfo = useMemo(() => {
    switch (passwordStrength) {
      case 0:
      case 1: return { text: 'Muy débil', color: 'text-error' };
      case 2: return { text: 'Débil', color: 'text-warning' };
      case 3: return { text: 'Regular', color: 'text-warning' };
      case 4: return { text: 'Fuerte', color: 'text-success' };
      case 5: return { text: 'Muy fuerte', color: 'text-success' };
      default: return { text: '', color: '' };
    }
  }, [passwordStrength]);

  // ------------------ validaciones ------------------
  const validatePasswordForm = () => {
    const newErrors = {};

    if (passwordEnabled && !passwordData?.currentPassword) {
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
    return Object.keys(newErrors).length === 0;
  };

  // ------------------ guardar con Clerk ------------------
  const handleSavePassword = async () => {
    try {
      if (!isLoaded || !user) throw new Error('No hay sesión activa');
      if (!validatePasswordForm()) return;

      setIsLoading(true);

      const params = {
        newPassword: passwordData.newPassword,
        // por seguridad, cerramos sesiones en otros dispositivos
        signOutOfOtherSessions: true,
      };
      if (passwordEnabled) {
        params.currentPassword = passwordData.currentPassword;
      }

      await user.updatePassword(params);

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsChangingPassword(false);
      showSuccessToast('Contraseña actualizada correctamente');
    } catch (err) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.message ||
        'No se pudo actualizar la contraseña';
      showErrorToast(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPassword = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordErrors({});
    setIsChangingPassword(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
          <Icon name="Shield" size={20} className="text-error" />
        </div>
        <div>
          <h2 className="text-heading-base font-semibold text-text-primary">Seguridad</h2>
          <p className="text-body-sm text-text-secondary">Gestiona la seguridad de tu cuenta</p>
        </div>
      </div>

      {/* Password Section */}
      <div className="space-y-4 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-body-base font-medium text-text-primary">Contraseña</h3>
            <p className="text-body-sm text-text-secondary">
              Última actualización: {uiUser?.lastPasswordChange || '—'}
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
            {passwordEnabled && (
              <Input
                label="Contraseña actual"
                type="password"
                value={passwordData?.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e?.target?.value)}
                error={passwordErrors?.currentPassword}
                required
              />
            )}

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
                          passwordStrength <= 2
                            ? 'bg-error'
                            : passwordStrength <= 3
                            ? 'bg-warning'
                            : 'bg-success'
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
                        name={passwordData?.newPassword?.length >= 8 ? 'Check' : 'X'}
                        size={12}
                        className={passwordData?.newPassword?.length >= 8 ? 'text-success' : 'text-error'}
                      />
                      <span>Al menos 8 caracteres</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon
                        name={/[A-Z]/.test(passwordData?.newPassword) ? 'Check' : 'X'}
                        size={12}
                        className={/[A-Z]/.test(passwordData?.newPassword) ? 'text-success' : 'text-error'}
                      />
                      <span>Una letra mayúscula</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Icon
                        name={/[0-9]/.test(passwordData?.newPassword) ? 'Check' : 'X'}
                        size={12}
                        className={/[0-9]/.test(passwordData?.newPassword) ? 'text-success' : 'text-error'}
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
    </div>
  );
};

export default SecuritySection;
