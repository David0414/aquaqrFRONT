import React, { useState } from 'react';

export default function MachineModel({ machine, online = false, interactive = false, compact = false }) {
  const [front, setFront] = useState(false);
  return <div className={`machine-scene ${compact ? 'machine-scene-compact' : ''} ${front ? 'is-front' : ''}`}>
    <div className="machine-scene-ground" aria-hidden="true" />
    <div className="machine-cabinet" role="img" aria-label={`Vista tridimensional de la máquina ${machine.id}`}>
      <div className="machine-side" aria-hidden="true"><span>AGUA / 24</span><i /><i /><i /></div>
      <div className="machine-top" aria-hidden="true" />
      <div className="machine-front" aria-hidden="true">
        <div className="machine-brand">AGUA<span>/24</span><small>Siempre pura.</small></div>
        <div className={`machine-display ${online ? 'is-online' : ''}`}><i />{online ? 'LISTA PARA TI' : 'AGUA PURIFICADA'}</div>
        <div className="machine-window"><div className="machine-nozzle" /><div className="machine-jug"><i /><span>20 L</span></div><div className="machine-tray" /></div>
        <div className="machine-face-bottom"><div className="machine-mini-qr"><i /><i /><i /><i /></div><span>{machine.id}</span><div className="machine-coin-slot" /></div>
      </div>
    </div>
    {interactive && <button type="button" className="machine-rotate" onClick={() => setFront((value) => !value)} aria-label="Cambiar vista de la máquina">{front ? 'Ver en 3D' : 'Ver de frente'} <span aria-hidden="true">↻</span></button>}
  </div>;
}
