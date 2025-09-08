import React from 'react';

const WaterAnimation = ({ isActive = true }) => {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      {/* Water Drop Container */}
      <div className="relative w-full h-full">
        {/* Main Water Drop */}
        <div className={`
          absolute inset-0 rounded-full bg-gradient-to-b from-primary/20 to-primary/40
          ${isActive ? 'animate-pulse' : ''}
        `}>
          {/* Inner Drop */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-b from-primary/30 to-primary/60">
            {/* Core Drop */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-b from-primary/50 to-primary/80">
              {/* Center Highlight */}
              <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-white/30" />
            </div>
          </div>
        </div>

        {/* Animated Ripples */}
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
            <div className="absolute inset-2 rounded-full border-2 border-primary/30 animate-ping animation-delay-300" />
            <div className="absolute inset-4 rounded-full border-2 border-primary/40 animate-ping animation-delay-600" />
          </>
        )}

        {/* Flowing Water Effect */}
        {isActive && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="w-1 h-8 bg-gradient-to-b from-primary to-transparent animate-pulse" />
          </div>
        )}
      </div>

      {/* Floating Bubbles */}
      {isActive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-4 w-2 h-2 bg-primary/30 rounded-full animate-bounce animation-delay-100" />
          <div className="absolute top-12 right-6 w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce animation-delay-300" />
          <div className="absolute bottom-8 left-8 w-1 h-1 bg-primary/20 rounded-full animate-bounce animation-delay-500" />
        </div>
      )}
    </div>
  );
};

export default WaterAnimation;