import React from 'react';
import Icon from '../../../components/AppIcon';

const TransactionSummary = ({ 
  amount = 0, 
  bonus = 0, 
  fees = 0, 
  currentBalance = 0,
  className = '' 
}) => {
  const finalAmount = amount + bonus;
  const totalCost = amount + fees;
  const newBalance = currentBalance + finalAmount;

  const summaryItems = [
    {
      label: 'Monto a recargar',
      value: `$${amount?.toFixed(2)}`,
      type: 'normal'
    },
    ...(bonus > 0 ? [{
      label: 'Bonus incluido',
      value: `+$${bonus?.toFixed(2)}`,
      type: 'success'
    }] : []),
    ...(fees > 0 ? [{
      label: 'Comisión de procesamiento',
      value: `$${fees?.toFixed(2)}`,
      type: 'warning'
    }] : []),
    {
      label: 'Total a pagar',
      value: `$${totalCost?.toFixed(2)}`,
      type: 'total'
    }
  ];

  if (amount === 0) {
    return null;
  }

  return (
    <div className={`bg-card rounded-xl border border-border p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <Icon name="Receipt" size={20} className="text-primary" />
        <h3 className="font-semibold text-text-primary">Resumen de Transacción</h3>
      </div>
      <div className="space-y-3">
        {summaryItems?.map((item, index) => (
          <div 
            key={index}
            className={`
              flex justify-between items-center
              ${item?.type === 'total' ? 'pt-3 border-t border-border font-semibold' : ''}
            `}
          >
            <span className={`
              ${item?.type === 'total' ? 'text-text-primary' : 'text-text-secondary'}
              text-body-sm
            `}>
              {item?.label}
            </span>
            <span className={`
              font-medium
              ${item?.type === 'success' ? 'text-success' : 
                item?.type === 'warning' ? 'text-warning' :
                item?.type === 'total'? 'text-text-primary text-lg' : 'text-text-primary'}
            `}>
              {item?.value}
            </span>
          </div>
        ))}

        <div className="pt-3 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary text-body-sm">Saldo actual</span>
            <span className="font-medium text-text-primary">${currentBalance?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mt-2">
            <span className="text-text-secondary text-body-sm">Nuevo saldo</span>
            <span className="font-bold text-primary text-lg">${newBalance?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionSummary;