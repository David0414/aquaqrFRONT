import React from 'react';

import Icon from '../../../components/AppIcon';

const SocialLoginOptions = ({ onSocialLogin, isLoading }) => {
  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: 'Chrome',
      bgColor: 'bg-white hover:bg-gray-50',
      textColor: 'text-gray-700',
      borderColor: 'border-gray-300'
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: 'Apple',
      bgColor: 'bg-black hover:bg-gray-900',
      textColor: 'text-white',
      borderColor: 'border-black'
    }
  ];

  const handleSocialLogin = (providerId) => {
    if (onSocialLogin) {
      onSocialLogin(providerId);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-body-sm">
          <span className="px-4 bg-background text-text-secondary">O continúa con</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {socialProviders?.map((provider) => (
          <button
            key={provider?.id}
            onClick={() => handleSocialLogin(provider?.id)}
            disabled={isLoading}
            className={`
              flex items-center justify-center space-x-3 px-4 py-3 rounded-lg border
              transition-all duration-200 font-medium text-body-sm
              ${provider?.bgColor} ${provider?.textColor} ${provider?.borderColor}
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:shadow-soft-md active:scale-98
            `}
          >
            <Icon name={provider?.icon} size={20} />
            <span>{provider?.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SocialLoginOptions;