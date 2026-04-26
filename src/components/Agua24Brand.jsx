import React from 'react';
import Icon from './AppIcon';

export default function Agua24Brand({
  variant = 'horizontal',
  className = '',
  markClassName = '',
  textClassName = '',
  showTagline = true,
}) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const src = variant === 'mark'
    ? '/assets/agua24-logo-mark.png'
    : '/assets/agua24-logo-horizontal.png';

  if (!imageFailed) {
    return (
      <img
        src={src}
        alt="AGUA/24"
        className={className}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-300 via-cyan-400 to-blue-700 shadow-sm ${markClassName}`}>
        <Icon name="Droplets" size={24} className="text-white" />
      </div>
      {variant !== 'mark' ? (
        <div className={`leading-tight ${textClassName}`}>
          <div className="text-xl font-extrabold tracking-wide text-[#1E3F7A]">
            AGUA<span className="text-[#42B9D4]">/24</span>
          </div>
          {showTagline ? (
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#1E3F7A]/70">
              Siempre cerca, siempre pura
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
