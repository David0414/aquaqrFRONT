// src/pages/user-profile-settings/components/PersonalInfoSection.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

function splitName(full = '') {
  const parts = full.trim().replace(/\s+/g, ' ').split(' ');
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.slice(-1).join(' ') };
}

const PersonalInfoSection = ({ user: uiUserFromParent, onUserUpdate }) => {
  const { user: clerkUser, isLoaded } = useUser();

  // Datos base desde Clerk
  const clerkBasics = useMemo(() => {
    if (!clerkUser) return null;
    const fullName =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      '';
    const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress || '';
    const phone = (clerkUser.publicMetadata?.phone || '').toString();
    return { fullName, email: primaryEmail, phone };
  }, [clerkUser]);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Email verification flow
  const [pendingEmailId, setPendingEmailId] = useState(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [oldPrimaryEmailId, setOldPrimaryEmailId] = useState(null);

  useEffect(() => {
    if (isLoaded && clerkBasics) {
      setFormData({
        name: clerkBasics.fullName || uiUserFromParent?.name || '',
        email: clerkBasics.email || uiUserFromParent?.email || '',
        phone: clerkBasics.phone || uiUserFromParent?.phone || '',
      });
    }
  }, [isLoaded, clerkBasics, uiUserFromParent]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const e = {};
    if (!formData.name?.trim()) e.name = 'El nombre es requerido';
    else if (formData.name.trim().length < 2) e.name = 'El nombre debe tener al menos 2 caracteres';

    if (!formData.email?.trim()) e.email = 'El email es requerido';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Ingresa un email válido';

    if (!formData.phone?.trim()) e.phone = 'El teléfono es requerido';
    else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phone)) e.phone = 'Ingresa un número de teléfono válido';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const startEmailVerification = async (newEmail) => {
    // 1) Crea el nuevo email en Clerk
    const emailRes = await clerkUser.createEmailAddress({ email: newEmail });

    // 2) pide verificación por código al correo
    await emailRes.prepareVerification({ strategy: 'email_code' });

    // Guarda ids para el step de verificación
    setPendingEmailId(emailRes.id);
    setOldPrimaryEmailId(clerkUser.primaryEmailAddress?.id || null);

    if (window.showToast) window.showToast('Enviamos un código a tu nuevo email', 'info');
  };

  const attemptVerifyEmail = async () => {
    if (!pendingEmailId) return;
    setIsVerifying(true);
    try {
      const emailObj = clerkUser.emailAddresses.find(e => e.id === pendingEmailId);
      if (!emailObj) throw new Error('No se encontró el email para verificar');

      // 3) Verifica el código
      await emailObj.attemptVerification({ code: verifyCode });

      // 4) Hazlo primario
      await clerkUser.update({ primaryEmailAddressId: pendingEmailId });

      // 5) (opcional) borra el anterior si existe
      if (oldPrimaryEmailId && oldPrimaryEmailId !== pendingEmailId) {
        const oldObj = clerkUser.emailAddresses.find(e => e.id === oldPrimaryEmailId);
        if (oldObj) await oldObj.destroy();
      }

      setPendingEmailId(null);
      setVerifyCode('');
      setOldPrimaryEmailId(null);

      if (window.showToast) window.showToast('Email actualizado correctamente', 'success');

      // Actualiza estado UI arriba
      onUserUpdate?.({ ...formData });
    } catch (err) {
      if (window.showToast) window.showToast(err.message || 'Código inválido', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!isLoaded || !clerkUser) return;
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const updates = [];

      // Nombre
      if ((clerkBasics?.fullName || '') !== (formData.name || '')) {
        const { firstName, lastName } = splitName(formData.name || '');
        updates.push(clerkUser.update({ firstName, lastName }));
      }

      // Teléfono en publicMetadata
      const currentPhone = (clerkUser.publicMetadata?.phone || '').toString();
      if (currentPhone !== (formData.phone || '')) {
        updates.push(
          clerkUser.update({
            publicMetadata: {
              ...clerkUser.publicMetadata,
              phone: formData.phone || '',
            },
          })
        );
      }

      // Email (flujo especial con verificación si cambió)
      const currentEmail = clerkBasics?.email || '';
      const newEmail = (formData.email || '').trim();
      if (newEmail.toLowerCase() !== currentEmail.toLowerCase()) {
        await Promise.all(updates); // primero aplica lo demás
        await startEmailVerification(newEmail);
        setIsEditing(false); // cierra edición mientras se verifica
        setIsSaving(false);
        return; // el resto continúa cuando confirme el código
      }

      // Aplica updates no-email
      await Promise.all(updates);

      setIsEditing(false);
      if (window.showToast) window.showToast('Información personal actualizada', 'success');

      onUserUpdate?.({ ...formData });
    } catch (err) {
      if (window.showToast) window.showToast(err.message || 'No se pudo actualizar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: clerkBasics?.fullName || uiUserFromParent?.name || '',
      email: clerkBasics?.email || uiUserFromParent?.email || '',
      phone: clerkBasics?.phone || uiUserFromParent?.phone || '',
    });
    setErrors({});
    setIsEditing(false);
    setPendingEmailId(null);
    setVerifyCode('');
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="User" size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-heading-base font-semibold text-text-primary">
              Información Personal
            </h2>
            <p className="text-body-sm text-text-secondary">
              Actualiza tus datos personales
            </p>
          </div>
        </div>

        {!isEditing && !pendingEmailId && (
          <Button
            variant="outline"
            size="sm"
            iconName="Edit2"
            iconPosition="left"
            onClick={() => setIsEditing(true)}
          >
            Editar
          </Button>
        )}
      </div>

      {/* Formulario */}
      <div className="space-y-4">
        <Input
          label="Nombre completo"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e?.target?.value)}
          error={errors?.name}
          disabled={!isEditing || !!pendingEmailId}
          required
        />

        <Input
          label="Correo electrónico"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e?.target?.value)}
          error={errors?.email}
          disabled={!isEditing || !!pendingEmailId}
          description={
            isEditing
              ? 'Si cambias el correo te enviaremos un código de verificación al nuevo email.'
              : ''
          }
          required
        />

        <Input
          label="Número de teléfono"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e?.target?.value)}
          error={errors?.phone}
          disabled={!isEditing || !!pendingEmailId}
          placeholder="+52 55 1234 5678"
          required
        />

        {/* Acciones edición */}
        {isEditing && !pendingEmailId && (
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              variant="default"
              loading={isSaving}
              onClick={handleSave}
              iconName="Check"
              iconPosition="left"
              className="sm:flex-1"
            >
              Guardar Cambios
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              iconName="X"
              iconPosition="left"
              className="sm:flex-1"
            >
              Cancelar
            </Button>
          </div>
        )}

        {/* Bloque de verificación de email */}
        {pendingEmailId && (
          <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
            <div className="flex items-start gap-3">
              <Icon name="Mail" size={20} className="text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-body-sm text-text-primary font-medium">
                  Verifica tu nuevo correo
                </p>
                <p className="text-body-sm text-text-secondary">
                  Hemos enviado un código de 6 dígitos a <strong>{formData.email}</strong>.
                  Escríbelo a continuación para completar el cambio de email.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="Código de verificación"
                    className="flex-1 h-11 px-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <Button
                    variant="default"
                    loading={isVerifying}
                    onClick={attemptVerifyEmail}
                    iconName="Check"
                    iconPosition="left"
                  >
                    Confirmar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setPendingEmailId(null);
                      setVerifyCode('');
                      setOldPrimaryEmailId(null);
                      // revert UI al email anterior de Clerk
                      setFormData(prev => ({ ...prev, email: clerkBasics?.email || '' }));
                    }}
                    iconName="X"
                    iconPosition="left"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalInfoSection;
