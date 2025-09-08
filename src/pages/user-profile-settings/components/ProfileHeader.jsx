import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const ProfileHeader = ({ user, onImageUpdate }) => {
  const [isImageUploading, setIsImageUploading] = useState(false);

  const handleImageUpload = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    setIsImageUploading(true);
    
    // Simulate image upload
    setTimeout(() => {
      const newImageUrl = `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face`;
      onImageUpdate(newImageUrl);
      setIsImageUploading(false);
      
      if (window.showToast) {
        window.showToast('Foto de perfil actualizada correctamente', 'success');
      }
    }, 2000);
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        {/* Profile Image */}
        <div className="relative">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-muted border-4 border-white shadow-soft-lg">
            <Image
              src={user?.profileImage}
              alt={`Foto de perfil de ${user?.name}`}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Upload Button */}
          <label className="absolute -bottom-2 -right-2 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isImageUploading}
            />
            <div className={`
              w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center
              shadow-soft-lg hover:bg-primary/90 transition-colors duration-200
              ${isImageUploading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
            `}>
              {isImageUploading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Icon name="Camera" size={16} />
              )}
            </div>
          </label>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-heading-lg font-bold text-text-primary mb-2">
            {user?.name}
          </h1>
          <p className="text-body-base text-text-secondary mb-1">
            {user?.email}
          </p>
          <p className="text-body-sm text-text-secondary mb-4">
            Miembro desde {user?.memberSince}
          </p>
          
          {/* Quick Stats */}
          <div className="flex justify-center sm:justify-start space-x-6">
            <div className="text-center">
              <div className="text-heading-sm font-bold text-primary">
                {user?.totalLitersDispensed}L
              </div>
              <div className="text-body-xs text-text-secondary">
                Dispensados
              </div>
            </div>
            <div className="text-center">
              <div className="text-heading-sm font-bold text-success">
                ${user?.totalDonated}
              </div>
              <div className="text-body-xs text-text-secondary">
                Donados
              </div>
            </div>
            <div className="text-center">
              <div className="text-heading-sm font-bold text-accent">
                {user?.transactionCount}
              </div>
              <div className="text-body-xs text-text-secondary">
                Transacciones
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;