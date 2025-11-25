// src/components/PwaInstallBanner.jsx
import React, { useState } from "react";
import { usePwaInstallPrompt } from "../hooks/usePwaInstallPrompt";
import Icon from "./AppIcon";
import Button from "./ui/Button";

const PwaInstallBanner = () => {
  const {
    isStandalone,
    isIos,
    shouldShow,
    promptInstall,
    hideForSomeDays,
  } = usePwaInstallPrompt();

  const [isOpeningHelp, setIsOpeningHelp] = useState(false);

  if (isStandalone || !shouldShow) return null;

  const handleInstallClick = async () => {
    if (isIos) {
      // En iOS no hay prompt automático -> mostramos ayuda
      setIsOpeningHelp(true);
      return;
    }

    const ok = await promptInstall();
    if (!ok) {
      // Si rechazó, ya lo manejamos en el hook
    }
  };

  const handleClose = () => {
    hideForSomeDays();
  };

  return (
    <>
      {/* Banner fijo abajo */}
      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:pb-6 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-card border border-border shadow-soft-xl rounded-2xl p-4 flex items-start space-x-3">
            <div className="mt-1 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon name="Smartphone" size={18} className="text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-semibold text-text-primary">
                Instala AquaQR en tu pantalla de inicio
              </p>
              <p className="text-body-xs text-text-secondary mt-1">
                Úsala como una app: acceso rápido, experiencia a pantalla
                completa y sin tener que abrir el navegador.
              </p>

              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleInstallClick}
                >
                  {isIos ? "Ver cómo instalar" : "Agregar a pantalla de inicio"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={handleClose}
                >
                  Ahora no
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini modal de ayuda para iOS */}
      {isIos && isOpeningHelp && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-card rounded-2xl border border-border max-w-md w-full p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-heading-sm font-semibold text-text-primary">
                Instalar en iPhone
              </h3>
              <button
                onClick={() => setIsOpeningHelp(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <ol className="list-decimal list-inside text-body-sm text-text-secondary space-y-2">
              <li>Abre AquaQR en Safari.</li>
              <li>
                Toca el botón <strong>Compartir</strong> (icono de cuadrado con
                flecha hacia arriba).
              </li>
              <li>
                Desplázate hacia abajo y elige{" "}
                <strong>“Agregar a pantalla de inicio”</strong>.
              </li>
              <li>Confirma y listo: tendrás AquaQR como una app.</li>
            </ol>

            <div className="mt-4 flex justify-end space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpeningHelp(false)}
              >
                Cerrar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setIsOpeningHelp(false);
                  hideForSomeDays();
                }}
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PwaInstallBanner;
