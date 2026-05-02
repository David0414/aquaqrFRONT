import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const BottleSizeSelector = ({
  selectedLiters,
  onChange,
  allowedLiters = [5, 10, 20],
  garrafonLiters = 20,
  pricePerLiter = 0,
  className = '',
}) => {
  const sizes = useMemo(() => {
    const quarter = garrafonLiters / 4;
    const half = garrafonLiters / 2;

    const isSame = (a, b) => Math.abs(a - b) < 1e-6;
    const formatPrice = (liters) => `$${(Number(liters || 0) * Number(pricePerLiter || 0)).toFixed(2)}`;

    const labelFor = (liters) => {
      if (isSame(liters, quarter)) return `1 galon de agua purificada (${liters}L)`;
      if (isSame(liters, half)) return `Medio garrafon de agua purificada (${liters}L)`;
      if (isSame(liters, garrafonLiters)) return `Garrafon completo (${liters}L)`;
      return `${liters} litros`;
    };

    return allowedLiters.map((liters) => ({
      liters,
      label: labelFor(liters),
      subtitle: `${liters} litros`,
      priceLabel: formatPrice(liters),
    }));
  }, [allowedLiters, garrafonLiters, pricePerLiter]);

  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-text-primary mb-6">
        Tamano de garrafon
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sizes.map((size) => {
          const active = Number(selectedLiters) === Number(size.liters);
          return (
            <button
              key={size.liters}
              onClick={() => onChange?.(size.liters)}
              type="button"
              className={`
                group p-4 rounded-lg border-2 transition-all duration-200
                text-left hover:scale-[1.01] active:scale-95
                ${active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-surface text-text-primary hover:border-primary/30'}
              `}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-text-secondary'}
                  `}
                >
                  <Icon name="Droplets" size={20} />
                </div>
                <div>
                  <div className="font-semibold">{size.label}</div>
                  <div className="text-sm text-text-secondary">{size.subtitle}</div>
                  <div className={`mt-1 text-sm font-semibold ${active ? 'text-primary' : 'text-text-primary'}`}>
                    Precio: {size.priceLabel}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottleSizeSelector;
