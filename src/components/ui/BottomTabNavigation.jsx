import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const BottomTabNavigation = ({ isVisible = true, className = '', onNavigate = null }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    {
      label: 'Inicio',
      path: '/home-dashboard',
      icon: 'Home',
      tooltip: 'Panel principal y saldo',
    },
    {
      label: 'Dispensar',
      path: '/qr-scanner-landing',
      icon: 'Droplets',
      tooltip: 'Control de dispensado',
    },
    {
      label: 'Recargar',
      path: '/balance-recharge',
      icon: 'CreditCard',
      tooltip: 'Recargar saldo',
    },
    {
      label: 'Historial',
      path: '/transaction-history',
      icon: 'History',
      tooltip: 'Historial de transacciones',
    },
    {
      label: 'Promos',
      path: '/promotions',
      icon: 'Gift',
      tooltip: 'Promociones y beneficios',
    },
  ];

  const handleTabClick = (path) => {
    if (onNavigate?.(path) === false) return;

    if (path === '/qr-scanner-landing') {
      navigate(path, {
        state: {
          fromDashboard: true,
          action: 'dispense',
          redirectAfterScan: '/water/choose',
          prepareQrOnMount: true,
        },
      });
      return;
    }

    navigate(path);
  };

  const isActiveTab = (path) => {
    if (path === '/qr-scanner-landing') {
      return ['/qr-scanner-landing', '/water-dispensing-control', '/filling-progress', '/transaction-complete', '/water/choose', '/water/position-down', '/water/position-up']
        .includes(location?.pathname);
    }
    return location?.pathname === path;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background ${className}`}
      role="navigation"
      aria-label="Navegacion principal"
    >
      <div className="flex h-14 items-center justify-around px-2 md:h-16">
        {tabs?.map((tab) => {
          const isActive = isActiveTab(tab?.path);

          return (
            <button
              key={tab?.path}
              onClick={() => handleTabClick(tab?.path)}
              className={`
                flex min-w-0 flex-1 flex-col items-center justify-center rounded-md px-2 py-1
                transition-all duration-200 ease-out-custom
                hover:bg-muted active:scale-95
                ${isActive
                  ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
                }
              `}
              aria-label={tab?.tooltip}
              title={tab?.tooltip}
            >
              <div className={`
                transition-transform duration-200 ease-out-custom
                ${isActive ? 'scale-110' : 'scale-100'}
              `}>
                <Icon
                  name={tab?.icon}
                  size={20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="mb-1"
                />
              </div>
              <span className={`
                max-w-full truncate text-xs font-caption leading-none
                ${isActive ? 'font-medium' : 'font-normal'}
              `}>
                {tab?.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomTabNavigation;
