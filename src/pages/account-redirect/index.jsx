import React, { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { managementRequest } from '../../lib/management';

export default function AccountRedirect() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    let cancelled = false;
    managementRequest('/api/management/me', getToken).then((data) => {
      if (!cancelled) navigate(data.defaultPath || '/home-dashboard', { replace: true });
    }).catch(() => { if (!cancelled) navigate('/home-dashboard', { replace: true }); });
    return () => { cancelled = true; };
  }, [getToken, navigate]);
  return <div className="p-8 text-center">Abriendo tu cuenta…</div>;
}
