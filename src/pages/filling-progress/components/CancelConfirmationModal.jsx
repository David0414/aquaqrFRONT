import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CancelConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  progress = 0,
  totalCost = 0,
  refundAmount = 0 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl max-w-sm w-full">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="AlertTriangle" size={32} className="text-warning" />
          </div>
          
          <h2 className="text-heading-sm font-semibold text-text-primary mb-2">
            ¿Cancelar Dispensado?
          </h2>
          
          <p className="text-body-sm text-text-secondary">
            El dispensado está {progress?.toFixed(0)}% completado. Si cancelas ahora, recibirás un reembolso parcial.
          </p>
        </div>

        {/* Refund Details */}
        <div className="px-6 pb-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-text-secondary">
                Costo total
              </span>
              <span className="text-body-sm font-medium text-text-primary">
                ${totalCost?.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-body-sm text-text-secondary">
                Agua dispensada ({progress?.toFixed(0)}%)
              </span>
              <span className="text-body-sm font-medium text-text-primary">
                ${(totalCost * progress / 100)?.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-body-sm font-semibold text-text-primary">
                Reembolso
              </span>
              <span className="text-body-sm font-bold text-success">
                +${refundAmount?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="destructive"
              fullWidth
              iconName="X"
              onClick={onConfirm}
            >
              Sí, Cancelar Dispensado
            </Button>
            
            <Button
              variant="outline"
              fullWidth
              onClick={onClose}
            >
              Continuar Dispensando
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmationModal;