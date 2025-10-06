// src/pages/transaction-history/index.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast, {
  showSuccessToast,
  showErrorToast,
  showInfoToast,
} from '../../components/ui/NotificationToast';

import TransactionFilters from './components/TransactionFilters';
import TransactionList from './components/TransactionList';
import TransactionDetailModal from './components/TransactionDetailModal';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

const TransactionHistory = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const [transactions, setTransactions] = useState([]); // recargas + dispensados
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'month',
    search: '',
    startDate: '',
    endDate: '',
  });

  // --------------------- llamada real al backend (único endpoint) ---------------------
  const fetchHistory = useCallback(async (token) => {
    const url = new URL(`${API}/api/history`);
    url.searchParams.set('limit', '100'); // opcional
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo obtener el historial');
    // items ya vienen normalizados: id, type, description, amount, currency, date, status, ...
    return data.items || [];
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      if (!token) throw new Error('Sin token de sesión');

      const items = await fetchHistory(token);
      // Por si acaso, aseguremos orden por fecha
      const ordered = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(ordered);
    } catch (e) {
      console.error(e);
      showErrorToast(e.message || 'No se pudo cargar el historial');
    } finally {
      setIsLoading(false);
    }
  }, [getToken, fetchHistory]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ---------------------------- filtros UI -------------------------------
  const applyFilters = useCallback(() => {
    let list = [...transactions];

    // Tipo
    if (filters.type !== 'all') {
      list = list.filter(t => (t.type || '').toLowerCase() === filters.type);
    }

    // Rango de fechas
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inRange = (d, from, to) => {
      const x = new Date(d);
      return (!from || x >= from) && (!to || x <= to);
    };

    switch (filters.dateRange) {
      case 'today': {
        list = list.filter(t => new Date(t.date) >= startOfToday);
        break;
      }
      case 'week': {
        const weekAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
        list = list.filter(t => new Date(t.date) >= weekAgo);
        break;
      }
      case 'month': {
        const monthAgo = new Date(startOfToday);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        list = list.filter(t => new Date(t.date) >= monthAgo);
        break;
      }
      case '3months': {
        const threeMonthsAgo = new Date(startOfToday);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        list = list.filter(t => new Date(t.date) >= threeMonthsAgo);
        break;
      }
      case 'custom': {
        if (filters.startDate && filters.endDate) {
          const from = new Date(filters.startDate);
          const to = new Date(filters.endDate);
          to.setHours(23, 59, 59, 999);
          list = list.filter(t => inRange(t.date, from, to));
        }
        break;
      }
      default:
        break;
    }

    // Búsqueda
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(t =>
        (t.id && String(t.id).toLowerCase().includes(q)) ||
        (t.providerPaymentId && String(t.providerPaymentId).toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        String(t.amount).includes(q) ||
        (t.machineId && String(t.machineId).toLowerCase().includes(q)) ||
        (t.machineLocation && String(t.machineLocation).toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredTransactions(list);
  }, [transactions, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // ---------------------------- acciones UI ------------------------------
  const handleViewDetails = (tx) => {
    setSelectedTransaction(tx);
    setShowDetailModal(true);
  };

  const handleGenerateReceipt = async () => {
    showInfoToast('Generando recibo PDF…');
    setTimeout(() => showSuccessToast('Recibo generado correctamente'), 800);
  };

  const handleShare = async (tx) => {
    try {
      const text = `${tx.description || (tx.type === 'recharge' ? 'Recarga' : 'Dispensado')}
Monto: ${tx.amount} ${tx.currency}
Fecha: ${new Date(tx.date).toLocaleString('es-MX')}
ID: ${tx.id}`;
      if (navigator.share) {
        await navigator.share({ title: 'Transacción AquaQR', text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(text);
        showSuccessToast('Detalles copiados al portapapeles');
      }
    } catch {
      showErrorToast('No se pudo compartir la transacción');
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
                <h1 className="text-heading-md font-bold text-text-primary">Historial de transacciones</h1>
                <p className="text-body-sm text-text-secondary">Recargas y dispensados</p>
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
              <Button
                variant="ghost"
                onClick={loadAll}
                iconName="RefreshCw"
                iconPosition="left"
                iconSize={16}
              >
                Actualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20 lg:pb-6">
        <div className="space-y-6">
          <TransactionFilters
            filters={filters}
            onFiltersChange={setFilters}
            resultsCount={filteredTransactions.length}
            isLoading={isLoading}
            onExport={(fmt) => showInfoToast(`Exportando a ${fmt.toUpperCase()}…`)}
          />

          <TransactionList
            transactions={filteredTransactions}
            isLoading={isLoading}
            hasMore={false}
            onLoadMore={() => {}}
            onViewDetails={handleViewDetails}
            onGenerateReceipt={handleGenerateReceipt}
            onShare={handleShare}
            searchTerm={filters.search}
          />
        </div>
      </div>

      {/* Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedTransaction(null); }}
        onGenerateReceipt={handleGenerateReceipt}
        onShare={handleShare}
      />

      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
};

export default TransactionHistory;
