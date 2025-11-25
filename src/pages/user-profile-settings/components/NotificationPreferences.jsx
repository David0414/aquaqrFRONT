// src/pages/user-profile-settings/components/NotificationPreferences.jsx
import React, { useEffect, useState } from "react";
import Icon from "../../../components/AppIcon";
import { Checkbox } from "../../../components/ui/Checkbox";
import Button from "../../../components/ui/Button";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../../../lib/api";

const NotificationPreferences = ({ user }) => {
  const [preferences, setPreferences] = useState({
    transactionConfirmations: true,
    promotionalOffers: true,
    securityAlerts: true,
    maintenanceNotices: false,
    emailNotifications: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const userEmail = user?.email || "";

  // -------- helpers de estado global ----------
  const hasAnyTypeEnabled =
    preferences.transactionConfirmations ||
    preferences.securityAlerts ||
    preferences.promotionalOffers ||
    preferences.maintenanceNotices;

  const notificationsEnabled =
    preferences.emailNotifications && hasAnyTypeEnabled;

  // 1) Cargar preferencias desde el backend
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await getNotificationPreferences();
        if (!cancelled && data?.preferences) {
          setPreferences((prev) => ({
            ...prev,
            ...data.preferences,
          }));
        }
      } catch (err) {
        console.error("Error cargando preferencias de notificación", err);
        window.showToast?.(
          "No se pudieron cargar tus preferencias",
          "error"
        );
      } finally {
        if (!cancelled) setInitialLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePreferenceChange = (key, value) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  // 2) Guardar preferencias
  const handleSavePreferences = async () => {
    try {
      setIsLoading(true);
      await updateNotificationPreferences(preferences);
      window.showToast?.(
        "Preferencias de notificación actualizadas",
        "success"
      );
    } catch (err) {
      console.error("Error guardando preferencias", err);
      window.showToast?.(
        "No se pudieron guardar tus preferencias",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const notificationTypes = [
    {
      key: "transactionConfirmations",
      title: "Confirmaciones de transacción",
      description:
        "Recibe correos cuando completes una recarga o un dispensado de agua",
      icon: "Receipt",
      color: "text-primary",
    },
    {
      key: "securityAlerts",
      title: "Alertas de seguridad",
      description: "Notificaciones críticas de seguridad de tu cuenta",
      icon: "Shield",
      color: "text-error",
    },
    {
      key: "promotionalOffers",
      title: "Ofertas y promociones",
      description: "Descuentos y novedades relevantes de AquaQR",
      icon: "Tag",
      color: "text-warning",
    },
    {
      key: "maintenanceNotices",
      title: "Avisos de mantenimiento",
      description: "Información de mantenimiento de dispensadores",
      icon: "Settings",
      color: "text-secondary",
    },
  ];

  if (initialLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 mb-6">
        <p className="text-body-sm text-text-secondary">
          Cargando tus preferencias…
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
            <Icon name="Bell" size={20} className="text-warning" />
          </div>
          <div>
            <h2 className="text-heading-base font-semibold text-text-primary">
              Preferencias de Notificación
            </h2>
            <p className="text-body-sm text-text-secondary">
              Elige qué correos quieres recibir sobre tu cuenta AquaQR.
            </p>
            {userEmail && (
              <p className="text-body-xs text-text-secondary mt-1">
                Se enviarán a:{" "}
                <span className="font-medium">{userEmail}</span>. Puedes
                actualizar este correo en la sección <b>“Personal”</b>.
              </p>
            )}
          </div>
        </div>

        <span
          className={`
            inline-flex items-center px-3 py-1 rounded-full text-body-xs font-medium
            border
            ${
              notificationsEnabled
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-muted border-border text-text-secondary"
            }
          `}
        >
          <span className="mr-1">
            <Icon
              name={notificationsEnabled ? "CheckCircle" : "BellOff"}
              size={14}
            />
          </span>
          {notificationsEnabled ? "Notificaciones activas" : "Notificaciones desactivadas"}
        </span>
      </div>

      {/* Toggle global de correo */}
      <div className="mb-6 p-4 rounded-xl bg-muted/40 flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon name="Mail" size={16} className="text-primary" />
          </div>
          <div>
            <h3 className="text-body-base font-medium text-text-primary">
              Correos electrónicos
            </h3>
            <p className="text-body-sm text-text-secondary mt-1">
              Activa o desactiva el envío de correos de AquaQR. Si lo desactivas,
              no recibirás ninguna notificación por email.
            </p>
          </div>
        </div>
        <Checkbox
          checked={preferences.emailNotifications}
          onChange={(e) =>
            handlePreferenceChange("emailNotifications", e?.target?.checked)
          }
          className="ml-4 mt-1"
        />
      </div>

      {/* Tipos de notificación */}
      <div className="space-y-4 mb-6">
        <h3 className="text-body-base font-medium text-text-primary mb-2">
          Tipos de notificación
        </h3>
        {notificationTypes.map((type) => (
          <div
            key={type.key}
            className="flex items-start space-x-4 p-4 rounded-xl hover:bg-muted/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 flex-shrink-0 mt-1">
              <Icon name={type.icon} size={16} className={type.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-body-base font-medium text-text-primary">
                    {type.title}
                  </h4>
                  <p className="text-body-sm text-text-secondary mt-1">
                    {type.description}
                  </p>
                </div>
                <Checkbox
                  checked={preferences[type.key]}
                  onChange={(e) =>
                    handlePreferenceChange(type.key, e?.target?.checked)
                  }
                  className="ml-4"
                  disabled={!preferences.emailNotifications}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Guardar */}
      <div className="border-t border-border pt-6">
        <Button
          variant="default"
          loading={isLoading}
          onClick={handleSavePreferences}
          iconName="Check"
          iconPosition="left"
          fullWidth
        >
          Guardar Preferencias
        </Button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
