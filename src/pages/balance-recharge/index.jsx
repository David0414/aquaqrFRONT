import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast, { showSuccessToast, showErrorToast, showWarningToast } from '../../components/ui/NotificationToast';

// Import components
import CurrentBalanceCard from './components/CurrentBalanceCard';
import PresetAmountCard from './components/PresetAmountCard';
import CustomAmountInput from './components/CustomAmountInput';
import PaymentMethodCard from './components/PaymentMethodCard';
import PromotionalBanner from './components/PromotionalBanner';
import TransactionSummary from './components/TransactionSummary';
import PaymentProcessingModal from './components/PaymentProcessingModal';

const BalanceRecharge = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [currentBalance, setCurrentBalance] = useState(125.50);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [errors, setErrors] = useState({});

  // Preset amounts with bonuses
  const presetAmounts = [
    { amount: 30, bonus: 0 },
    { amount: 50, bonus: 5 },
    { amount: 100, bonus: 10 },
    { amount: 200, bonus: 25 }
  ];

  // Check if coming from insufficient balance scenario
  useEffect(() => {
    const state = location?.state;
    if (state?.fromInsufficientBalance) {
      const requiredAmount = state?.requiredAmount || 50;
      const suggestedAmount = presetAmounts?.find(preset => preset?.amount >= requiredAmount)?.amount || 50;
      setSelectedAmount(suggestedAmount);
      showWarningToast(`Saldo insuficiente. Se sugiere recargar $${suggestedAmount} para continuar.`);
    }
  }, [location?.state]);

  // Handle preset amount selection
  const handlePresetAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setErrors(prev => ({ ...prev, amount: '' }));
  };

  // Handle custom amount change
  const handleCustomAmountChange = (value) => {
    setCustomAmount(value);
    const numericValue = parseFloat(value) || 0;
    setSelectedAmount(numericValue);
    setErrors(prev => ({ ...prev, amount: '' }));
  };

  // Validate recharge form
  const validateRecharge = () => {
    const newErrors = {};
    
    if (selectedAmount < 10) {
      newErrors.amount = 'El monto mínimo de recarga es $10';
    }
    
    if (selectedAmount > 500) {
      newErrors.amount = 'El monto máximo de recarga es $500';
    }
    
    if (!selectedPaymentMethod) {
      newErrors.paymentMethod = 'Selecciona un método de pago';
    }

    setErrors(newErrors);
    return Object.keys(newErrors)?.length === 0;
  };

  // Handle payment processing
  const handleRecharge = () => {
    if (!validateRecharge()) {
      showErrorToast('Por favor corrige los errores antes de continuar');
      return;
    }

    setIsProcessingPayment(true);
  };

  // Handle payment success
  const handlePaymentSuccess = (transactionData) => {
    setIsProcessingPayment(false);
    
    // Update balance
    const bonus = presetAmounts?.find(preset => preset?.amount === selectedAmount)?.bonus || 0;
    const newBalance = currentBalance + selectedAmount + bonus;
    setCurrentBalance(newBalance);
    
    // Save transaction to localStorage (mock)
    const transaction = {
      id: transactionData?.transactionId,
      type: 'recharge',
      amount: selectedAmount,
      bonus,
      timestamp: transactionData?.timestamp,
      paymentMethod: selectedPaymentMethod,
      status: 'completed'
    };
    
    const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    existingTransactions?.unshift(transaction);
    localStorage.setItem('transactions', JSON.stringify(existingTransactions));
    
    // Update user balance in localStorage
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    userData.balance = newBalance;
    localStorage.setItem('userData', JSON.stringify(userData));
    
    showSuccessToast(`¡Recarga exitosa! Se agregaron $${selectedAmount + bonus} a tu saldo.`);
    
    // Reset form
    setSelectedAmount(0);
    setCustomAmount('');
    setSelectedPaymentMethod('');
    
    // Navigate based on origin
    if (location?.state?.returnTo) {
      navigate(location?.state?.returnTo);
    } else {
      setTimeout(() => navigate('/home-dashboard'), 2000);
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    setIsProcessingPayment(false);
    showErrorToast(error?.message || 'Error al procesar el pago. Intenta nuevamente.');
  };

  // Calculate bonus and fees
  const getBonus = () => {
    const preset = presetAmounts?.find(preset => preset?.amount === selectedAmount);
    return preset?.bonus || 0;
  };

  const getFees = () => {
    // Mock fee calculation (2% for credit cards, 0% for Mercado Pago)
    if (selectedPaymentMethod === 'stripe') {
      return selectedAmount * 0.02;
    }
    return 0;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-30">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Volver"
          >
            <Icon name="ArrowLeft" size={24} className="text-text-primary" />
          </button>
          <h1 className="text-xl font-bold text-text-primary">Recargar Saldo</h1>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </header>
      {/* Main Content */}
      <main className="pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-6 py-6">
          {/* Current Balance */}
          <CurrentBalanceCard balance={currentBalance} />

          {/* Promotional Banners */}
          <PromotionalBanner />

          {/* Amount Selection */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary">Selecciona el Monto</h2>
            
            {/* Preset Amounts */}
            <div className="grid grid-cols-2 gap-3">
              {presetAmounts?.map((preset) => (
                <PresetAmountCard
                  key={preset?.amount}
                  amount={preset?.amount}
                  bonus={preset?.bonus}
                  isSelected={selectedAmount === preset?.amount && !customAmount}
                  onClick={handlePresetAmountSelect}
                />
              ))}
            </div>

            {/* Custom Amount */}
            <CustomAmountInput
              value={customAmount}
              onChange={handleCustomAmountChange}
              error={errors?.amount}
              minAmount={10}
              maxAmount={500}
            />
          </section>

          {/* Payment Methods */}
          {selectedAmount > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">Método de Pago</h2>
              
              <div className="space-y-3">
                <PaymentMethodCard
                  method="mercadopago"
                  isSelected={selectedPaymentMethod === 'mercadopago'}
                  onClick={setSelectedPaymentMethod}
                />
                <PaymentMethodCard
                  method="stripe"
                  isSelected={selectedPaymentMethod === 'stripe'}
                  onClick={setSelectedPaymentMethod}
                />
              </div>
              
              {errors?.paymentMethod && (
                <p className="text-error text-body-sm mt-2">{errors?.paymentMethod}</p>
              )}
            </section>
          )}

          {/* Transaction Summary */}
          {selectedAmount > 0 && selectedPaymentMethod && (
            <TransactionSummary
              amount={selectedAmount}
              bonus={getBonus()}
              fees={getFees()}
              currentBalance={currentBalance}
            />
          )}

          {/* Recharge Button */}
          {selectedAmount > 0 && selectedPaymentMethod && (
            <div className="pt-4">
              <Button
                variant="default"
                size="lg"
                fullWidth
                onClick={handleRecharge}
                disabled={isProcessingPayment}
                loading={isProcessingPayment}
                iconName="CreditCard"
                iconPosition="left"
              >
                Recargar ${(selectedAmount + getFees())?.toFixed(2)}
              </Button>
            </div>
          )}

          {/* Security Notice */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
            <div className="flex items-start space-x-3">
              <Icon name="Shield" size={20} className="text-primary mt-0.5" />
              <div>
                <h3 className="font-medium text-text-primary mb-1">Pago Seguro</h3>
                <p className="text-text-secondary text-body-sm">
                  Todos los pagos son procesados de forma segura con encriptación SSL. 
                  No almacenamos información de tarjetas de crédito.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Payment Processing Modal */}
      <PaymentProcessingModal
        isOpen={isProcessingPayment}
        onClose={() => setIsProcessingPayment(false)}
        paymentMethod={selectedPaymentMethod}
        amount={selectedAmount + getFees()}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
      {/* Bottom Navigation */}
      <BottomTabNavigation />
      {/* Toast Notifications */}
      <NotificationToast />
    </div>
  );
};

export default BalanceRecharge;