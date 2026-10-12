// src/components/qr/QRCodeScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import Icon from '../../components/AppIcon';

export default function QRCodeScanner({ onDetected, className = '' }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    let mounted = true;
    let stream;
    let scanner;

    async function init() {
      try {
        setIsStarting(true);
        const mobile = /Android|iPhone|iPad/i.test(navigator.userAgent) || window.matchMedia('(pointer: coarse)').matches;
        stream = await navigator.mediaDevices.getUserMedia({ audio: false,
          video: { facingMode: mobile ? { exact: 'environment' } : { ideal: 'environment' } } });
        if (!mounted) { stream.getTracks().forEach((track) => track.stop()); return; }
        videoRef.current.srcObject = stream;

        // Instancia del scanner
        scanner = new QrScanner(
          videoRef.current,
          (result) => {
            const data = typeof result === 'string' ? result : result?.data;
            if (data) onDetected?.(data);
          },
          {
            preferredCamera: 'environment',
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: true,
            maxScansPerSecond: 12,
          }
        );

        // Arranca
        scannerRef.current = scanner;
        await scanner.start();
        // Torch?
        try {
          const hasTorch = await scanner.hasFlash();
          if (mounted) setTorchAvailable(!!hasTorch);
        } catch (_) {
          if (mounted) setTorchAvailable(false);
        }
        if (mounted) setError('');
      } catch (e) {
        stream?.getTracks().forEach((track) => track.stop());
        if (mounted) setError(e.name === 'OverconstrainedError' ? 'No se encontró una cámara trasera disponible.' : 'No se pudo iniciar la cámara. Revisa los permisos.');
      } finally {
        if (mounted) setIsStarting(false);
      }
    }

    init();
    return () => {
      mounted = false;
      try {
        scanner?.stop();
        scanner?.destroy();
        stream?.getTracks().forEach((track) => track.stop());
      } catch (_) {}
    };
  }, [onDetected]);

  // Torch
  const toggleTorch = async () => {
    try {
      const next = !torchOn;
      await scannerRef.current?.toggleFlash();
      setTorchOn(next);
    } catch (_) {/* ignore */}
  };

  return (
    <div className={`${className}`}>
      <div className="rounded-2xl overflow-hidden border border-border bg-black relative">
        <video ref={videoRef} className="w-full aspect-[3/4] object-cover" muted playsInline />

        {/* marco visual */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-3/4 h-3/4 max-w-sm border-2 border-white/70 rounded-xl"></div>
        </div>

        {/* controles */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <div className="bg-black/50 text-white rounded-lg px-3 py-1 text-xs">
            {isStarting ? 'Iniciando cámara…' : (error ? 'Permisos/Cámara no disponible' : 'Apunta al QR')}
          </div>

          <div className="flex items-center gap-2">
            {torchAvailable && (
              <button
                onClick={toggleTorch}
                className="bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1 text-xs"
                aria-label="Linterna"
              >
                {torchOn ? 'Linterna: ON' : 'Linterna: OFF'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* mensaje de error */}
      {error && (
        <p className="mt-2 text-error text-body-sm">{error}</p>
      )}
    </div>
  );
}
