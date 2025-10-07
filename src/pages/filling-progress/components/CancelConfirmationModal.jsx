import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CancelConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  progress = 0,
  totalCost = 0,
  refundAmount = 0,
}) => {
  if (!isOpen) return null;

  const pct = Math.max(0, Math.min(100, Number(progress) || 0));
  const money = (n) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(Number.isFinite(n) ? n : 0);

  const dispensedCost = (Number(totalCost) || 0) * (pct / 100);

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-background rounded-2xl max-w-sm w-full shadow-xl">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="AlertTriangle" size={32} className="text-warning" />
          </div>

          <h2 className="text-heading-sm font-semibold text-text-primary mb-2">
            ¿Cancelar dispensado?
          </h2>

          <p className="text-body-sm text-text-secondary">
            El dispensado está {Math.round(pct)}% completado. Si cancelas ahora,
            procesaremos un reembolso parcial.
          </p>
        </div>

        {/* Detalle de reembolso */}
        <div className="px-6 pb-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-text-secondary">Costo total</span>
              <span className="text-body-sm font-medium text-text-primary">
                {money(totalCost)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-body-sm text-text-secondary">
                Agua dispensada ({Math.round(pct)}%)
              </span>
              <span className="text-body-sm font-medium text-text-primary">
                {money(dispensedCost)}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-body-sm font-semibold text-text-primary">Reembolso</span>
              <span className="text-body-sm font-bold text-success">
                +{money(refundAmount)}
              </span>
            </div>
          </div>

          {/* Acciones */}
          <div className="space-y-3">
            <Button
              variant="destructive"
              fullWidth
              iconName="X"
              onClick={onConfirm}
            >
              Sí, cancelar dispensado
            </Button>

            <Button variant="outline" fullWidth onClick={onClose}>
              Continuar dispensando
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmationModal;
