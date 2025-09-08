import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentTransactions = ({ transactions, className = '' }) => {
  const navigate = useNavigate();

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(date);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'dispensing':
        return 'Droplets';
      case 'recharge':
        return 'CreditCard';
      default:
        return 'Circle';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'dispensing':
        return 'text-primary';
      case 'recharge':
        return 'text-success';
      default:
        return 'text-text-secondary';
    }
  };

  const handleViewAllTransactions = () => {
    navigate('/transaction-history');
  };

  if (!transactions || transactions?.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-heading-base font-semibold text-text-primary">
          Transacciones Recientes
        </h3>
        <Button
          variant="ghost"
          size="sm"
          iconName="ArrowRight"
          iconPosition="right"
          onClick={handleViewAllTransactions}
          className="text-primary hover:bg-primary/5"
        >
          Ver Todas
        </Button>
      </div>
      {/* Transactions List */}
      <div className="space-y-3">
        {transactions?.slice(0, 3)?.map((transaction, index) => (
          <div
            key={transaction?.id}
            className={`
              bg-card rounded-xl p-4 border border-border
              transition-all duration-200 ease-out
              hover:shadow-soft-sm hover:border-primary/20
              ${index === 0 ? 'ring-2 ring-primary/10' : ''}
            `}
          >
            <div className="flex items-center space-x-3">
              {/* Transaction Icon */}
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                ${transaction?.type === 'dispensing' ? 'bg-primary/10' : 'bg-success/10'}
              `}>
                <Icon 
                  name={getTransactionIcon(transaction?.type)} 
                  size={20} 
                  className={getTransactionColor(transaction?.type)}
                />
              </div>

              {/* Transaction Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-body-sm font-medium text-text-primary truncate">
                    {transaction?.description}
                  </p>
                  <span className={`
                    text-body-sm font-semibold
                    ${transaction?.type === 'dispensing' ? 'text-error' : 'text-success'}
                  `}>
                    {transaction?.type === 'dispensing' ? '-' : '+'}${transaction?.amount}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-body-xs text-text-secondary">
                    {formatDate(transaction?.timestamp)}
                  </p>
                  {transaction?.type === 'dispensing' && (
                    <p className="text-body-xs text-text-secondary">
                      {transaction?.liters}L
                    </p>
                  )}
                </div>
              </div>

              {/* New Transaction Badge */}
              {index === 0 && (
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                </div>
              )}
            </div>

            {/* Transaction Status */}
            {transaction?.status && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center space-x-2">
                  <Icon 
                    name={transaction?.status === 'completed' ? 'CheckCircle' : 'Clock'} 
                    size={14} 
                    className={transaction?.status === 'completed' ? 'text-success' : 'text-warning'}
                  />
                  <span className={`
                    text-body-xs font-medium
                    ${transaction?.status === 'completed' ? 'text-success' : 'text-warning'}
                  `}>
                    {transaction?.status === 'completed' ? 'Completado' : 'Procesando'}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* View More Button */}
      {transactions?.length > 3 && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            iconName="Plus"
            iconPosition="left"
            onClick={handleViewAllTransactions}
            className="border-border text-text-secondary hover:bg-muted"
          >
            Ver {transactions?.length - 3} Transacciones Más
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;