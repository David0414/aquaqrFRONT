import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ShareSection = ({ transactionData, impactData, className = '' }) => {
  const [shareLoading, setShareLoading] = useState(false);

  const shareText = `¡Acabo de dispensar ${transactionData?.liters}L de agua purificada con AquaQR! 🌊\n\nMi impacto positivo:\n💚 ${impactData?.co2Reduced}kg de CO₂ reducido\n♻️ ${impactData?.plasticAvoided} botellas plásticas evitadas\n❤️ $${impactData?.totalDonation} donados a la comunidad\n\n#AguaPura #ImpactoPositivo #AquaQR`;

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: 'MessageCircle',
      color: 'text-success',
      bgColor: 'bg-success/10',
      action: () => handleShare('whatsapp')
    },
    {
      name: 'Twitter',
      icon: 'Twitter',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      action: () => handleShare('twitter')
    },
    {
      name: 'Facebook',
      icon: 'Facebook',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      action: () => handleShare('facebook')
    },
    {
      name: 'Copiar',
      icon: 'Copy',
      color: 'text-text-secondary',
      bgColor: 'bg-muted',
      action: () => handleShare('copy')
    }
  ];

  const handleShare = async (platform) => {
    setShareLoading(true);
    
    try {
      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location?.href)}&quote=${encodeURIComponent(shareText)}`, '_blank');
          break;
        case 'copy':
          await navigator.clipboard?.writeText(shareText);
          if (window.showToast) {
            window.showToast('Texto copiado al portapapeles', 'success');
          }
          break;
        case 'native':
          if (navigator.share) {
            await navigator.share({
              title: 'Mi Impacto Positivo - AquaQR',
              text: shareText,
              url: window.location?.href
            });
          }
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if (window.showToast) {
        window.showToast('Error al compartir', 'error');
      }
    } finally {
      setShareLoading(false);
    }
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      handleShare('native');
    } else {
      // Fallback to copy
      handleShare('copy');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Share Header */}
      <div className="text-center space-y-2">
        <h3 className="text-heading-base font-semibold text-text-primary">
          Comparte tu Impacto
        </h3>
        <p className="text-body-base text-text-secondary">
          Inspira a otros a hacer la diferencia
        </p>
      </div>
      {/* Native Share Button (Mobile) */}
      <div className="sm:hidden">
        <Button
          variant="default"
          size="lg"
          fullWidth
          iconName="Share"
          iconPosition="left"
          loading={shareLoading}
          onClick={handleNativeShare}
          className="bg-gradient-to-r from-primary to-accent"
        >
          Compartir Impacto
        </Button>
      </div>
      {/* Share Options Grid (Desktop) */}
      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-3">
        {shareOptions?.map((option, index) => (
          <button
            key={index}
            onClick={option?.action}
            disabled={shareLoading}
            className={`
              ${option?.bgColor} rounded-2xl p-4 text-center
              transition-all duration-200 ease-out
              hover:scale-105 active:scale-95
              disabled:opacity-50 disabled:cursor-not-allowed
              border border-transparent hover:border-border
            `}
          >
            <div className="flex flex-col items-center space-y-2">
              <Icon 
                name={option?.icon} 
                size={24} 
                className={option?.color}
              />
              <span className="text-body-sm font-medium text-text-primary">
                {option?.name}
              </span>
            </div>
          </button>
        ))}
      </div>
      {/* Share Preview */}
      <div className="bg-surface rounded-2xl p-4 border border-border">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon name="MessageSquare" size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-xs text-text-secondary mb-2">Vista previa del mensaje:</p>
            <div className="bg-card rounded-lg p-3 border border-border">
              <p className="text-body-sm text-text-primary whitespace-pre-line">
                {shareText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareSection;