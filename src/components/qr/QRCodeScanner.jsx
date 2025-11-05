// src/components/qr/QRCodeScanner.jsx
import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import Icon from '../../components/AppIcon';

export default function QRCodeScanner({ onDetected, className = '' }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [currentDeviceId, setCurrentDeviceId] = useState(null);
  const [error, setError] = useState('');
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        setIsStarting(true);
        // Lista de cámaras
        const cams = await QrScanner.listCameras(true);
        if (!mounted) return;

        setDevices(cams);
        const preferred = cams.find(c => /back|trás|rear|environment/i.test(`${c.label}`));
        const deviceId = preferred?.id || cams[0]?.id || null;
        setCurrentDeviceId(deviceId);

        // Instancia del scanner
        scannerRef.current = new QrScanner(
          videoRef.current,
          (result) => {
            if (!result?.data) return;
            onDetected?.(result.data);
          },
          {
            preferredCamera: deviceId || 'environment',
            highlightScanRegion: true,
            highlightCodeOutline: true,
            returnDetailedScanResult: false,
            maxScansPerSecond: 12,
          }
        );

        // Arranca
        await scannerRef.current.start();
        // Torch?
        try {
          const hasTorch = await scannerRef.current.hasFlash();
          if (mounted) setTorchAvailable(!!hasTorch);
        } catch (_) {
          if (mounted) setTorchAvailable(false);
        }
        setError('');
      } catch (e) {
        setError('No se pudo iniciar la cámara. Revisa permisos o usa HTTPS.');
      } finally {
        if (mounted) setIsStarting(false);
      }
    }

    init();
    return () => {
      mounted = false;
      try {
        scannerRef.current?.stop();
        scannerRef.current?.destroy();
      } catch (_) {}
    };
  }, [onDetected]);

  // Cambiar cámara
  const handleChangeDevice = async (e) => {
    const id = e.target.value || null;
    setCurrentDeviceId(id);
    try {
      await scannerRef.current?.setCamera(id || 'environment');
    } catch (e2) {
      setError('No se pudo cambiar la cámara');
    }
  };

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

      {/* selector de cámara (si hay varias) */}
      {devices.length > 1 && (
        <div className="mt-3">
          <label className="text-body-sm text-text-secondary block mb-1">Cámara</label>
          <select
            value={currentDeviceId || ''}
            onChange={handleChangeDevice}
            className="w-full bg-card border border-border rounded-lg px-3 py-2"
          >
            {devices.map(d => (
              <option key={d.id} value={d.id}>{d.label || d.id}</option>
            ))}
          </select>
        </div>
      )}

      {/* mensaje de error */}
      {error && (
        <p className="mt-2 text-error text-body-sm">{error}</p>
      )}
    </div>
  );
}
