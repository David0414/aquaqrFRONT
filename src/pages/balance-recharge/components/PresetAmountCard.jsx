import React from 'react';

const PresetAmountCard = ({ 
  amount, 
  bonus = 0, 
  isSelected = false, 
  onClick,
  className = '' 
}) => {
  return (
    <button
      onClick={() => onClick(amount)}
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-200 w-full
        ${isSelected 
          ? 'border-primary bg-primary/5 shadow-soft-md' 
          : 'border-border bg-card hover:border-primary/30 hover:bg-primary/2'
        }
        ${className}
      `}
    >
      <div className="text-center">
        <div className="text-xl font-bold text-text-primary mb-1">
          ${amount}
        </div>
        {bonus > 0 && (
          <div className="text-success text-body-sm font-medium">
            +${bonus} bonus
          </div>
        )}
      </div>
      
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      )}
    </button>
  );
};

export default PresetAmountCard;