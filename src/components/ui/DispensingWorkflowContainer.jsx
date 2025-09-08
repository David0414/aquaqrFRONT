import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const DispensingWorkflowContainer = ({ 
  children, 
  onWorkflowStateChange,
  className = '' 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isInWorkflow, setIsInWorkflow] = useState(false);
  const [workflowStep, setWorkflowStep] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [workflowData, setWorkflowData] = useState({});

  // Dispensing workflow routes
  const workflowRoutes = [
    '/water-dispensing-control',
    '/filling-progress', 
    '/transaction-complete'
  ];

  const isWorkflowRoute = workflowRoutes?.includes(location?.pathname);

  // Determine current workflow step
  const getCurrentStep = useCallback(() => {
    switch (location?.pathname) {
      case '/water-dispensing-control':
        return 'control';
      case '/filling-progress':
        return 'progress';
      case '/transaction-complete':
        return 'complete';
      default:
        return null;
    }
  }, [location?.pathname]);

  // Handle workflow state changes
  useEffect(() => {
    const currentStep = getCurrentStep();
    const inWorkflow = isWorkflowRoute;
    
    setIsInWorkflow(inWorkflow);
    setWorkflowStep(currentStep);
    
    // Notify parent component of workflow state change
    if (onWorkflowStateChange) {
      onWorkflowStateChange({
        isInWorkflow: inWorkflow,
        step: currentStep,
        connectionStatus,
        data: workflowData
      });
    }
  }, [location?.pathname, isWorkflowRoute, getCurrentStep, onWorkflowStateChange, connectionStatus, workflowData]);

  // Simulate WebSocket connection for hardware communication
  useEffect(() => {
    if (isInWorkflow) {
      // Simulate connection establishment
      setConnectionStatus('connecting');
      
      const connectTimer = setTimeout(() => {
        setConnectionStatus('connected');
      }, 1500);

      // Cleanup on workflow exit
      return () => {
        clearTimeout(connectTimer);
        setConnectionStatus('disconnected');
      };
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isInWorkflow]);

  // Handle workflow interruption (back button, navigation away)
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (isInWorkflow && workflowStep === 'progress') {
        event?.preventDefault();
        event.returnValue = 'El dispensado está en progreso. ¿Estás seguro de que quieres salir?';
        return event?.returnValue;
      }
    };

    const handlePopState = (event) => {
      if (isInWorkflow && workflowStep === 'progress') {
        const confirmExit = window.confirm('El dispensado está en progreso. ¿Estás seguro de que quieres cancelar?');
        if (!confirmExit) {
          event?.preventDefault();
          window.history?.pushState(null, '', location?.pathname);
        }
      }
    };

    if (isInWorkflow) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      
      // Prevent accidental navigation during critical steps
      if (workflowStep === 'progress') {
        window.history?.pushState(null, '', location?.pathname);
      }
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isInWorkflow, workflowStep, location?.pathname]);

  // Workflow control functions
  const startWorkflow = useCallback((initialData = {}) => {
    setWorkflowData(initialData);
    navigate('/water-dispensing-control');
  }, [navigate]);

  const updateWorkflowData = useCallback((newData) => {
    setWorkflowData(prev => ({ ...prev, ...newData }));
  }, []);

  const completeWorkflow = useCallback((completionData = {}) => {
    setWorkflowData(prev => ({ ...prev, ...completionData }));
    navigate('/transaction-complete');
  }, [navigate]);

  const cancelWorkflow = useCallback(() => {
    if (workflowStep === 'progress') {
      const confirmCancel = window.confirm('¿Estás seguro de que quieres cancelar el dispensado?');
      if (!confirmCancel) return;
    }
    
    setWorkflowData({});
    setConnectionStatus('disconnected');
    navigate('/home-dashboard');
  }, [workflowStep, navigate]);

  // Provide workflow context to children
  const workflowContext = {
    isInWorkflow,
    workflowStep,
    connectionStatus,
    workflowData,
    startWorkflow,
    updateWorkflowData,
    completeWorkflow,
    cancelWorkflow
  };

  return (
    <div className={`workflow-container ${className}`}>
      {React.cloneElement(children, { workflowContext })}
      
      {/* Connection Status Indicator */}
      {isInWorkflow && (
        <div className="fixed top-4 right-4 z-40">
          <div className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg text-body-sm font-medium
            ${connectionStatus === 'connected' ?'bg-success/10 text-success border border-success/20' 
              : connectionStatus === 'connecting' ?'bg-warning/10 text-warning border border-warning/20' :'bg-error/10 text-error border border-error/20'
            }
          `}>
            <div className={`
              w-2 h-2 rounded-full
              ${connectionStatus === 'connected' ?'bg-success animate-pulse-soft' 
                : connectionStatus === 'connecting' ?'bg-warning animate-pulse' :'bg-error'
              }
            `} />
            <span>
              {connectionStatus === 'connected' && 'Conectado'}
              {connectionStatus === 'connecting' && 'Conectando...'}
              {connectionStatus === 'disconnected' && 'Desconectado'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispensingWorkflowContainer;