import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const PaymentProcessingModal = ({ 
  isOpen = false, 
  onClose, 
  paymentMethod,
  amount,
  onSuccess,
  onError,
  className = '' 
}) => {
  const [processingStep, setProcessingStep] = useState('connecting');
  const [progress, setProgress] = useState(0);

  const steps = {
    connecting: {
      title: 'Conectando con el procesador de pagos...',
      description: 'Estableciendo conexión segura',
      icon: 'Wifi'
    },
    processing: {
      title: 'Procesando tu pago...',
      description: 'Verificando información de pago',
      icon: 'CreditCard'
    },
    confirming: {
      title: 'Confirmando transacción...',
      description: 'Actualizando tu saldo',
      icon: 'CheckCircle'
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setProcessingStep('connecting');
      setProgress(0);
      return;
    }

    // Simulate payment processing steps
    const timer1 = setTimeout(() => {
      setProcessingStep('processing');
      setProgress(33);
    }, 1500);

    const timer2 = setTimeout(() => {
      setProcessingStep('confirming');
      setProgress(66);
    }, 3000);

    const timer3 = setTimeout(() => {
      setProgress(100);
      // Simulate success/failure
      const isSuccess = Math.random() > 0.1; // 90% success rate
      
      setTimeout(() => {
        if (isSuccess) {
          onSuccess?.({
            transactionId: `TXN${Date.now()}`,
            amount,
            timestamp: new Date()?.toISOString()
          });
        } else {
          onError?.({
            code: 'PAYMENT_FAILED',
            message: 'No se pudo procesar el pago. Intenta con otro método.'
          });
        }
      }, 500);
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isOpen, amount, onSuccess, onError]);

  if (!isOpen) return null;

  const currentStep = steps?.[processingStep];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-card rounded-2xl p-6 w-full max-w-md ${className}`}>
        <div className="text-center">
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Icon */}
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon 
              name={currentStep?.icon} 
              size={32} 
              className={`text-primary ${processingStep === 'confirming' ? 'animate-pulse' : ''}`}
            />
          </div>

          {/* Content */}
          <h2 className="text-xl font-bold text-text-primary mb-2">
            {currentStep?.title}
          </h2>
          <p className="text-text-secondary text-body-sm mb-6">
            {currentStep?.description}
          </p>

          {/* Payment Details */}
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center text-body-sm">
              <span className="text-text-secondary">Método de pago:</span>
              <span className="font-medium text-text-primary capitalize">
                {paymentMethod === 'mercadopago' ? 'Mercado Pago' : 'Tarjeta'}
              </span>
            </div>
            <div className="flex justify-between items-center text-body-sm mt-2">
              <span className="text-text-secondary">Monto:</span>
              <span className="font-bold text-primary">${amount}</span>
            </div>
          </div>

          {/* Loading Animation */}
          <div className="flex justify-center space-x-1 mb-4">
            {[0, 1, 2]?.map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>

          {/* Cancel Button */}
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
            disabled={processingStep === 'confirming'}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcessingModal;