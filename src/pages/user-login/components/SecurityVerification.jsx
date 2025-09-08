import React, { useState, useEffect } from 'react';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const SecurityVerification = ({ onVerify, onCancel, isLoading, verificationType = 'sms' }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (onVerify) {
      onVerify(verificationCode);
    }
  };

  const handleResend = () => {
    setTimeLeft(60);
    setCanResend(false);
    setVerificationCode('');
    // Trigger resend logic here
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto bg-warning/10 rounded-full flex items-center justify-center">
          <Icon name="Shield" size={32} className="text-warning" />
        </div>
        <h3 className="text-heading-sm font-semibold text-text-primary">
          Verificación de Seguridad
        </h3>
        <p className="text-body-sm text-text-secondary">
          {verificationType === 'sms' ?'Hemos enviado un código de verificación a tu teléfono registrado' :'Hemos enviado un código de verificación a tu email registrado'
          }
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Código de Verificación"
          type="text"
          placeholder="Ingresa el código de 6 dígitos"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e?.target?.value?.replace(/\D/g, '')?.slice(0, 6))}
          required
          disabled={isLoading}
          className="text-center text-heading-sm font-mono tracking-widest"
          maxLength={6}
        />

        <div className="flex items-center justify-center space-x-4 text-body-sm">
          {!canResend ? (
            <span className="text-text-secondary">
              Reenviar código en {formatTime(timeLeft)}
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="text-primary hover:text-primary/80 font-medium transition-colors duration-200"
              disabled={isLoading}
            >
              Reenviar código
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            fullWidth
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="default"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={verificationCode?.length !== 6}
            iconName="Shield"
            iconPosition="right"
          >
            Verificar
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SecurityVerification;