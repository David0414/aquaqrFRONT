import React, { useState } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const PasswordRecovery = ({ onRecover, onBack, isLoading }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (onRecover) {
      onRecover(email);
      setIsSubmitted(true);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center">
          <Icon name="Mail" size={32} className="text-success" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-heading-sm font-semibold text-text-primary">
            Email Enviado
          </h3>
          <p className="text-body-sm text-text-secondary">
            Hemos enviado las instrucciones de recuperación a tu email.
            Revisa tu bandeja de entrada y spam.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            variant="default"
            size="lg"
            fullWidth
            onClick={onBack}
            iconName="ArrowLeft"
            iconPosition="left"
          >
            Volver al Login
          </Button>
          
          <button
            onClick={() => setIsSubmitted(false)}
            className="text-body-sm text-primary hover:text-primary/80 font-medium transition-colors duration-200"
          >
            ¿No recibiste el email? Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
          <Icon name="Key" size={32} className="text-primary" />
        </div>
        <h3 className="text-heading-sm font-semibold text-text-primary">
          Recuperar Contraseña
        </h3>
        <p className="text-body-sm text-text-secondary">
          Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="ejemplo@correo.com"
          value={email}
          onChange={(e) => setEmail(e?.target?.value)}
          required
          disabled={isLoading}
          className="w-full"
        />

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={onBack}
            disabled={isLoading}
            iconName="ArrowLeft"
            iconPosition="left"
          >
            Volver
          </Button>
          <Button
            type="submit"
            variant="default"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!email}
            iconName="Send"
            iconPosition="right"
          >
            Enviar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PasswordRecovery;