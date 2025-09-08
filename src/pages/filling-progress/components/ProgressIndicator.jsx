import React from 'react';

const ProgressIndicator = ({ 
  progress = 0, 
  remainingTime = 0, 
  flowRate = 0,
  isActive = true 
}) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs?.toString()?.padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Progress Circle */}
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-border"
          />
          
          {/* Progress Circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
            className={`text-primary transition-all duration-500 ease-out ${
              isActive ? 'drop-shadow-lg' : ''
            }`}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Progress Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-text-primary">
            {Math.round(progress)}%
          </span>
          <span className="text-body-sm text-text-secondary mt-1">
            Completado
          </span>
        </div>
      </div>
      {/* Progress Stats */}
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-body-xs text-text-secondary mb-1">
            Tiempo restante
          </div>
          <div className="text-heading-xs font-semibold text-text-primary">
            {formatTime(remainingTime)}
          </div>
        </div>
        
        <div className="text-center p-3 bg-muted rounded-lg">
          <div className="text-body-xs text-text-secondary mb-1">
            Flujo actual
          </div>
          <div className="text-heading-xs font-semibold text-text-primary">
            {flowRate?.toFixed(1)} L/min
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;