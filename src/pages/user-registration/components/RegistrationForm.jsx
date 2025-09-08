import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const RegistrationForm = ({ onRegistrationSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Mock user data for duplicate checking
  const existingUsers = [
    { email: 'usuario@ejemplo.com', phone: '+34612345678' },
    { email: 'test@aquaqr.com', phone: '+34687654321' }
  ];

  const validatePassword = (password) => {
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
      case 1: return 'Muy débil';
      case 2: return 'Débil';
      case 3: return 'Regular';
      case 4: return 'Fuerte';
      case 5: return 'Muy fuerte';
      default: return '';
    }
  };

  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 0:
      case 1: return 'text-error';
      case 2: return 'text-warning';
      case 3: return 'text-warning';
      case 4: return 'text-success';
      case 5: return 'text-success';
      default: return 'text-text-secondary';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Full name validation
    if (!formData?.fullName?.trim()) {
      newErrors.fullName = 'El nombre completo es obligatorio';
    } else if (formData?.fullName?.trim()?.length < 2) {
      newErrors.fullName = 'El nombre debe tener al menos 2 caracteres';
    }

    // Email validation
    if (!formData?.email?.trim()) {
      newErrors.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/?.test(formData?.email)) {
      newErrors.email = 'Por favor ingresa un email válido';
    } else if (existingUsers?.some(user => user?.email === formData?.email)) {
      newErrors.email = 'Este email ya está registrado';
    }

    // Phone validation
    if (!formData?.phone?.trim()) {
      newErrors.phone = 'El teléfono es obligatorio';
    } else if (!/^(\+34|0034|34)?[6789]\d{8}$/?.test(formData?.phone?.replace(/\s/g, ''))) {
      newErrors.phone = 'Por favor ingresa un número de teléfono español válido';
    } else if (existingUsers?.some(user => user?.phone === formData?.phone)) {
      newErrors.phone = 'Este teléfono ya está registrado';
    }

    // Password validation
    if (!formData?.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData?.password?.length < 8) {
      newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
    } else if (passwordStrength < 3) {
      newErrors.password = 'La contraseña debe ser más segura';
    }

    // Confirm password validation
    if (!formData?.confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (formData?.password !== formData?.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    // Terms acceptance validation
    if (!formData?.acceptTerms) {
      newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors?.[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Update password strength
    if (field === 'password') {
      setPasswordStrength(validatePassword(value));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create user data
      const userData = {
        id: Date.now(),
        fullName: formData?.fullName,
        email: formData?.email,
        phone: formData?.phone,
        balance: 0,
        registrationDate: new Date()?.toISOString(),
        isVerified: false
      };

      // Store user data
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('authToken', 'mock-jwt-token-' + Date.now());

      // Show success toast
      if (window.showToast) {
        window.showToast('¡Cuenta creada exitosamente! Bienvenido a AquaQR', 'success');
      }

      // Call success callback
      if (onRegistrationSuccess) {
        onRegistrationSuccess(userData);
      }

      // Redirect to dashboard
      navigate('/home-dashboard');

    } catch (error) {
      console.error('Registration error:', error);
      if (window.showToast) {
        window.showToast('Error al crear la cuenta. Por favor intenta nuevamente.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Full Name */}
      <Input
        label="Nombre completo"
        type="text"
        placeholder="Ingresa tu nombre completo"
        value={formData?.fullName}
        onChange={(e) => handleInputChange('fullName', e?.target?.value)}
        error={errors?.fullName}
        required
        disabled={isLoading}
      />
      {/* Email */}
      <Input
        label="Correo electrónico"
        type="email"
        placeholder="tu@email.com"
        value={formData?.email}
        onChange={(e) => handleInputChange('email', e?.target?.value)}
        error={errors?.email}
        required
        disabled={isLoading}
      />
      {/* Phone */}
      <Input
        label="Número de teléfono"
        type="tel"
        placeholder="+34 612 345 678"
        value={formData?.phone}
        onChange={(e) => handleInputChange('phone', e?.target?.value)}
        error={errors?.phone}
        required
        disabled={isLoading}
      />
      {/* Password */}
      <div className="space-y-2">
        <Input
          label="Contraseña"
          type="password"
          placeholder="Crea una contraseña segura"
          value={formData?.password}
          onChange={(e) => handleInputChange('password', e?.target?.value)}
          error={errors?.password}
          required
          disabled={isLoading}
        />
        
        {formData?.password && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-body-sm text-text-secondary">
                Seguridad de la contraseña:
              </span>
              <span className={`text-body-sm font-medium ${getPasswordStrengthColor(passwordStrength)}`}>
                {getPasswordStrengthText(passwordStrength)}
              </span>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5]?.map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                    level <= passwordStrength
                      ? passwordStrength <= 2
                        ? 'bg-error'
                        : passwordStrength <= 3
                        ? 'bg-warning' :'bg-success' :'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Confirm Password */}
      <Input
        label="Confirmar contraseña"
        type="password"
        placeholder="Repite tu contraseña"
        value={formData?.confirmPassword}
        onChange={(e) => handleInputChange('confirmPassword', e?.target?.value)}
        error={errors?.confirmPassword}
        required
        disabled={isLoading}
      />
      {/* Terms and Conditions */}
      <div className="space-y-2">
        <Checkbox
          label={
            <span className="text-body-sm">
              Acepto los{' '}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => window.open('/terms', '_blank')}
              >
                términos y condiciones
              </button>
              {' '}y la{' '}
              <button
                type="button"
                className="text-primary hover:underline font-medium"
                onClick={() => window.open('/privacy', '_blank')}
              >
                política de privacidad
              </button>
            </span>
          }
          checked={formData?.acceptTerms}
          onChange={(e) => handleInputChange('acceptTerms', e?.target?.checked)}
          disabled={isLoading}
          required
        />
        {errors?.acceptTerms && (
          <p className="text-body-sm text-error flex items-center space-x-1">
            <Icon name="AlertCircle" size={16} />
            <span>{errors?.acceptTerms}</span>
          </p>
        )}
      </div>
      {/* Submit Button */}
      <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
        iconName="UserPlus"
        iconPosition="left"
      >
        {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
      </Button>
    </form>
  );
};

export default RegistrationForm;