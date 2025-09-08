import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import BottomTabNavigation from '../../components/ui/BottomTabNavigation';
import NotificationToast from '../../components/ui/NotificationToast';

// Import components
import ProfileHeader from './components/ProfileHeader';
import PersonalInfoSection from './components/PersonalInfoSection';
import SecuritySection from './components/SecuritySection';
import NotificationPreferences from './components/NotificationPreferences';
import AccountStatistics from './components/AccountStatistics';
import PrivacySettings from './components/PrivacySettings';
import SessionManagement from './components/SessionManagement';

const UserProfileSettings = () => {
  const navigate = useNavigate();
  
  // Mock user data
  const [user, setUser] = useState({
    id: 1,
    name: "María González",
    email: "maria.gonzalez@email.com",
    phone: "+52 55 1234 5678",
    profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    memberSince: "Marzo 2024",
    lastPasswordChange: "15 Abr 2024",
    twoFactorEnabled: false,
    totalLitersDispensed: 247,
    totalDonated: 73.5,
    transactionCount: 89,
    membershipDays: 52,
    notifications: {
      transactionConfirmations: true,
      promotionalOffers: true,
      socialImpactUpdates: true,
      securityAlerts: true,
      maintenanceNotices: false,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true
    },
    privacy: {
      dataSharing: false,
      marketingCommunications: true,
      analyticsTracking: true,
      thirdPartySharing: false,
      locationTracking: true
    }
  });

  const [activeSection, setActiveSection] = useState('personal');

  // Handle user data updates
  const handleUserUpdate = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const handleImageUpdate = (newImageUrl) => {
    setUser(prev => ({ ...prev, profileImage: newImageUrl }));
  };

  // Navigation sections
  const sections = [
    {
      id: 'personal',
      title: 'Personal',
      icon: 'User',
      component: PersonalInfoSection
    },
    {
      id: 'security',
      title: 'Seguridad',
      icon: 'Shield',
      component: SecuritySection
    },
    {
      id: 'notifications',
      title: 'Notificaciones',
      icon: 'Bell',
      component: NotificationPreferences
    },
    {
      id: 'statistics',
      title: 'Estadísticas',
      icon: 'BarChart3',
      component: AccountStatistics
    },
    {
      id: 'privacy',
      title: 'Privacidad',
      icon: 'Lock',
      component: PrivacySettings
    },
    {
      id: 'sessions',
      title: 'Sesiones',
      icon: 'Monitor',
      component: SessionManagement
    }
  ];

  const ActiveComponent = sections?.find(s => s?.id === activeSection)?.component;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                iconName="ArrowLeft"
                onClick={() => navigate('/home-dashboard')}
                className="lg:hidden"
              />
              <div>
                <h1 className="text-heading-lg font-bold text-text-primary">
                  Configuración
                </h1>
                <p className="text-body-sm text-text-secondary">
                  Gestiona tu cuenta y preferencias
                </p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              iconName="X"
              onClick={() => navigate('/home-dashboard')}
              className="hidden lg:flex"
            />
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 py-6 pb-20">
        {/* Profile Header */}
        <ProfileHeader 
          user={user} 
          onImageUpdate={handleImageUpdate}
        />

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <nav className="space-y-2">
                {sections?.map((section) => (
                  <button
                    key={section?.id}
                    onClick={() => setActiveSection(section?.id)}
                    className={`
                      w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left
                      transition-all duration-200
                      ${activeSection === section?.id
                        ? 'bg-primary/10 text-primary border border-primary/20' :'text-text-secondary hover:text-text-primary hover:bg-muted/50'
                      }
                    `}
                  >
                    <Icon 
                      name={section?.icon} 
                      size={20} 
                      className={activeSection === section?.id ? 'text-primary' : 'text-text-secondary'} 
                    />
                    <span className="font-medium">{section?.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Mobile Section Selector */}
          <div className="lg:hidden mb-6">
            <div className="flex overflow-x-auto space-x-2 pb-2">
              {sections?.map((section) => (
                <button
                  key={section?.id}
                  onClick={() => setActiveSection(section?.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap
                    transition-all duration-200 flex-shrink-0
                    ${activeSection === section?.id
                      ? 'bg-primary text-white' :'bg-muted text-text-secondary hover:bg-muted/80'
                    }
                  `}
                >
                  <Icon name={section?.icon} size={16} />
                  <span className="text-body-sm font-medium">{section?.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {ActiveComponent && (
              <ActiveComponent 
                user={user} 
                onUserUpdate={handleUserUpdate}
              />
            )}
          </div>
        </div>
      </div>
      {/* Bottom Navigation */}
      <BottomTabNavigation />
      {/* Toast Notifications */}
      <NotificationToast />
    </div>
  );
};

export default UserProfileSettings;