import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TransactionDetailModal = ({
  transaction,
  isOpen,
  onClose,
  onGenerateReceipt,
  onShare
}) => {
  if (!isOpen || !transaction) return null;

  const formatAmount = (amount, type, currency = 'MXN') => {
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    }).format(Math.abs(amount));

    return type === 'recharge' ? `+${formattedAmount}` : `-${formattedAmount}`;
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date?.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'recharge':
        return { name: 'CreditCard', color: 'text-success' };
      case 'dispensing':
        return { name: 'Droplets', color: 'text-primary' };
      default:
        return { name: 'ArrowUpDown', color: 'text-text-secondary' };
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        label: 'Completada',
        className: 'bg-success/10 text-success border-success/20',
        icon: 'CheckCircle'
      },
      pending: {
        label: 'Pendiente',
        className: 'bg-warning/10 text-warning border-warning/20',
        icon: 'Clock'
      },
      failed: {
        label: 'Fallida',
        className: 'bg-error/10 text-error border-error/20',
        icon: 'XCircle'
      },
      cancelled: {
        label: 'Cancelada',
        className: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20',
        icon: 'Ban'
      }
    };

    const config = statusConfig?.[status] || statusConfig?.completed;

    return (
      <div className={`
        inline-flex items-center space-x-2 px-3 py-2 rounded-lg border
        ${config?.className}
      `}>
        <Icon name={config?.icon} size={16} />
        <span className="font-medium">{config?.label}</span>
      </div>
    );
  };

  const icon = getTransactionIcon(transaction?.type);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-soft-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className={`
              w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${icon?.color}
            `}>
              <Icon name={icon?.name} size={24} />
            </div>
            <div>
              <h2 className="text-heading-sm font-bold text-text-primary">
                Detalles de transacción
              </h2>
              <p className="text-body-sm text-text-secondary">
                {transaction?.description}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
            className="flex-shrink-0"
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Amount */}
          <div className="flex items-center justify-between">
            {getStatusBadge(transaction?.status)}
            <div className={`
              text-heading-sm font-bold
              ${transaction?.type === 'recharge' ? 'text-success' : 'text-text-primary'}
            `}>
              {formatAmount(transaction?.amount, transaction?.type, transaction?.currency)}
            </div>

          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-body font-semibold text-text-primary mb-3">
                  Información general
                </h3>
                <div className="space-y-2 text-body-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">ID de transacción:</span>
                    <span className="font-mono font-medium">{transaction?.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Fecha y hora:</span>
                    <span className="font-medium">{formatDateTime(transaction?.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Tipo:</span>
                    <span className="font-medium capitalize">{transaction?.type === 'recharge' ? 'Recarga' : 'Dispensado'}</span>
                  </div>
                </div>
              </div>

              {/* Machine Details (for dispensing) */}
              {transaction?.type === 'dispensing' && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <h3 className="text-body font-semibold text-text-primary mb-3">
                    Detalles del dispensado
                  </h3>
                  <div className="space-y-2 text-body-sm">
                    {transaction?.machineId && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">ID de máquina:</span>
                        <span className="font-mono font-medium">{transaction?.machineId}</span>
                      </div>
                    )}
                    {transaction?.machineLocation && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Ubicación:</span>
                        <span className="font-medium">{transaction?.machineLocation}</span>
                      </div>
                    )}
                    {transaction?.liters && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Litros dispensados:</span>
                        <span className="font-medium">{transaction?.liters}L</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="text-body font-semibold text-text-primary mb-3">
                  Detalles de pago
                </h3>
                <div className="space-y-2 text-body-sm">
                  {transaction?.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Método de pago:</span>
                      <span className="font-medium">{transaction?.paymentMethod}</span>
                    </div>
                  )}
                  {transaction?.balanceBefore !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Saldo anterior:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: transaction?.currency || 'MXN'
                        }).format(transaction?.balanceBefore)}
                      </span>
                    </div>
                  )}
                  {transaction?.balanceAfter !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Saldo después:</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: transaction?.currency || 'MXN'
                        }).format(transaction?.balanceAfter)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onGenerateReceipt(transaction)}
            iconName="FileText"
            iconPosition="left"
            iconSize={16}
            className="flex-1"
          >
            Descargar recibo
          </Button>
          <Button
            variant="outline"
            onClick={() => onShare(transaction)}
            iconName="Share2"
            iconPosition="left"
            iconSize={16}
            className="flex-1"
          >
            Compartir
          </Button>
          <Button
            variant="default"
            onClick={onClose}
            className="flex-1"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;