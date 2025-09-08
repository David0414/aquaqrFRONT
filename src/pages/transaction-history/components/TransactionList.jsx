import React from 'react';
import TransactionCard from './TransactionCard';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TransactionList = ({ 
  transactions, 
  isLoading, 
  hasMore, 
  onLoadMore, 
  onViewDetails, 
  onGenerateReceipt, 
  onShare,
  searchTerm = '',
  className = '' 
}) => {
  // Loading skeleton component
  const TransactionSkeleton = () => (
    <div className="bg-card border border-border rounded-xl p-4 animate-pulse">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-muted rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-6 bg-muted rounded-full w-20"></div>
          </div>
          <div className="h-3 bg-muted rounded w-1/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );

  // Empty state component
  const EmptyState = ({ hasFilters }) => (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
        <Icon name={hasFilters ? "Search" : "Receipt"} size={24} className="text-text-secondary" />
      </div>
      <h3 className="text-heading-sm font-semibold text-text-primary mb-2">
        {hasFilters ? 'No se encontraron transacciones' : 'Sin transacciones'}
      </h3>
      <p className="text-body-sm text-text-secondary max-w-sm mx-auto">
        {hasFilters 
          ? 'Intenta ajustar los filtros para encontrar las transacciones que buscas.' :'Cuando realices transacciones, aparecerán aquí para que puedas revisarlas.'
        }
      </p>
    </div>
  );

  const hasFilters = searchTerm || false; // Add other filter checks as needed

  if (isLoading && transactions?.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 5 })?.map((_, index) => (
          <TransactionSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (transactions?.length === 0) {
    return (
      <div className={className}>
        <EmptyState hasFilters={hasFilters} />
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Transaction Cards */}
      {transactions?.map((transaction) => (
        <TransactionCard
          key={transaction?.id}
          transaction={transaction}
          onViewDetails={onViewDetails}
          onGenerateReceipt={onGenerateReceipt}
          onShare={onShare}
          searchTerm={searchTerm}
        />
      ))}
      {/* Loading More Indicator */}
      {isLoading && transactions?.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center space-x-2 text-text-secondary">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-body-sm">Cargando más transacciones...</span>
          </div>
        </div>
      )}
      {/* Load More Button */}
      {hasMore && !isLoading && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={onLoadMore}
            iconName="ChevronDown"
            iconPosition="right"
            iconSize={16}
          >
            Cargar más transacciones
          </Button>
        </div>
      )}
      {/* End of Results Indicator */}
      {!hasMore && transactions?.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-text-secondary">
            <Icon name="Check" size={16} />
            <span className="text-body-sm">Has visto todas las transacciones</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;