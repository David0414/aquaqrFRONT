import React, { useState, useEffect, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const QRScannerInterface = ({ onScanSuccess, onScanError, isScanning, setIsScanning }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [scanningActive, setScanningActive] = useState(false);

  // Mock QR codes for testing
  const mockValidQRCodes = [
    'AQUA_MACHINE_001_LOC_PLAZA_CENTRAL',
    'AQUA_MACHINE_002_LOC_PARQUE_NORTE',
    'AQUA_MACHINE_003_LOC_CENTRO_COMERCIAL'
  ];

  useEffect(() => {
    checkCameraAvailability();
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices?.enumerateDevices();
      const videoDevices = devices?.filter(device => device?.kind === 'videoinput');
      setHasCamera(videoDevices?.length > 0);
    } catch (error) {
      console.error('Error checking camera:', error);
      setHasCamera(false);
      setCameraError('No se pudo acceder a la cámara');
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices?.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef?.current) {
        videoRef.current.srcObject = stream;
        videoRef?.current?.play();
        setScanningActive(true);
        setIsScanning(true);
        startQRDetection();
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setCameraError('No se pudo iniciar la cámara. Verifica los permisos.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (videoRef?.current && videoRef?.current?.srcObject) {
      const tracks = videoRef?.current?.srcObject?.getTracks();
      tracks?.forEach(track => track?.stop());
      videoRef.current.srcObject = null;
    }
    setScanningActive(false);
    setIsScanning(false);
  };

  const startQRDetection = () => {
    // Simulate QR code detection
    const detectionInterval = setInterval(() => {
      if (!scanningActive) {
        clearInterval(detectionInterval);
        return;
      }

      // Simulate random QR code detection
      if (Math.random() > 0.85) {
        const randomQR = mockValidQRCodes?.[Math.floor(Math.random() * mockValidQRCodes?.length)];
        clearInterval(detectionInterval);
        handleQRDetected(randomQR);
      }
    }, 1000);

    // Auto-stop after 30 seconds
    setTimeout(() => {
      if (scanningActive) {
        clearInterval(detectionInterval);
        stopCamera();
      }
    }, 30000);
  };

  const handleQRDetected = (qrData) => {
    // Simulate HMAC validation
    const isValid = mockValidQRCodes?.includes(qrData);
    
    if (isValid) {
      // Extract machine info from QR
      const parts = qrData?.split('_');
      const machineId = parts?.[2];
      const location = parts?.slice(4)?.join(' ')?.replace(/_/g, ' ');
      
      stopCamera();
      onScanSuccess({
        machineId,
        location,
        qrData,
        timestamp: new Date()?.toISOString()
      });
    } else {
      onScanError('Código QR inválido o máquina no disponible');
    }
  };

  const toggleScanning = () => {
    if (scanningActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Camera View */}
      <div className="relative aspect-square bg-surface rounded-2xl overflow-hidden border-2 border-border">
        {hasCamera && !cameraError ? (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Corner Brackets */}
                <div className="w-48 h-48 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                  
                  {/* Scanning Line */}
                  {scanningActive && (
                    <div className="absolute inset-x-0 top-1/2 h-0.5 bg-primary animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            {scanningActive && (
              <div className="absolute top-4 left-4 flex items-center space-x-2 bg-primary/90 text-primary-foreground px-3 py-2 rounded-lg">
                <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Escaneando...</span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
            <Icon name="Camera" size={48} className="text-text-secondary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Cámara no disponible
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              {cameraError || 'No se detectó ninguna cámara en este dispositivo'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={checkCameraAvailability}
              iconName="RefreshCw"
              iconPosition="left"
            >
              Reintentar
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      {hasCamera && !cameraError && (
        <div className="mt-6 flex justify-center">
          <Button
            variant={scanningActive ? "destructive" : "default"}
            size="lg"
            onClick={toggleScanning}
            iconName={scanningActive ? "Square" : "Camera"}
            iconPosition="left"
            className="px-8"
          >
            {scanningActive ? 'Detener Escaneo' : 'Iniciar Escaneo'}
          </Button>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 text-center">
        <p className="text-sm text-text-secondary">
          Apunta la cámara hacia el código QR de la máquina dispensadora
        </p>
        <p className="text-xs text-text-secondary mt-1">
          Mantén el código dentro del marco para un escaneo óptimo
        </p>
      </div>
    </div>
  );
};

export default QRScannerInterface;