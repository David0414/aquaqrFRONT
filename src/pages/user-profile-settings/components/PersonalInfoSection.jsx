import React, { useEffect, useMemo, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';

import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

// Helpers
function splitName(full = '') {
  const parts = full.trim().replace(/\s+/g, ' ').split(' ');
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.slice(-1).join(' ') };
}

const PersonalInfoSection = ({ user: uiUserFromParent, onUserUpdate }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { getToken } = useAuth();

  const clerkBasics = useMemo(() => {
    if (!clerkUser) return null;
    const fullName =
      clerkUser.fullName ||
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
      '';
    const email = clerkUser.primaryEmailAddress?.emailAddress || '';
    return { fullName, email };
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

  // Carga inicial (nombre/email de Clerk, teléfono desde backend)
  useEffect(() => {
    const load = async () => {
      if (!isLoaded || !clerkBasics) return;

      const base = {
        name: clerkBasics.fullName || uiUserFromParent?.name || '',
        email: clerkBasics.email || uiUserFromParent?.email || '',
        phone: uiUserFromParent?.phone || '',
      };

      try {
        const token = await getToken({ template: CLERK_JWT_TEMPLATE });
        const res = await fetch(`${API}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setFormData({ ...base, phone: data?.phone || '' });
      } catch {
        setFormData(base);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, clerkBasics]);

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

    const ph = (formData.phone || '').trim();
    if (ph.length > 0 && !/^\+?[\d\s\-()]{10,}$/.test(ph)) {
      e.phone = 'Ingresa un número de teléfono válido';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // --- Email change & verification ---
  const startEmailVerification = async (newEmail) => {
    const emailRes = await clerkUser.createEmailAddress({ email: newEmail });
    await emailRes.prepareVerification({ strategy: 'email_code' });
    setPendingEmailId(emailRes.id);
    setOldPrimaryEmailId(clerkUser.primaryEmailAddress?.id || null);
    window.showToast?.('Enviamos un código a tu nuevo email', 'info');
  };

  const attemptVerifyEmail = async () => {
    if (!pendingEmailId) return;
    setIsVerifying(true);
    try {
      const emailObj = clerkUser.emailAddresses.find(e => e.id === pendingEmailId);
      await emailObj.attemptVerification({ code: verifyCode });
      await clerkUser.update({ primaryEmailAddressId: pendingEmailId });
      if (oldPrimaryEmailId && oldPrimaryEmailId !== pendingEmailId) {
        const oldObj = clerkUser.emailAddresses.find(e => e.id === oldPrimaryEmailId);
        if (oldObj) await oldObj.destroy();
      }
      setPendingEmailId(null);
      setVerifyCode('');
      setOldPrimaryEmailId(null);
      window.showToast?.('Email actualizado correctamente', 'success');
      onUserUpdate?.({ ...formData });
    } catch (err) {
      window.showToast?.(err.message || 'Código inválido', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSave = async () => {
    if (!isLoaded || !clerkUser) return;
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const currentFull = clerkBasics?.fullName || '';
      if (currentFull !== (formData.name || '')) {
        const { firstName, lastName } = splitName(formData.name || '');
        await clerkUser.update({ firstName, lastName });
      }

      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      const putRes = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ phone: (formData.phone || '').trim() }),
      });
      if (!putRes.ok) {
        const e = await putRes.json().catch(() => ({}));
        throw new Error(e.error || 'No se pudo guardar el teléfono');
      }

      const currentEmail = clerkBasics?.email || '';
      const newEmail = (formData.email || '').trim();
      if (newEmail.toLowerCase() !== currentEmail.toLowerCase()) {
        await startEmailVerification(newEmail);
        setIsEditing(false);
        setIsSaving(false);
        return;
      }

      setIsEditing(false);
      window.showToast?.('Información personal actualizada', 'success');
      onUserUpdate?.({ ...formData });
    } catch (err) {
      window.showToast?.(err.message || 'No se pudo actualizar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setErrors({});
    setIsEditing(false);
    if (isLoaded && clerkBasics) {
      setFormData(prev => ({
        ...prev,
        name: clerkBasics.fullName,
        email: clerkBasics.email,
      }));
    }
  };

  // Input: contorno SIEMPRE visible + focus muy marcado (móvil/desktop)
  const inputBaseClasses = `
    h-12 px-3 rounded-lg border-2
    border-primary/60 bg-background
    placeholder:text-text-tertiary
    focus:outline-none focus:border-primary
    focus:ring-4 focus:ring-primary/25 focus:ring-offset-2 focus:ring-offset-background
    transition-all
  `;

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name="User" size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-heading-base font-semibold text-text-primary">Información Personal</h2>
            <p className="text-body-sm text-text-secondary">Actualiza tus datos personales</p>
          </div>
        </div>

        {!isEditing && !pendingEmailId && (
          <Button
            variant="outline"
            size="sm"
            iconName="Edit2"
            iconPosition="left"
            onClick={() => setIsEditing(true)}
            className="
              !bg-transparent !text-primary !border-2 !border-primary
              hover:!bg-primary/10 active:!bg-primary/15
              focus:!outline-none focus:!ring-4 focus:!ring-primary/30
            "
          >
            Editar
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <Input
          label="Nombre completo"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e?.target?.value)}
          error={errors?.name}
          disabled={!isEditing || !!pendingEmailId}
          required
          autoComplete="name"
          className={inputBaseClasses}
          inputClassName={inputBaseClasses}
        />

        <Input
          label="Correo electrónico"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e?.target?.value)}
          error={errors?.email}
          disabled={!isEditing || !!pendingEmailId}
          description={isEditing ? "Si cambias el correo te enviaremos un código de verificación al nuevo email." : ""}
          required
          autoComplete="email"
          className={inputBaseClasses}
          inputClassName={inputBaseClasses}
        />

        <Input
          label="Número de teléfono (opcional)"
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e?.target?.value)}
          error={errors?.phone}
          disabled={!isEditing || !!pendingEmailId}
          placeholder="+52 55 1234 5678"
          autoComplete="tel"
          className={inputBaseClasses}
          inputClassName={inputBaseClasses}
        />

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

            {/* Cancelar rojo con contorno claro */}
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              iconName="X"
              iconPosition="left"
              className="
                sm:flex-1
                !bg-transparent !text-error !border !border-error
                hover:!bg-error/10 active:!bg-error/15
                focus:!outline-none focus:!ring-4 focus:!ring-error/30
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              Cancelar
            </Button>
          </div>
        )}

        {pendingEmailId && (
          <div className="mt-4 p-4 rounded-xl border border-primary/30 bg-primary/5">
            <div className="flex items-start gap-3">
              <Icon name="Mail" size={20} className="text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-body-sm font-medium text-text-primary">Verifica tu nuevo correo</p>
                <p className="text-body-sm text-text-secondary">
                  Enviamos un código de 6 dígitos a <strong>{formData.email}</strong>.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="Código de verificación"
                    className="
                      flex-1 h-11 px-3 rounded-lg border-2
                      border-primary/60 bg-background
                      focus:outline-none focus:border-primary
                      focus:ring-4 focus:ring-primary/25 focus:ring-offset-2 focus:ring-offset-background
                      transition-all
                    "
                    inputMode="numeric"
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
