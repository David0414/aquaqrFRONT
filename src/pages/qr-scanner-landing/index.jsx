import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import QRCodeScanner from '../../components/qr/QRCodeScanner';
import { parseMachineFromQR } from '../../lib/qr';
import MachineBusyAlert from '../water-dispensing-control/components/MachineBusyAlert';

const API = import.meta.env.VITE_API_URL;
const CLERK_JWT_TEMPLATE = 'aquaqr-api';
const scannerBlocked = (message) => Boolean(message);

const QRScannerLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const resolvingRef = useRef(false);
  const [prepareError, setPrepareError] = useState('');
  const [machineBusyError, setMachineBusyError] = useState(null);

  const reserveMachineStart = useCallback(async ({ machineId, machineLocation } = {}) => {
    const token = await getToken({ template: CLERK_JWT_TEMPLATE });
    if (!token) throw new Error('No se pudo obtener token de sesion');

    const res = await fetch(`${API}/api/dispense/demo/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'qr_inicio',
        machineId,
        machineLocation,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 423 && data?.error === 'MACHINE_BUSY') {
      const err = new Error(data?.message || 'Esta maquina esta en uso por otro usuario');
      err.code = 'MACHINE_BUSY';
      err.expiresAt = data?.expiresAt;
      err.isOwnLock = data?.isOwnLock;
      throw err;
    }
    if (!res.ok) {
      throw new Error(data?.detail || data?.message || data?.error || 'No se pudo preparar la maquina para escanear');
    }
    return data;
  }, [getToken]);

  const handleBusyOrThrow = useCallback((error) => {
    if (error?.code === 'MACHINE_BUSY') {
      setMachineBusyError(error);
      return true;
    }
    return false;
  }, []);

  const handleDetected = useCallback(async (text) => {
    if (resolvingRef.current) return;
    resolvingRef.current = true;

    try {
      const parsed = parseMachineFromQR(text);

      if (!parsed?.machineId) {
        window.showToast?.('QR invalido o sin machineId', 'error');
        return;
      }

      const redirectAfter = location?.state?.redirectAfterScan || '/water/choose';

      if (parsed.sig) {
        try {
          const qs = new URLSearchParams({
            m: parsed.machineId,
            sig: parsed.sig,
            ...(parsed.ts ? { ts: parsed.ts } : {}),
          }).toString();

          const resp = await fetch(`/api/qr/resolve?${qs}`).then((r) => r.json());
          if (!resp?.ok) {
            window.showToast?.(resp?.error || 'No se pudo validar el QR', 'error');
            return;
          }

          try {
            await reserveMachineStart({
              machineId: resp.machineId,
              machineLocation: resp.machineLocation || 'Desconocida',
            });
            setMachineBusyError(null);
          } catch (error) {
            if (handleBusyOrThrow(error)) return;
            throw error;
          }

          navigate(redirectAfter, {
            state: {
              machineId: resp.machineId,
              machineLocation: resp.machineLocation || 'Desconocida',
              fromScanner: true,
              fromQR: true,
              qrInicioSent: true,
              qrInicioSentAt: Date.now(),
            },
            replace: true,
          });
          return;
        } catch {
          window.showToast?.('Error de red al validar QR', 'error');
          return;
        }
      }

      try {
        await reserveMachineStart({
          machineId: parsed.machineId,
          machineLocation: parsed.machineLocation || 'Desconocida',
        });
        setMachineBusyError(null);
      } catch (error) {
        if (handleBusyOrThrow(error)) return;
        throw error;
      }

      navigate(redirectAfter, {
        state: {
          machineId: parsed.machineId,
          machineLocation: parsed.machineLocation || 'Desconocida',
          fromScanner: true,
          qrInicioSent: true,
          qrInicioSentAt: Date.now(),
        },
        replace: true,
      });
    } finally {
      window.setTimeout(() => {
        resolvingRef.current = false;
      }, 1200);
    }
  }, [handleBusyOrThrow, location?.state?.redirectAfterScan, navigate, reserveMachineStart]);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/home-dashboard', { replace: true })}
          className="h-10 w-10"
          aria-label="Volver"
        >
          <Icon name="ArrowLeft" size={20} />
        </Button>

        <h1 className="text-lg font-semibold text-text-primary">Escanear QR</h1>
        <div className="w-10" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-heading-sm font-semibold text-text-primary">Apunta al codigo QR</h2>
          <p className="text-text-secondary text-body-sm">
            Escanea el QR pegado en la maquina para continuar con el llenado.
            En produccion, accede por HTTPS para que la camara funcione.
          </p>
          {prepareError ? (
            <p className="text-error text-body-sm">{prepareError}</p>
          ) : null}
        </div>

        {scannerBlocked(prepareError) ? (
          <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-4 text-sm text-error">
            La maquina no esta conectada o no esta enviando datos. No se puede iniciar el flujo.
          </div>
        ) : (
          <>
            <QRCodeScanner onDetected={handleDetected} />
            <ManualImageDecoder onDetected={handleDetected} />
          </>
        )}
      </div>

      <MachineBusyAlert
        error={machineBusyError}
        onBackHome={() => navigate('/home-dashboard', { replace: true })}
      />
    </div>
  );
};

function ManualImageDecoder({ onDetected }) {
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { default: QrScanner } = await import('qr-scanner');
    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: false });
      if (result) onDetected(result);
    } catch (_err) {
      window.showToast?.('No se detecto un QR en la imagen', 'error');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-body-sm text-text-secondary">
        Problemas con la camara? Sube una imagen del QR:
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="w-full bg-card border border-border rounded-lg px-3 py-2"
      />
    </div>
  );
}

export default QRScannerLanding;
