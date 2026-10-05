import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressHeader = ({
  machineId,
  location,
  connectionStatus,
  onCancel,
}) => {
  return (
    <div className="flex min-h-14 items-center justify-between gap-2 border-b border-border bg-background px-3 py-2">
      <div className="flex min-w-0 items-center space-x-2">
        <button
          onClick={onCancel}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 hover:bg-muted"
          aria-label="Cancelar"
        >
          <Icon name="X" size={20} className="text-error" />
        </button>

        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-text-primary">Dispensando</h1>
          <p className="truncate text-xs text-text-secondary" title={`${machineId} · ${location || ''}`}>
            {machineId} {location ? `· ${location}` : ''}
          </p>
        </div>
      </div>

      <div
        className={`
          flex shrink-0 items-center space-x-2 rounded-full px-3 py-1.5 text-body-xs font-medium
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
