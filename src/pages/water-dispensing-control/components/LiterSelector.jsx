// src/pages/water-dispensing-control/components/LiterSelector.jsx
import React from 'react';
import Icon from '../../../components/AppIcon';

const LiterSelector = ({
  selectedLiters,
  onLiterChange,
  maxLiters = 20,
  className = ''
}) => {
  // Garrafón 20L
  const presets = [
    { liters: 5,  label: '1/4 garrafón',  icon: 'Droplets' },
    { liters: 10, label: '1/2 garrafón',  icon: 'Droplets' },
    { liters: 20, label: 'Garrafón (20L)', icon: 'Droplets' },
  ];

  const handleInputChange = (e) => {
    const v = parseFloat(e?.target?.value) || 0;
    if (v > 0 && v <= maxLiters) onLiterChange(v);
  };

  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-text-primary mb-6">
        Selecciona la cantidad
      </h3>

      {/* Presets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {presets.map(p => (
          <button
            key={p.liters}
            onClick={() => onLiterChange(p.liters)}
            className={`
              flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all duration-200
              min-h-[90px] hover:scale-105 active:scale-95
              ${selectedLiters === p.liters
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface hover:border-primary/30 text-text-primary'}
            `}
          >
            <Icon name={p.icon} size={24} className="mb-2" />
            <span className="text-lg font-semibold">{p.label}</span>
            <span className="text-sm text-text-secondary">{p.liters} L</span>
          </button>
        ))}
      </div>

      {/* Personalizado */}
      <div className="space-y-3">
        <h4 className="text-lg font-medium text-text-primary">Personalizado</h4>
        <div className="flex items-center space-x-3">
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
          <span className="text-text-secondary">L</span>
        </div>
        <p className="text-sm text-text-secondary">
          Máximo: {maxLiters}L
        </p>
      </div>
    </div>
  );
};

export default LiterSelector;
