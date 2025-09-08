import React, { useState } from 'react';
import Input from '../../../components/ui/Input';

const CustomAmountInput = ({ 
  value, 
  onChange, 
  error,
  minAmount = 10,
  maxAmount = 500,
  className = '' 
}) => {
  const [focused, setFocused] = useState(false);

  const handleAmountChange = (e) => {
    const inputValue = e?.target?.value;
    
    // Allow empty input
    if (inputValue === '') {
      onChange('');
      return;
    }

    // Remove non-numeric characters except decimal point
    const numericValue = inputValue?.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = numericValue?.split('.');
    if (parts?.length > 2) return;
    
    // Limit decimal places to 2
    if (parts?.[1] && parts?.[1]?.length > 2) return;
    
    onChange(numericValue);
  };

  const formatDisplayValue = (val) => {
    if (!val) return '';
    return focused ? val : `$${val}`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Input
        label="Cantidad Personalizada"
        type="text"
        inputMode="decimal"
        placeholder="Ingresa el monto"
        value={formatDisplayValue(value)}
        onChange={handleAmountChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        error={error}
        description={`Monto mínimo: $${minAmount} - Máximo: $${maxAmount}`}
        className="text-center text-lg font-semibold"
      />
    </div>
  );
};

export default CustomAmountInput;