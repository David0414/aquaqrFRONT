import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';

const BottomTabNavigation = ({ isVisible = true, className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    {
      label: 'Inicio',
      path: '/home-dashboard',
      icon: 'Home',
      tooltip: 'Panel principal y saldo'
    },
    {
      label: 'Dispensar',
      path: '/qr-scanner-landing',
      icon: 'Droplets',
      tooltip: 'Control de dispensado'
    },
    {
      label: 'Recargar',
      path: '/balance-recharge',
      icon: 'CreditCard',
      tooltip: 'Recargar saldo'
    },
    {
      label: 'Historial',
      path: '/transaction-history',
      icon: 'History',
      tooltip: 'Historial de transacciones'
    },
    {
      label: 'Perfil',
      path: '/user-profile-settings',
      icon: 'User',
      tooltip: 'Configuración de perfil'
    }
  ];

  const handleTabClick = (path) => {
    navigate(path);
  };

  const isActiveTab = (path) => {
    if (path === '/qr-scanner-landing') {
      return ['/qr-scanner-landing', '/water-dispensing-control', '/filling-progress', '/transaction-complete']
        .includes(location?.pathname);
    }
    return location?.pathname === path;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 ${className}`}
      role="navigation"
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-14 md:h-16 px-2">
        {tabs?.map((tab) => {
          const isActive = isActiveTab(tab?.path);

          return (
            <button
              key={tab?.path}
              onClick={() => handleTabClick(tab?.path)}
              className={`
                flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-2 rounded-md
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
                text-xs font-caption leading-none truncate max-w-full
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