let pendingSdk;
export function loadClipSdk() {
  if (window.ClipSDK) return Promise.resolve(window.ClipSDK);
  if (pendingSdk) return pendingSdk;
  pendingSdk = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.clip.mx/js/clip-sdk.js';
    script.async = true;
    const timeout = setTimeout(() => failed(), 20000);
    function failed() {
      clearTimeout(timeout); script.remove(); pendingSdk = null;
      reject(new Error('No se pudo cargar el formulario de pago. Revisa tu conexión e intenta nuevamente.'));
    }
    script.onload = () => {
      clearTimeout(timeout);
      if (window.ClipSDK) resolve(window.ClipSDK); else failed();
    };
    script.onerror = failed;
    document.head.appendChild(script);
  });
  return pendingSdk;
}
