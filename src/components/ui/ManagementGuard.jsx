import React from 'react';
import { useLocation } from 'react-router-dom';
import { AccountGuard, useAccountAccess } from './AccountAccess';

export const useManagementAccess = () => useAccountAccess().access;

export default function ManagementGuard({ children }) {
  const { pathname } = useLocation();
  const role = pathname.replace(/\/+$/, '') === '/partner-panel' ? 'PARTNER' : 'ADMIN';
  return <AccountGuard roles={[role]}>{children}</AccountGuard>;
}
