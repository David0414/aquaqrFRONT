// src/pages/transaction-history/components/TransactionCard.jsx
import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TransactionCard = ({
  transaction,
  onViewDetails,
  onGenerateReceipt,
  onShare,
  searchTerm = '',
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  /* ----------------------------- helpers UI ------------------------------ */

  const getTransactionIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'recharge':
        return { name: 'CreditCard', color: 'text-success' };
      case 'dispensing':
        return { name: 'Droplets', color: 'text-primary' };
      default:
        return { name: 'ArrowUpDown', color: 'text-text-secondary' };
    }
  };

  const getStatusBadge = (status) => {
    const key = (status || '').toLowerCase();
    const map = {
      completed: { label: 'Completada', className: 'bg-success/10 text-success border-success/20' },
      pending: { label: 'Pendiente', className: 'bg-warning/10 text-warning border-warning/20' },
      failed: { label: 'Fallida', className: 'bg-error/10 text-error border-error/20' },
      cancelled: { label: 'Cancelada', className: 'bg-text-secondary/10 text-text-secondary border-text-secondary/20' },
    };
    const cfg = map[key] || map.completed;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-caption font-medium border ${cfg.className}`}>
        {cfg.label}
      </span>
    );
  };

  const formatMoney = (amount, currencyCode) => {
    const code = (currencyCode || 'MXN').toUpperCase();
    const n = Number.isFinite(amount) ? Number(amount) : 0;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
    }).format(n);
  };

  const formatSignedAmount = (amount, type, currency) => {
    const sign = (type || '').toLowerCase() === 'recharge' ? '+' : '-';
    return `${sign}${formatMoney(Math.abs(Number(amount) || 0), currency)}`;
  };

  const formatDateParts = (iso) => {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const highlightText = (text, query) => {
    if (!query || !text) return text;
    const safe = escapeRegExp(query);
    const re = new RegExp(`(${safe})`, 'gi');
    return String(text).split(re).map((part, i) =>
      re.test(part) ? (
        <mark key={i} className="bg-primary/20 text-primary px-1 rounded">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  /* -------------------------------- render -------------------------------- */

  const icon = getTransactionIcon(transaction?.type);
  const { date, time } = formatDateParts(transaction?.date);

  return (
    <div
      className={`
        bg-card border border-border rounded-xl overflow-hidden
        hover:shadow-soft-md transition-all duration-200
        ${className}
      `}
    >
      {/* Row principal */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${icon.color}`}>
              <Icon name={icon.name} size={20} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-body font-semibold text-text-primary truncate">
                  {highlightText(transaction?.description || (transaction?.type === 'recharge' ? 'Recarga de saldo' : 'Transacción'), searchTerm)}
                </h3>
                <div className="flex-shrink-0 ml-2">{getStatusBadge(transaction?.status)}</div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-body-sm text-text-secondary">
                  <div>
                    {date} • {time}
                  </div>
                  {transaction?.machineLocation && (
                    <div className="mt-1">
                      <Icon name="MapPin" size={14} className="inline mr-1" />
                      {highlightText(transaction.machineLocation, searchTerm)}
                    </div>
                  )}
                </div>

                <div
                  className={`
                    text-body font-bold text-right ml-3
                    ${transaction?.type === 'recharge' ? 'text-success' : 'text-text-primary'}
                  `}
                >
                  {formatSignedAmount(transaction?.amount, transaction?.type, transaction?.currency)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Línea con ID + toggle */}
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-caption text-text-secondary truncate">
              ID: {highlightText(transaction?.id || transaction?.providerPaymentId || '—', searchTerm)}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded((v) => !v)}
              iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
              iconPosition="right"
              iconSize={16}
            >
              {isExpanded ? 'Menos detalles' : 'Más detalles'}
            </Button>
          </div>
        </div>
      </div>

      {/* Detalle expandido */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border bg-muted/30">
          <div className="pt-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
              {/* Método de pago (útil para recargas) */}
              {transaction?.paymentMethod && (
                <div>
                  <span className="text-text-secondary">Método de pago:</span>
                  <span className="ml-2 font-medium">{transaction.paymentMethod}</span>
                </div>
              )}

              {/* ID de Stripe si viene */}
              {transaction?.providerPaymentId && (
                <div className="truncate">
                  <span className="text-text-secondary">Pago (proveedor):</span>
                  <span className="ml-2 font-medium">{transaction.providerPaymentId}</span>
                </div>
              )}

              {/* Campos para “dispensing” (quedan listos para cuando lo tengas) */}
              {transaction?.machineId && (
                <div>
                  <span className="text-text-secondary">Máquina:</span>
                  <span className="ml-2 font-medium">{transaction.machineId}</span>
                </div>
              )}
              {transaction?.liters != null && (
                <div>
                  <span className="text-text-secondary">Litros:</span>
                  <span className="ml-2 font-medium">{transaction.liters} L</span>
                </div>
              )}

              {/* Saldos opcionales si los mandas */}
              {transaction?.balanceBefore != null && (
                <div>
                  <span className="text-text-secondary">Saldo anterior:</span>
                  <span className="ml-2 font-medium">
                    {formatMoney(transaction.balanceBefore, transaction?.currency)}
                  </span>
                </div>
              )}
              {transaction?.balanceAfter != null && (
                <div>
                  <span className="text-text-secondary">Saldo después:</span>
                  <span className="ml-2 font-medium">
                    {formatMoney(transaction.balanceAfter, transaction?.currency)}
                  </span>
                </div>
              )}
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-2 pt-2">
              {onViewDetails && (
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
              )}

              {onGenerateReceipt && (
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
              )}

              {onShare && (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionCard;
