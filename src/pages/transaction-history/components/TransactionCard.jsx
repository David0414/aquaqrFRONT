import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TransactionCard = ({ 
  transaction, 
  onViewDetails, 
  onGenerateReceipt, 
  onShare,
  searchTerm = '',
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
        className: 'bg-success/10 text-success border-success/20' 
      },
      pending: { 
        label: 'Pendiente', 
        className: 'bg-warning/10 text-warning border-warning/20' 
      },
      failed: { 
        label: 'Fallida', 
        className: 'bg-error/10 text-error border-error/20' 
      },
      cancelled: { 
        label: 'Cancelada', 
        className: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20' 
      }
    };

    const config = statusConfig?.[status] || statusConfig?.completed;
    
    return (
      <span className={`
        inline-flex items-center px-2 py-1 rounded-md text-caption font-medium border
        ${config?.className}
      `}>
        {config?.label}
      </span>
    );
  };

  const formatAmount = (amount, type) => {
    const formattedAmount = new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    })?.format(Math.abs(amount));

    return type === 'recharge' ? `+${formattedAmount}` : `-${formattedAmount}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date?.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      }),
      time: date?.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const highlightText = (text, searchTerm) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text?.split(regex);
    
    return parts?.map((part, index) => 
      regex?.test(part) ? (
        <mark key={index} className="bg-primary/20 text-primary px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const { date, time } = formatDate(transaction?.date);
  const icon = getTransactionIcon(transaction?.type);

  return (
    <div className={`
      bg-card border border-border rounded-xl overflow-hidden
      hover:shadow-soft-md transition-all duration-200
      ${className}
    `}>
      {/* Main Transaction Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-lg bg-muted 
              flex items-center justify-center ${icon?.color}
            `}>
              <Icon name={icon?.name} size={20} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-body font-semibold text-text-primary truncate">
                  {highlightText(transaction?.description, searchTerm)}
                </h3>
                <div className="flex-shrink-0 ml-2">
                  {getStatusBadge(transaction?.status)}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-body-sm text-text-secondary">
                  <div>{date} • {time}</div>
                  {transaction?.machineLocation && (
                    <div className="mt-1">
                      <Icon name="MapPin" size={14} className="inline mr-1" />
                      {highlightText(transaction?.machineLocation, searchTerm)}
                    </div>
                  )}
                </div>
                
                <div className={`
                  text-body font-bold
                  ${transaction?.type === 'recharge' ? 'text-success' : 'text-text-primary'}
                `}>
                  {formatAmount(transaction?.amount, transaction?.type)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction ID */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-caption text-text-secondary">
              ID: {highlightText(transaction?.id, searchTerm)}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              iconName={isExpanded ? "ChevronUp" : "ChevronDown"}
              iconPosition="right"
              iconSize={16}
            >
              {isExpanded ? 'Menos detalles' : 'Más detalles'}
            </Button>
          </div>
        </div>
      </div>
      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border bg-muted/30">
          <div className="pt-4 space-y-3">
            {/* Additional Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
              {transaction?.machineId && (
                <div>
                  <span className="text-text-secondary">Máquina:</span>
                  <span className="ml-2 font-medium">{transaction?.machineId}</span>
                </div>
              )}
              
              {transaction?.liters && (
                <div>
                  <span className="text-text-secondary">Litros:</span>
                  <span className="ml-2 font-medium">{transaction?.liters}L</span>
                </div>
              )}
              
              {transaction?.paymentMethod && (
                <div>
                  <span className="text-text-secondary">Método de pago:</span>
                  <span className="ml-2 font-medium">{transaction?.paymentMethod}</span>
                </div>
              )}
              
              {transaction?.balanceAfter !== undefined && (
                <div>
                  <span className="text-text-secondary">Saldo después:</span>
                  <span className="ml-2 font-medium">
                    {new Intl.NumberFormat('es-ES', {
                      style: 'currency',
                      currency: 'EUR'
                    })?.format(transaction?.balanceAfter)}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(transaction)}
                iconName="Eye"
                iconPosition="left"
                iconSize={16}
              >
                Ver detalles
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onGenerateReceipt(transaction)}
                iconName="FileText"
                iconPosition="left"
                iconSize={16}
              >
                Recibo PDF
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onShare(transaction)}
                iconName="Share2"
                iconPosition="left"
                iconSize={16}
              >
                Compartir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;