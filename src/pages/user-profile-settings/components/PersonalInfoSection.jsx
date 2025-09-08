import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

const PersonalInfoSection = ({ user, onUserUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name,
    email: user?.email,
    phone: user?.phone
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData?.name?.trim()) {
      newErrors.name = 'El nombre es requerido';
    } else if (formData?.name?.trim()?.length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData?.email?.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Ingresa un email válido';
    }

    if (!formData?.phone?.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    } else if (!/^\+?[\d\s-()]{10,}$/?.test(formData?.phone)) {
      newErrors.phone = 'Ingresa un número de teléfono válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      onUserUpdate(formData);
      setIsEditing(false);
      setIsLoading(false);
      
      if (window.showToast) {
        window.showToast('Información personal actualizada correctamente', 'success');
      }
    }, 1500);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name,
      email: user?.email,
      phone: user?.phone
    });
    setErrors({});
    setIsEditing(false);
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
        
        {!isEditing && (
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
      <div className="space-y-4">
        <Input
          label="Nombre completo"
          type="text"
          value={formData?.name}
          onChange={(e) => handleInputChange('name', e?.target?.value)}
          error={errors?.name}
          disabled={!isEditing}
          required
        />

        <Input
          label="Correo electrónico"
          type="email"
          value={formData?.email}
          onChange={(e) => handleInputChange('email', e?.target?.value)}
          error={errors?.email}
          disabled={!isEditing}
          description={isEditing ? "Se enviará un código de verificación al nuevo email" : ""}
          required
        />

        <Input
          label="Número de teléfono"
          type="tel"
          value={formData?.phone}
          onChange={(e) => handleInputChange('phone', e?.target?.value)}
          error={errors?.phone}
          disabled={!isEditing}
          placeholder="+52 55 1234 5678"
          required
        />

        {isEditing && (
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              variant="default"
              loading={isLoading}
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
              disabled={isLoading}
              iconName="X"
              iconPosition="left"
              className="sm:flex-1"
            >
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonalInfoSection;