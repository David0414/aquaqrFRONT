import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';
import Icon from '../../components/AppIcon';
import MembershipPlans from './MembershipPlans';
import PromotionalBanner from '../home-dashboard/components/PromotionalBanner';
import { useDispenseFlow } from '../water-dispensing-control/FlowProvider';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';

function moneyFromCents(amountCents) {
  return (Number(amountCents || 0) / 100).toFixed(2);
}

export default function PromotionsCenter() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const location = useLocation();
  const membershipView = new URLSearchParams(location.search).get('view') === 'memberships';
  const purchaseIds = useRef(new Map());
  const purchaseInFlight = useRef(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [loadError, setLoadError] = useState('');
  const { machine } = useDispenseFlow();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPromotionKeys, setSelectedPromotionKeys] = useState([]);
  const [savingSelection, setSavingSelection] = useState(false);
  const [purchasingMembershipKey, setPurchasingMembershipKey] = useState('');

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      setLoadError('');
      const query = new URLSearchParams({ ...(machine?.id ? { machineId: machine.id } : {}), ...(machine?.hardwareId ? { hardwareId: machine.hardwareId } : {}) });
      let res = await fetch(`${API}/api/rewards/summary?${query}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (res.status === 400) res = await fetch(`${API}/api/rewards/summary`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || 'No se pudo cargar promociones');
      setDashboard(data);
      setSelectedPromotionKeys(data?.selection?.selectedPromotionKeys || []);
    } catch (error) {
      setLoadError(error?.message || 'No se pudo cargar promociones');
    } finally {
      setLoading(false);
    }
  }, [getToken, machine?.id, machine?.hardwareId]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const monthlyProgress = dashboard?.monthlyProgress || {};
  const bonusBalance = Number(dashboard?.wallet?.bonusBalanceCents || 0);
  const activePromotions = (dashboard?.promotions || []).filter((promotion) => (promotion.isActive || promotion.status?.purchased) && promotion.key !== 'premium_membership');
  const selection = dashboard?.selection || { requiredCount: 0, selectedPromotionKeys: [], complete: true, selectablePromotions: [] };

  const toggleSelection = (promotionKey) => {
    const requiredCount = Number(selection?.requiredCount || 0);
    const promotion = (selection?.selectablePromotions || []).find((item) => item.key === promotionKey);
    setSelectedPromotionKeys((current) => {
      if (current.includes(promotionKey)) {
        return current.filter((key) => key !== promotionKey);
      }
      if (requiredCount === 1) return [promotionKey];
      if (promotion?.kind === 'membership') {
        const withoutOtherMemberships = current.filter((key) => {
          const selectedPromotion = (selection?.selectablePromotions || []).find((item) => item.key === key);
          return selectedPromotion?.kind !== 'membership';
        });
        if (withoutOtherMemberships.length >= requiredCount) {
          return withoutOtherMemberships;
        }
        return [...withoutOtherMemberships, promotionKey];
      }
      if (current.length >= requiredCount) {
        return current;
      }
      return [...current, promotionKey];
    });
  };

  const handleSaveSelection = async () => {
    try {
      setSavingSelection(true);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      const res = await fetch(`${API}/api/rewards/selection`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ promotionKeys: selectedPromotionKeys }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || 'No se pudo guardar tu seleccion');
      window.showToast?.('Tu promoción fue guardada por 30 días', 'success');
      await loadDashboard();
    } catch (error) {
      window.showToast?.(error?.message || 'No se pudo guardar tu seleccion', 'error');
    } finally {
      setSavingSelection(false);
    }
  };

  const handlePurchaseMembership = async (promotion) => {
    if (purchaseInFlight.current) return;
    purchaseInFlight.current = true;
    setPurchaseError('');
    try {
      setPurchasingMembershipKey(promotion.key);
      const requestKey = `${promotion.key}:${dashboard.machine?.id}:${promotion.config.purchasePriceCents}`;
      if (!purchaseIds.current.has(requestKey)) purchaseIds.current.set(requestKey,
        globalThis.crypto?.randomUUID?.() || `purchase_${Date.now()}_${Math.random().toString(36).slice(2)}`);
      const token = await getToken({ template: CLERK_JWT_TEMPLATE });
      const res = await fetch(`${API}/api/rewards/membership/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          promotionKey: promotion.key,
          machineId: machine?.id,
          hardwareId: machine?.hardwareId,
          expectedPriceCents: promotion.config.purchasePriceCents,
          purchaseId: purchaseIds.current.get(requestKey),
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 400 && data?.error === 'INSUFFICIENT_FUNDS') {
        handlePayMembershipWithCard(promotion, { fromInsufficientBalance: true, requiredAmount: Number(data.neededCents) / 100 });
        return;
      }
      if (data?.error === 'PRICE_CHANGED') await loadDashboard();
      if (!res.ok || !data) throw new Error(data?.message || data?.error || 'No se pudo pagar la membresía');
      window.showToast?.('Membresía pagada: tus litros están disponibles hasta agotarlos', 'success');
      window.dispatchEvent(new CustomEvent('wallet:updated', { detail: data.wallet }));
      purchaseIds.current.clear();
      await loadDashboard();
    } catch (error) {
      setPurchaseError(error?.message || 'No se pudo pagar la membresía');
    } finally {
      purchaseInFlight.current = false;
      setPurchasingMembershipKey('');
    }
  };

  const handlePayMembershipWithCard = (promotion, extra = {}) => {
    const missingCents = Math.max(0, Number(promotion.config.purchasePriceCents) - Number(dashboard?.wallet?.totalAvailableCents || 0));
    navigate('/balance-recharge', { state: {
      selectedAmountCents: Math.min(50000, Math.max(1000, missingCents)), paymentMethod: 'stripe',
      returnTo: '/promotions', membershipKey: promotion.key,
      ...(missingCents > 0 ? { fromInsufficientBalance: true, requiredAmount: missingCents / 100 } : {}), ...extra,
    } });
  };

  if (loading && !dashboard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-secondary text-body-sm">Cargando promociones...</p>
        </div>
      </div>
    );
  }

  const paidMembership = activePromotions.some((promotion) => promotion.kind === 'membership' && promotion.status?.purchased);
  const ordinaryPromotions = activePromotions.filter((promotion) => promotion.kind !== 'membership');
  const ordinarySelection = { ...selection, selectablePromotions: selection.selectablePromotions.filter((promotion) => promotion.kind !== 'membership') };
  const pointsProgress = monthlyProgress;
  return (
    <div className="min-h-screen bg-sky-50/50">
      <header className="sticky top-0 z-30 border-b border-sky-100 bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4">
          <h1 className="text-base font-bold text-slate-900">Promociones y membresías</h1>
          <button onClick={() => navigate('/user-profile-settings')} aria-label="Perfil" className="rounded-xl bg-sky-50 p-2"><Icon name="User" size={20} /></button>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-3 py-3 pb-24 sm:px-5">
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-sky-100/60 p-1" aria-label="Beneficios disponibles">
          {[{ membership: false, label: 'Promociones' }, { membership: true, label: 'Membresías' }].map((tab) => <button key={tab.label} type="button"
            aria-pressed={membershipView === tab.membership} onClick={() => navigate(tab.membership ? '/promotions?view=memberships' : '/promotions', { replace: true, state: location.state })}
            className={`rounded-lg py-2 text-sm font-semibold ${membershipView === tab.membership ? 'bg-white text-sky-900 shadow-sm' : 'text-slate-600'}`}>{tab.label}</button>)}
        </div>
        {loadError && <div role="alert" className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700">{loadError}<button onClick={loadDashboard} className="ml-3 font-bold underline">Reintentar</button></div>}
        {membershipView ? <MembershipPlans promotions={activePromotions} machine={dashboard?.machine} walletCents={dashboard?.wallet?.totalAvailableCents || 0}
          preferredKey={location.state?.membershipKey} purchasingKey={purchasingMembershipKey} onPurchase={handlePurchaseMembership}
          onRecharge={handlePayMembershipWithCard} error={purchaseError}
          onScan={() => navigate('/qr-scanner-landing', { state: { action: 'membership', redirectAfterScan: '/promotions?view=memberships' } })}
          onDispense={() => navigate('/qr-scanner-landing', { state: { action: 'dispense', redirectAfterScan: '/water/choose', prepareQrOnMount: true } })} />
          : <>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-sky-100 bg-white p-3"><p className="text-xs text-slate-500">Saldo de promociones</p><p className="mt-1 text-xl font-bold text-emerald-700">${moneyFromCents(bonusBalance)}</p></div>
              <div className="rounded-2xl border border-sky-100 bg-white p-3"><p className="text-xs text-slate-500">Puntos del mes</p><p className="mt-1 text-xl font-bold text-sky-800">{Number(pointsProgress.points || 0).toLocaleString('es-MX')}</p></div>
            </div>
            {paidMembership && <p className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Tu membresía está activa. Al agotar sus litros podrás elegir otra promoción.</p>}
            <PromotionalBanner promotions={ordinaryPromotions} monthlyProgress={monthlyProgress} bonusBalanceCents={bonusBalance}
              selection={paidMembership ? null : ordinarySelection} selectedPromotionKeys={selectedPromotionKeys} onToggleSelection={toggleSelection}
              onSaveSelection={handleSaveSelection} savingSelection={savingSelection} />
          </>}
      </main>
      <BottomTabNavigation />
      <NotificationToast />
    </div>
  );
}
