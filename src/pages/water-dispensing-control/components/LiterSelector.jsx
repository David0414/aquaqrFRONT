import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const LiterSelector = ({ 
  selectedLiters, 
  onLiterChange, 
  maxLiters = 50,
  className = '' 
}) => {
  const presetAmounts = [0.5, 1, 5, 10];

  const handlePresetSelect = (amount) => {
    onLiterChange(amount);
  };

  const handleCustomIncrement = () => {
    const newAmount = Math.min(selectedLiters + 0.5, maxLiters);
    onLiterChange(newAmount);
  };

  const handleCustomDecrement = () => {
    const newAmount = Math.max(selectedLiters - 0.5, 0.5);
    onLiterChange(newAmount);
  };

  const handleInputChange = (e) => {
    const value = parseFloat(e?.target?.value) || 0;
    if (value >= 0.5 && value <= maxLiters) {
      onLiterChange(value);
    }
  };

  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-text-primary mb-6">
        Selecciona la cantidad
      </h3>
      {/* Preset Amounts */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {presetAmounts?.map((amount) => (
          <button
            key={amount}
            onClick={() => handlePresetSelect(amount)}
            className={`
              flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200
              min-h-[80px] hover:scale-105 active:scale-95
              ${selectedLiters === amount
                ? 'border-primary bg-primary/10 text-primary' :'border-border bg-surface hover:border-primary/30 text-text-primary'
              }
            `}
          >
            <Icon name="Droplets" size={24} className="mb-2" />
            <span className="text-lg font-semibold">{amount}L</span>
          </button>
        ))}
      </div>
      {/* Custom Amount Selector */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-text-primary">
          Cantidad personalizada
        </h4>
        
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleCustomDecrement}
            disabled={selectedLiters <= 0.5}
            className="h-12 w-12 flex-shrink-0"
          >
            <Icon name="Minus" size={20} />
          </Button>
          
          <div className="flex-1 relative">
            <input
              type="number"
              min="0.5"
              max={maxLiters}
              step="0.5"
              value={selectedLiters}
              onChange={handleInputChange}
              className="
                w-full h-12 px-4 text-center text-xl font-semibold
                bg-surface border border-border rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                text-text-primary
              "
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary">
              L
            </span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleCustomIncrement}
            disabled={selectedLiters >= maxLiters}
            className="h-12 w-12 flex-shrink-0"
          >
            <Icon name="Plus" size={20} />
          </Button>
        </div>
        
        <p className="text-sm text-text-secondary text-center">
          Mínimo: 0.5L • Máximo: {maxLiters}L
        </p>
      </div>
    </div>
  );
};

export default LiterSelector;