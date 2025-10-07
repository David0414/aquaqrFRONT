// src/pages/water-dispensing-control/components/BottleSizeSelector.jsx
import React, { useMemo } from 'react';
import Icon from '../../../components/AppIcon';

const BottleSizeSelector = ({
  selectedLiters,
  onChange,                 // callback al seleccionar
  allowedLiters = [5, 10, 20],
  garrafonLiters = 20,
  className = '',
}) => {
  // Construye etiquetas bonitas según el tamaño del garrafón
  const sizes = useMemo(() => {
    const quarter = garrafonLiters / 4;
    const half = garrafonLiters / 2;

    const labelFor = (l) => {
      const is = (a, b) => Math.abs(a - b) < 1e-6;
      if (is(l, quarter)) return `¼ garrafón (${l}L)`;
      if (is(l, half))    return `½ garrafón (${l}L)`;
      if (is(l, garrafonLiters)) return `Garrafón completo (${l}L)`;
      return `${l} litros`;
    };

    return allowedLiters.map((l) => ({ liters: l, label: labelFor(l) }));
  }, [allowedLiters, garrafonLiters]);

  return (
    <div className={`bg-card border border-border rounded-xl p-6 ${className}`}>
      <h3 className="text-xl font-semibold text-text-primary mb-6">
        Tamaño de garrafón
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sizes.map((s) => {
          const active = Number(selectedLiters) === Number(s.liters);
          return (
            <button
              key={s.liters}
              onClick={() => onChange?.(s.liters)}
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
                  <div className="font-semibold">{s.label}</div>
                  <div className="text-sm text-text-secondary">{s.liters} litros</div>
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
