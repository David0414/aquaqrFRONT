// src/hooks/usePwaInstallPrompt.js
import { useEffect, useState } from "react";

const DISMISS_KEY = "aquaqr_pwa_banner_dismissed_until";
const DISMISS_DAYS = 7;

export function usePwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ¿App ya instalada (modo standalone)?
    const checkStandalone = () => {
      const standalone =
        window.matchMedia?.("(display-mode: standalone)")?.matches ||
        window.navigator.standalone === true;
      setIsStandalone(standalone);
    };

    checkStandalone();

    const ua = window.navigator.userAgent || "";
    setIsIos(/iphone|ipad|ipod/i.test(ua));

    // Respetar si el usuario ya lo cerró recientemente
    const dismissedUntil = parseInt(
      window.localStorage.getItem(DISMISS_KEY) || "0",
      10
    );
    const now = Date.now();
    if (dismissedUntil && dismissedUntil > now) {
      setShouldShow(false);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Android: interceptamos el evento nativo
      e.preventDefault();
      setDeferredPrompt(e);

      // Solo mostramos si NO está ya instalada
      if (!isStandalone) {
        setShouldShow(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Para iOS: no hay beforeinstallprompt, mostramos banner genérico
    if (!isStandalone && /iphone|ipad|ipod/i.test(ua)) {
      setShouldShow(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hideForSomeDays = () => {
    if (typeof window === "undefined") return;
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    window.localStorage.setItem(DISMISS_KEY, String(until));
    setShouldShow(false);
  };

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (choice.outcome === "accepted") {
      // Si la acepta, no volvemos a mostrar
      hideForSomeDays();
      return true;
    }

    // Si la rechaza, ocultamos por unos días
    hideForSomeDays();
    return false;
  };

  return {
    isStandalone,
    isIos,
    shouldShow,
    promptInstall,
    hideForSomeDays,
  };
}
