import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast, { showSuccessToast, showErrorToast, showInfoToast } from '../../components/ui/NotificationToast';
import TransactionFilters from './components/TransactionFilters';
import TransactionList from './components/TransactionList';
import TransactionDetailModal from './components/TransactionDetailModal';

const TransactionHistory = () => {
  const navigate = useNavigate();
  
  // State management
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'month',
    search: '',
    startDate: '',
    endDate: ''
  });

  // Mock transaction data
  const mockTransactions = [
    {
      id: 'TXN-2025-001234',
      type: 'dispensing',
      description: 'Dispensado de agua purificada',
      amount: 2.50,
      date: '2025-01-05T14:30:00Z',
      status: 'completed',
      machineId: 'AQ-MAD-001',
      machineLocation: 'Centro Comercial Plaza Norte, Madrid',
      liters: 2.5,
      paymentMethod: 'Saldo prepago',
      balanceBefore: 25.00,
      balanceAfter: 22.50
    },
    {
      id: 'TXN-2025-001233',
      type: 'recharge',
      description: 'Recarga de saldo',
      amount: 50.00,
      date: '2025-01-05T10:15:00Z',
      status: 'completed',
      paymentMethod: 'Tarjeta de crédito ****1234',
      balanceBefore: 5.00,
      balanceAfter: 55.00
    },
    {
      id: 'TXN-2025-001232',
      type: 'dispensing',
      description: 'Dispensado de agua purificada',
      amount: 5.00,
      date: '2025-01-04T16:45:00Z',
      status: 'completed',
      machineId: 'AQ-MAD-003',
      machineLocation: 'Estación de Metro Sol, Madrid',
      liters: 5.0,
      paymentMethod: 'Saldo prepago',
      balanceBefore: 10.00,
      balanceAfter: 5.00
    },
    {
      id: 'TXN-2025-001231',
      type: 'dispensing',
      description: 'Dispensado de agua purificada',
      amount: 1.00,
      date: '2025-01-04T12:20:00Z',
      status: 'failed',
      machineId: 'AQ-MAD-002',
      machineLocation: 'Universidad Complutense, Madrid',
      liters: 1.0,
      paymentMethod: 'Saldo prepago',
      balanceBefore: 11.00,
      balanceAfter: 11.00
    },
    {
      id: 'TXN-2025-001230',
      type: 'recharge',
      description: 'Recarga de saldo',
      amount: 30.00,
      date: '2025-01-03T09:30:00Z',
      status: 'completed',
      paymentMethod: 'PayPal',
      balanceBefore: 1.00,
      balanceAfter: 31.00
    },
    {
      id: 'TXN-2025-001229',
      type: 'dispensing',
      description: 'Dispensado de agua purificada',
      amount: 0.50,
      date: '2025-01-03T18:10:00Z',
      status: 'completed',
      machineId: 'AQ-MAD-001',
      machineLocation: 'Centro Comercial Plaza Norte, Madrid',
      liters: 0.5,
      paymentMethod: 'Saldo prepago',
      balanceBefore: 1.50,
      balanceAfter: 1.00
    },
    {
      id: 'TXN-2025-001228',
      type: 'dispensing',
      description: 'Dispensado de agua purificada',
      amount: 10.00,
      date: '2025-01-02T15:25:00Z',
      status: 'cancelled',
      machineId: 'AQ-MAD-004',
      machineLocation: 'Parque del Retiro, Madrid',
      liters: 10.0,
      paymentMethod: 'Saldo prepago',
      balanceBefore: 11.50,
      balanceAfter: 11.50
    },
    {
      id: 'TXN-2025-001227',
      type: 'recharge',
      description: 'Recarga de saldo',
      amount: 100.00,
      date: '2025-01-01T11:00:00Z',
      status: 'completed',
      paymentMethod: 'Transferencia bancaria',
      balanceBefore: 0.00,
      balanceAfter: 100.00
    }
  ];

  // Load initial transactions
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTransactions(mockTransactions);
      setIsLoading(false);
    };

    loadTransactions();
  }, []);

  // Filter transactions based on current filters
  const filterTransactions = useCallback(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filters?.type !== 'all') {
      filtered = filtered?.filter(transaction => transaction?.type === filters?.type);
    }

    // Filter by date range
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filters?.dateRange) {
      case 'today':
        filtered = filtered?.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= today;
        });
        break;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered?.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= weekAgo;
        });
        break;
      case 'month':
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        filtered = filtered?.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= monthAgo;
        });
        break;
      case '3months':
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        filtered = filtered?.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= threeMonthsAgo;
        });
        break;
      case 'custom':
        if (filters?.startDate && filters?.endDate) {
          const startDate = new Date(filters.startDate);
          const endDate = new Date(filters.endDate);
          endDate?.setHours(23, 59, 59, 999); // Include full end date
          
          filtered = filtered?.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startDate && transactionDate <= endDate;
          });
        }
        break;
    }

    // Filter by search term
    if (filters?.search) {
      const searchLower = filters?.search?.toLowerCase();
      filtered = filtered?.filter(transaction => 
        transaction?.id?.toLowerCase()?.includes(searchLower) ||
        transaction?.description?.toLowerCase()?.includes(searchLower) ||
        transaction?.amount?.toString()?.includes(searchLower) ||
        (transaction?.machineLocation && transaction?.machineLocation?.toLowerCase()?.includes(searchLower)) ||
        (transaction?.machineId && transaction?.machineId?.toLowerCase()?.includes(searchLower))
      );
    }

    // Sort by date (newest first)
    filtered?.sort((a, b) => new Date(b.date) - new Date(a.date));

    setFilteredTransactions(filtered);
  }, [transactions, filters]);

  // Apply filters when transactions or filters change
  useEffect(() => {
    filterTransactions();
  }, [filterTransactions]);

  // Handle filter changes
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Handle load more transactions
  const handleLoadMore = async () => {
    setIsLoading(true);
    
    // Simulate loading more data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, we'll just set hasMore to false
    setHasMore(false);
    setIsLoading(false);
    
    showInfoToast('No hay más transacciones para cargar');
  };

  // Handle view transaction details
  const handleViewDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  // Handle generate receipt
  const handleGenerateReceipt = async (transaction) => {
    try {
      showInfoToast('Generando recibo PDF...');
      
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would trigger a PDF download
      const link = document.createElement('a');
      link.href = '#'; // Would be actual PDF URL
      link.download = `recibo-${transaction?.id}.pdf`;
      
      showSuccessToast('Recibo generado correctamente');
    } catch (error) {
      showErrorToast('Error al generar el recibo');
    }
  };

  // Handle share transaction
  const handleShare = async (transaction) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Transacción AquaQR',
          text: `${transaction?.description} - ${transaction?.amount}€`,
          url: window.location?.href
        });
      } else {
        // Fallback: copy to clipboard
        const shareText = `${transaction?.description}\nMonto: ${transaction?.amount}€\nFecha: ${new Date(transaction.date)?.toLocaleDateString('es-ES')}\nID: ${transaction?.id}`;
        await navigator.clipboard?.writeText(shareText);
        showSuccessToast('Detalles copiados al portapapeles');
      }
    } catch (error) {
      showErrorToast('Error al compartir la transacción');
    }
  };

  // Handle export
  const handleExport = async (format) => {
    try {
      showInfoToast(`Exportando transacciones en formato ${format?.toUpperCase()}...`);
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real app, this would generate and download the file
      const filename = `transacciones-${new Date()?.toISOString()?.split('T')?.[0]}.${format}`;
      
      showSuccessToast(`Archivo ${filename} descargado correctamente`);
    } catch (error) {
      showErrorToast('Error al exportar las transacciones');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/home-dashboard')}
                iconName="ArrowLeft"
                iconSize={20}
                className="lg:hidden"
              />
              <div>
                <h1 className="text-heading-md font-bold text-text-primary">
                  Historial de transacciones
                </h1>
                <p className="text-body-sm text-text-secondary">
                  Revisa todas tus transacciones y descargas recibos
                </p>
              </div>
            </div>
            
            <div className="hidden lg:flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => navigate('/balance-recharge')}
                iconName="CreditCard"
                iconPosition="left"
                iconSize={16}
              >
                Recargar saldo
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20 lg:pb-6">
        <div className="space-y-6">
          {/* Filters */}
          <TransactionFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            resultsCount={filteredTransactions?.length}
            isLoading={isLoading}
            onExport={handleExport}
          />

          {/* Transaction List */}
          <TransactionList
            transactions={filteredTransactions}
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
            onViewDetails={handleViewDetails}
            onGenerateReceipt={handleGenerateReceipt}
            onShare={handleShare}
            searchTerm={filters?.search}
          />
        </div>
      </div>
      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedTransaction(null);
        }}
        onGenerateReceipt={handleGenerateReceipt}
        onShare={handleShare}
      />
      {/* Bottom Navigation */}
      <BottomTabNavigation />
      {/* Toast Notifications */}
      <NotificationToast />
    </div>
  );
};

export default TransactionHistory;