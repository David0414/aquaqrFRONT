import React, { useState, useEffect, useCallback } from 'react';
import Icon from '../AppIcon';

const NotificationToast = ({ className = '' }) => {
  const [toasts, setToasts] = useState([]);

  // Toast types configuration
  const toastTypes = {
    success: {
      icon: 'CheckCircle',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      textColor: 'text-success',
      iconColor: 'text-success'
    },
    error: {
      icon: 'XCircle',
      bgColor: 'bg-error/10',
      borderColor: 'border-error/20',
      textColor: 'text-error',
      iconColor: 'text-error'
    },
    warning: {
      icon: 'AlertTriangle',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20',
      textColor: 'text-warning',
      iconColor: 'text-warning'
    },
    info: {
      icon: 'Info',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20',
      textColor: 'text-primary',
      iconColor: 'text-primary'
    }
  };

  // Add toast function
  const addToast = useCallback((message, type = 'info', duration = 5000, action = null) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type,
      duration,
      action,
      timestamp: Date.now()
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  // Remove toast function
  const removeToast = useCallback((id) => {
    setToasts(prev => prev?.filter(toast => toast?.id !== id));
  }, []);

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Global toast functions - attach to window for global access
  useEffect(() => {
    window.showToast = addToast;
    window.hideToast = removeToast;
    window.clearToasts = clearAllToasts;

    // Cleanup
    return () => {
      delete window.showToast;
      delete window.hideToast;
      delete window.clearToasts;
    };
  }, [addToast, removeToast, clearAllToasts]);

  // Listen for custom toast events
  useEffect(() => {
    const handleToastEvent = (event) => {
      const { message, type, duration, action } = event?.detail;
      addToast(message, type, duration, action);
    };

    window.addEventListener('showToast', handleToastEvent);
    return () => window.removeEventListener('showToast', handleToastEvent);
  }, [addToast]);

  if (toasts?.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-20 left-4 right-4 z-50 space-y-2 ${className}`}>
      {toasts?.map((toast) => {
        const config = toastTypes?.[toast?.type] || toastTypes?.info;
        
        return (
          <div
            key={toast?.id}
            className={`
              flex items-start space-x-3 p-4 rounded-lg border backdrop-blur-sm
              ${config?.bgColor} ${config?.borderColor}
              animate-scale-in shadow-soft-lg
            `}
            role="alert"
            aria-live="polite"
          >
            <Icon 
              name={config?.icon} 
              size={20} 
              className={`flex-shrink-0 mt-0.5 ${config?.iconColor}`}
            />
            <div className="flex-1 min-w-0">
              <p className={`text-body-sm font-medium ${config?.textColor}`}>
                {toast?.message}
              </p>
              
              {toast?.action && (
                <button
                  onClick={toast?.action?.onClick}
                  className={`
                    mt-2 text-body-sm font-medium underline hover:no-underline
                    ${config?.textColor} opacity-80 hover:opacity-100
                    transition-opacity duration-200
                  `}
                >
                  {toast?.action?.label}
                </button>
              )}
            </div>
            <button
              onClick={() => removeToast(toast?.id)}
              className={`
                flex-shrink-0 p-1 rounded-md hover:bg-black/5 
                transition-colors duration-200 ${config?.textColor} opacity-60 hover:opacity-100
              `}
              aria-label="Cerrar notificación"
            >
              <Icon name="X" size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Utility functions for easy toast usage
export const showSuccessToast = (message, duration = 5000) => {
  if (window.showToast) {
    window.showToast(message, 'success', duration);
  }
};

export const showErrorToast = (message, duration = 7000) => {
  if (window.showToast) {
    window.showToast(message, 'error', duration);
  }
};

export const showWarningToast = (message, duration = 6000) => {
  if (window.showToast) {
    window.showToast(message, 'warning', duration);
  }
};

export const showInfoToast = (message, duration = 5000) => {
  if (window.showToast) {
    window.showToast(message, 'info', duration);
  }
};

export default NotificationToast;