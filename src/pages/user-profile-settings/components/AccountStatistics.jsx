import React from 'react';
import Icon from '../../../components/AppIcon';

const AccountStatistics = ({ user }) => {
  const statistics = [
    {
      title: 'Litros dispensados',
      value: `${user?.totalLitersDispensed}L`,
      subtitle: 'Total acumulado',
      icon: 'Droplets',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      progress: Math.min((user?.totalLitersDispensed / 1000) * 100, 100)
    },
    {
      title: 'Transacciones',
      value: user?.transactionCount,
      subtitle: 'Completadas',
      icon: 'CreditCard',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      progress: Math.min((user?.transactionCount / 500) * 100, 100)
    },
    {
      title: 'Tiempo como miembro',
      value: user?.membershipDays,
      subtitle: 'Días activo',
      icon: 'Calendar',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      progress: Math.min((user?.membershipDays / 365) * 100, 100)
    }
  ];

  const achievements = [
    {
      id: 1,
      title: 'Primer Dispensado',
      description: 'Completaste tu primera transacción',
      icon: 'Award',
      earned: true,
      earnedDate: '15 Mar 2024'
    },
    {
      id: 2,
      title: 'Eco Warrior',
      description: 'Dispensaste más de 100L de agua',
      icon: 'Shield',
      earned: user?.totalLitersDispensed >= 100,
      earnedDate: user?.totalLitersDispensed >= 100 ? '22 Mar 2024' : null
    },
    {
      id: 3,
      title: 'Cliente Frecuente',
      description: 'Realizaste más de 50 transacciones',
      icon: 'Star',
      earned: user?.transactionCount >= 50,
      earnedDate: user?.transactionCount >= 50 ? '10 Abr 2024' : null
    }
  ];

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
          <Icon name="BarChart3" size={20} className="text-accent" />
        </div>
        <div>
          <h2 className="text-heading-base font-semibold text-text-primary">
            Estadísticas de Cuenta
          </h2>
          <p className="text-body-sm text-text-secondary">
            Tu actividad en AquaQR
          </p>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {statistics?.map((stat, index) => (
          <div key={index} className="p-4 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat?.bgColor}`}>
                <Icon name={stat?.icon} size={16} className={stat?.color} />
              </div>
              <div className="flex-1">
                <h3 className="text-body-sm font-medium text-text-secondary">
                  {stat?.title}
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-heading-sm font-bold text-text-primary">
                    {stat?.value}
                  </span>
                  <span className="text-body-xs text-text-secondary">
                    {stat?.subtitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    stat?.color?.includes('primary') ? 'bg-primary' :
                    stat?.color?.includes('success') ? 'bg-success' :
                    stat?.color?.includes('accent') ? 'bg-accent' : 'bg-warning'
                  }`}
                  style={{ width: `${stat?.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-body-xs text-text-secondary">
                <span>Progreso</span>
                <span>{Math.round(stat?.progress)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="border-t border-border pt-6">
        <h3 className="text-body-base font-medium text-text-primary mb-4">
          Logros
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {achievements?.map((achievement) => (
            <div
              key={achievement?.id}
              className={`
                p-4 rounded-xl border transition-all duration-200
                ${achievement?.earned ? 'bg-success/5 border-success/20' : 'bg-muted/20 border-border opacity-60'}
              `}
            >
              <div className="flex items-start space-x-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                  ${achievement?.earned ? 'bg-success/20 text-success' : 'bg-muted text-text-secondary'}
                `}>
                  <Icon name={achievement?.icon} size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className={`
                      text-body-base font-medium
                      ${achievement?.earned ? 'text-text-primary' : 'text-text-secondary'}
                    `}>
                      {achievement?.title}
                    </h4>
                    {achievement?.earned && (
                      <Icon name="Check" size={16} className="text-success" />
                    )}
                  </div>

                  <p className="text-body-sm text-text-secondary mb-2">
                    {achievement?.description}
                  </p>

                  {achievement?.earned && achievement?.earnedDate && (
                    <p className="text-body-xs text-success font-medium">
                      Obtenido el {achievement?.earnedDate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountStatistics;
