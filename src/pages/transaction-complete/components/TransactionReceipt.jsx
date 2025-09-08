import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TransactionReceipt = ({ transactionData, onGeneratePDF, className = '' }) => {
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(date);
  };

  const receiptData = [
    {
      label: 'ID de Transacción',
      value: transactionData?.transactionId,
      icon: 'Hash'
    },
    {
      label: 'Fecha y Hora',
      value: formatDate(transactionData?.timestamp),
      icon: 'Calendar'
    },
    {
      label: 'Ubicación',
      value: transactionData?.machineLocation,
      icon: 'MapPin'
    },
    {
      label: 'Método de Pago',
      value: transactionData?.paymentMethod,
      icon: 'CreditCard'
    },
    {
      label: 'Cantidad',
      value: `${transactionData?.liters}L`,
      icon: 'Droplets'
    },
    {
      label: 'Precio por Litro',
      value: `$${transactionData?.pricePerLiter}`,
      icon: 'DollarSign'
    }
  ];

  return (
    <div className={`bg-card rounded-2xl border border-border overflow-hidden ${className}`}>
      {/* Receipt Header */}
      <div className="bg-primary/5 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-heading-base font-semibold text-text-primary">
            Recibo de Transacción
          </h2>
          <Button
            variant="outline"
            size="sm"
            iconName="Download"
            iconPosition="left"
            onClick={onGeneratePDF}
            className="text-primary border-primary/20 hover:bg-primary/5"
          >
            PDF
          </Button>
        </div>
      </div>
      {/* Receipt Details */}
      <div className="p-6 space-y-4">
        {receiptData?.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon name={item?.icon} size={16} className="text-text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-xs text-text-secondary">{item?.label}</p>
              <p className="text-body-sm font-medium text-text-primary truncate">
                {item?.value}
              </p>
            </div>
          </div>
        ))}

        {/* Total Section */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-body-base font-medium text-text-primary">Total Pagado</span>
            <span className="text-heading-base font-bold text-primary">
              ${transactionData?.totalCost}
            </span>
          </div>
        </div>

        {/* QR Code for Receipt */}
        <div className="pt-4 flex justify-center">
          <div className="w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
            <Icon name="QrCode" size={32} className="text-text-secondary" />
          </div>
        </div>
        <p className="text-body-xs text-text-secondary text-center">
          Código QR del recibo
        </p>
      </div>
    </div>
  );
};

export default TransactionReceipt;