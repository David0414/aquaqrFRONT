import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";

const QRScannerLanding = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-10 w-10"
        >
          <Icon name="ArrowLeft" size={20} />
        </Button>

        <h1 className="text-lg font-semibold text-text-primary">
          Escanear QR
        </h1>

        <div className="w-10" />
      </div>

      {/* Body */}
      <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-6">
        <div className="w-48 h-48 mx-auto rounded-xl bg-muted flex items-center justify-center">
          <Icon name="QrCode" size={72} className="text-text-secondary" />
        </div>

        <p className="text-text-secondary">
          Apunta la cámara al código QR de la máquina para comenzar.
        </p>

        <div className="space-y-3">
          <Button
            fullWidth
            onClick={() => navigate("/water/choose")}
            className="justify-center"
          >
            <Icon name="ArrowRight" size={18} />
            <span className="ml-2">Continuar</span>
          </Button>

          {/* Botón demo opcional para simular lectura del QR */}
          <Button
            variant="outline"
            fullWidth
            onClick={() => navigate("/water/position-down")}
            className="justify-center"
          >
            <Icon name="Play" size={18} />
            <span className="ml-2">Simular QR leído</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerLanding;
