import React, { useState } from 'react';

import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';

const TransactionFilters = ({ 
  filters, 
  onFiltersChange, 
  resultsCount, 
  isLoading,
  onExport,
  className = '' 
}) => {
  const [showDateRange, setShowDateRange] = useState(false);

  const transactionTypeOptions = [
    { value: 'all', label: 'Todas las transacciones' },
    { value: 'recharge', label: 'Recargas' },
    { value: 'dispensing', label: 'Servicios de dispensado' }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Hoy' },
    { value: 'week', label: 'Esta semana' },
    { value: 'month', label: 'Este mes' },
    { value: '3months', label: 'Últimos 3 meses' },
    { value: 'custom', label: 'Rango personalizado' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    if (key === 'dateRange' && value === 'custom') {
      setShowDateRange(true);
    } else if (key === 'dateRange' && value !== 'custom') {
      setShowDateRange(false);
      newFilters.startDate = '';
      newFilters.endDate = '';
    }
    
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setShowDateRange(false);
    onFiltersChange({
      type: 'all',
      dateRange: 'month',
      search: '',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = filters?.type !== 'all' || 
                          filters?.dateRange !== 'month' || 
                          filters?.search || 
                          filters?.startDate || 
                          filters?.endDate;

  return (
    <div className={`bg-card border border-border rounded-xl p-4 space-y-4 ${className}`}>
      {/* Filter Controls Row */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Transaction Type Filter */}
        <div className="flex-1">
          <Select
            label="Tipo de transacción"
            options={transactionTypeOptions}
            value={filters?.type}
            onChange={(value) => handleFilterChange('type', value)}
            className="w-full"
          />
        </div>

        {/* Date Range Filter */}
        <div className="flex-1">
          <Select
            label="Período"
            options={dateRangeOptions}
            value={filters?.dateRange}
            onChange={(value) => handleFilterChange('dateRange', value)}
            className="w-full"
          />
        </div>

        {/* Search Input */}
        <div className="flex-1">
          <Input
            label="Buscar"
            type="search"
            placeholder="ID, monto, ubicación..."
            value={filters?.search}
            onChange={(e) => handleFilterChange('search', e?.target?.value)}
            className="w-full"
          />
        </div>
      </div>
      {/* Custom Date Range */}
      {showDateRange && (
        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted rounded-lg">
          <div className="flex-1">
            <Input
              label="Fecha inicio"
              type="date"
              value={filters?.startDate}
              onChange={(e) => handleFilterChange('startDate', e?.target?.value)}
            />
          </div>
          <div className="flex-1">
            <Input
              label="Fecha fin"
              type="date"
              value={filters?.endDate}
              onChange={(e) => handleFilterChange('endDate', e?.target?.value)}
            />
          </div>
        </div>
      )}
      {/* Results Summary and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border">
        <div className="flex items-center space-x-4">
          <div className="text-body-sm text-text-secondary">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span>Cargando...</span>
              </div>
            ) : (
              <span>
                {resultsCount} {resultsCount === 1 ? 'transacción encontrada' : 'transacciones encontradas'}
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              iconName="X"
              iconPosition="left"
              iconSize={16}
              className="text-text-secondary hover:text-text-primary"
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('csv')}
            iconName="Download"
            iconPosition="left"
            iconSize={16}
            disabled={resultsCount === 0 || isLoading}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('pdf')}
            iconName="FileText"
            iconPosition="left"
            iconSize={16}
            disabled={resultsCount === 0 || isLoading}
          >
            PDF
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionFilters;