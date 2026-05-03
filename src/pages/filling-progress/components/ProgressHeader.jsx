import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressHeader = ({
  machineId,
  location,
  connectionStatus,
  onCancel,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background p-4">
      <div className="flex items-center space-x-3">
        <button
          onClick={onCancel}
          className="rounded-lg p-2 transition-colors duration-200 hover:bg-muted"
          aria-label="Cancelar"
        >
          <Icon name="X" size={20} className="text-error" />
        </button>

        <div>
          <h1 className="text-heading-sm font-semibold text-text-primary">Dispensando</h1>
          <p className="text-body-sm text-text-secondary">
            {machineId} {location ? `· ${location}` : ''}
          </p>
        </div>
      </div>

      <div
        className={`
          flex items-center space-x-2 rounded-full px-3 py-1.5 text-body-xs font-medium
          ${
            connectionStatus === 'connected'
              ? 'bg-success/10 text-success'
              : connectionStatus === 'connecting'
                ? 'bg-warning/10 text-warning'
                : 'bg-error/10 text-error'
          }
        `}
      >
        <div
          className={`
            h-2 w-2 rounded-full
            ${
              connectionStatus === 'connected'
                ? 'bg-success animate-pulse'
                : connectionStatus === 'connecting'
                  ? 'bg-warning animate-pulse'
                  : 'bg-error'
            }
          `}
        />
        <span>
          {connectionStatus === 'connected' && 'On'}
          {connectionStatus === 'connecting' && '...'}
          {connectionStatus === 'disconnected' && 'Off'}
        </span>
      </div>
    </div>
  );
};

export default ProgressHeader;
