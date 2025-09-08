import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentTransactions = ({ transactions, onViewAll }) => {
  const [expandedTransaction, setExpandedTransaction] = useState(null);

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'dispensing':
        return { icon: 'Droplets', color: 'text-primary' };
      case 'recharge':
        return { icon: 'Plus', color: 'text-success' };
      case 'donation':
        return { icon: 'Heart', color: 'text-warning' };
      default:
        return { icon: 'Activity', color: 'text-secondary' };
    }
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })?.format(new Date(date));
  };

  const toggleExpanded = (transactionId) => {
    setExpandedTransaction(
      expandedTransaction === transactionId ? null : transactionId
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-heading-sm font-semibold text-text-primary">
            Transacciones Recientes
          </h3>
          <Button 
            variant="ghost" 
            size="sm" 
            iconName="ArrowRight" 
            iconPosition="right"
            onClick={onViewAll}
          >
            Ver Todo
          </Button>
        </div>
      </div>
      <div className="divide-y divide-border">
        {transactions?.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
              <Icon name="Activity" size={24} className="text-text-secondary" />
            </div>
            <p className="text-text-secondary text-body-sm">
              No hay transacciones recientes
            </p>
          </div>
        ) : (
          transactions?.slice(0, 5)?.map((transaction) => {
            const { icon, color } = getTransactionIcon(transaction?.type);
            const isExpanded = expandedTransaction === transaction?.id;
            
            return (
              <div key={transaction?.id} className="p-4">
                <button
                  onClick={() => toggleExpanded(transaction?.id)}
                  className="w-full flex items-center space-x-4 text-left hover:bg-muted/50 rounded-lg p-2 -m-2 transition-colors duration-200"
                >
                  <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon name={icon} size={20} className={color} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-body-sm font-medium text-text-primary truncate">
                        {transaction?.description}
                      </h4>
                      <span className={`
                        text-body-sm font-semibold
                        ${transaction?.amount > 0 ? 'text-success' : 'text-error'}
                      `}>
                        {transaction?.amount > 0 ? '+' : ''}${Math.abs(transaction?.amount)?.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-caption text-text-secondary">
                        {formatDate(transaction?.date)}
                      </p>
                      <span className={`
                        text-caption px-2 py-1 rounded-full
                        ${transaction?.status === 'completed' ? 'bg-success/10 text-success' : ''}
                        ${transaction?.status === 'pending' ? 'bg-warning/10 text-warning' : ''}
                        ${transaction?.status === 'failed' ? 'bg-error/10 text-error' : ''}
                      `}>
                        {transaction?.status === 'completed' && 'Completado'}
                        {transaction?.status === 'pending' && 'Pendiente'}
                        {transaction?.status === 'failed' && 'Fallido'}
                      </span>
                    </div>
                  </div>
                  
                  <Icon 
                    name={isExpanded ? "ChevronUp" : "ChevronDown"} 
                    size={16} 
                    className="text-text-secondary flex-shrink-0" 
                  />
                </button>
                {isExpanded && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex justify-between text-caption">
                      <span className="text-text-secondary">ID Transacción:</span>
                      <span className="text-text-primary font-data">{transaction?.id}</span>
                    </div>
                    {transaction?.machineId && (
                      <div className="flex justify-between text-caption">
                        <span className="text-text-secondary">Máquina:</span>
                        <span className="text-text-primary">{transaction?.machineId}</span>
                      </div>
                    )}
                    {transaction?.location && (
                      <div className="flex justify-between text-caption">
                        <span className="text-text-secondary">Ubicación:</span>
                        <span className="text-text-primary">{transaction?.location}</span>
                      </div>
                    )}
                    {transaction?.liters && (
                      <div className="flex justify-between text-caption">
                        <span className="text-text-secondary">Cantidad:</span>
                        <span className="text-text-primary">{transaction?.liters}L</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;