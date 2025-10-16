import React from 'react';

const WaterDropAvatar = ({ title = '¡Hola!' }) => {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-40 h-48 flex items-end justify-center">
          <svg viewBox="0 0 120 160" className="drop-anim" aria-label="Avatar Gota">
            <defs>
              <linearGradient id="dropG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c1dc" />
                <stop offset="100%" stopColor="#0ea5b7" />
              </linearGradient>
            </defs>
            {/* cuerpo */}
            <path d="M60 10 C52 28 30 56 30 88 a30 30 0 0 0 60 0 c0-32-22-60-30-78z" fill="url(#dropG)" />
            {/* ojos */}
            <circle cx="47" cy="90" r="3.5" fill="white" />
            <circle cx="73" cy="90" r="3.5" fill="white" />
            {/* boca */}
            <path d="M50 103 q10 6 20 0" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* patitas */}
            <line x1="52" y1="128" x2="48" y2="150" stroke="#0c7181" strokeWidth="4" strokeLinecap="round" />
            <line x1="68" y1="128" x2="72" y2="150" stroke="#0c7181" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        <h3 className="mt-3 text-body-base font-semibold text-text-primary">{title}</h3>
        <p className="text-body-sm text-text-secondary">Pronto versión animada con IA 🤖✨</p>
      </div>

      <style>{`
        .drop-anim { animation: floaty 3s ease-in-out infinite; }
        @keyframes floaty {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
};

export default WaterDropAvatar;
