// src/hooks/usePwaInstallPrompt.js
import { useEffect, useState } from "react";

const STORAGE_KEY = "aquaqr_pwa_dismissed";

export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ¿La PWA ya está instalada?
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.navigator.standalone === true;

    setIsStandalone(!!standalone);

    // ¿Es iOS?
    const ios = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    setIsIos(ios);

    // ¿El usuario ya cerró el banner alguna vez?
    const dismissed = localStorage.getItem(STORAGE_KEY) === "1";

    if (standalone || dismissed) {
      setShouldShow(false);
      return;
    }

    function handleBeforeInstallPrompt(e) {
      // Evitamos el prompt nativo automático
      e.preventDefault();
      setDeferredPrompt(e);
      setShouldShow(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // En iOS no hay beforeinstallprompt, así que mostramos el banner directamente
    if (ios && !dismissed) {
      setShouldShow(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  // Lanza el prompt nativo (Android / desktop)
  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      // Instaló la PWA -> no volvemos a mostrar el banner
      localStorage.setItem(STORAGE_KEY, "1");
      setShouldShow(false);
      return true;
    }

    // Si rechaza, seguimos mostrando el banner (hasta que pulse "Ahora no")
    return false;
  };

  // Oculta el banner “para siempre” (hasta que borren datos del navegador)
  const hideForSomeDays = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShouldShow(false);
  };

  return { isStandalone, isIos, shouldShow, promptInstall, hideForSomeDays };
}
