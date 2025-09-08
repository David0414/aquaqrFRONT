import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';

const LoginForm = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState({
    emailOrPhone: '',
    password: '',
    rememberDevice: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [inputType, setInputType] = useState('email');

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e?.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Auto-detect input type for email/phone
    if (name === 'emailOrPhone') {
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]+$/;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      if (phoneRegex?.test(value) && !emailRegex?.test(value)) {
        setInputType('tel');
      } else {
        setInputType('email');
      }
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    onSubmit(formData);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-error/10 border border-error/20 flex items-start space-x-3">
          <Icon name="AlertCircle" size={20} className="text-error flex-shrink-0 mt-0.5" />
          <p className="text-body-sm text-error font-medium">{error}</p>
        </div>
      )}
      <div className="space-y-4">
        <Input
          label="Email o Teléfono"
          type={inputType}
          name="emailOrPhone"
          placeholder="ejemplo@correo.com o +34 600 000 000"
          value={formData?.emailOrPhone}
          onChange={handleInputChange}
          required
          disabled={isLoading}
          className="w-full"
        />

        <div className="relative">
          <Input
            label="Contraseña"
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Ingresa tu contraseña"
            value={formData?.password}
            onChange={handleInputChange}
            required
            disabled={isLoading}
            className="w-full pr-12"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-9 p-1 text-text-secondary hover:text-text-primary transition-colors duration-200"
            disabled={isLoading}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Icon name={showPassword ? 'EyeOff' : 'Eye'} size={20} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Checkbox
          label="Recordar dispositivo"
          name="rememberDevice"
          checked={formData?.rememberDevice}
          onChange={handleInputChange}
          disabled={isLoading}
          size="sm"
        />
      </div>
      <Button
        type="submit"
        variant="default"
        size="lg"
        fullWidth
        loading={isLoading}
        disabled={!formData?.emailOrPhone || !formData?.password}
        iconName="LogIn"
        iconPosition="right"
      >
        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>
    </form>
  );
};

export default LoginForm;