import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useDispenseFlow } from '../FlowProvider';

export default function PricingCalculator() {
  const { getToken } = useAuth();
  const { machine, selectedLiters } = useDispenseFlow();
  const [coverage, setCoverage] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    setCoverage(null);
    if (!machine?.id) return;
    (async () => {
      try {
        const token = await getToken({ template: 'aquaqr-api' });
        const query = new URLSearchParams({ machineId: machine.id, liters: selectedLiters,
          ...(machine.hardwareId ? { hardwareId: machine.hardwareId } : {}) });
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/dispense/coverage?${query}`, {
          headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        const data = await response.json();
        if (response.ok && !controller.signal.aborted) setCoverage(data);
      } catch { /* The start endpoint always verifies coverage and balance again. */ }
    })();
    return () => controller.abort();
  }, [getToken, machine?.id, machine?.hardwareId, selectedLiters]);
  if (!coverage?.membershipCoveredLiters) return null;
  return <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
    <p>{coverage.membershipCoveredLiters} litros incluidos en tu membresía.</p>
    <p className="font-semibold">Por pagar con saldo: ${(coverage.payableCents / 100).toFixed(2)}</p>
  </div>;
}
