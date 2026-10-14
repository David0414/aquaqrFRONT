import React from 'react';
import Icon from '../../components/AppIcon';
import { calibrationFromOffset } from '../../lib/calibration.mjs';
import { getTelemetryStepInfo, pulsesToLiters } from '../water-dispensing-control/telemetry';

const components = [
  { title: 'Bomba de agua', description: 'Impulsa el agua de la máquina.', icon: 'Power', state: 'pumpOn',
    on: 'bomba_on', off: 'bomba_off', onLabel: 'Encender', offLabel: 'Apagar', activeLabel: 'Encendida', inactiveLabel: 'Apagada' },
  { title: 'Válvula de llenado', description: 'Controla la salida de agua al garrafón.', icon: 'Droplets', state: 'fillValveOn',
    on: 'valvula_llenado_on', off: 'valvula_llenado_off', onLabel: 'Abrir', offLabel: 'Cerrar', activeLabel: 'Abierta', inactiveLabel: 'Cerrada' },
  { title: 'Válvula de enjuague', description: 'Controla el agua para enjuagar.', icon: 'Waves', state: 'rinseValveOn',
    on: 'valvula_enjuague_on', off: 'valvula_enjuague_off', onLabel: 'Abrir', offLabel: 'Cerrar', activeLabel: 'Abierta', inactiveLabel: 'Cerrada' },
];
export default function MachineControls({ ops }) {
  const { machine, calibration, telemetry, online, configError, offset, setOffset, busy, command, lastCommand, saveOffset } = ops;
  let preview;
  try { preview = calibration && calibrationFromOffset(offset, calibration.base); } catch { /* Invalid input has no preview. */ }
  const disabled = !calibration || Boolean(busy);
  const step = getTelemetryStepInfo(telemetry?.currentStageCode || '00');
  return <div className="m-control-layout">
    <section className="m-surface m-calibration">
      <div className="m-section-title"><span className="m-feature-icon"><Icon name="SlidersHorizontal" size={20} /></span><div><h2>Ajusta la cantidad de agua</h2><p>Desfase de {machine.name || machine.id}</p></div></div>
      <p className="m-description">Si el garrafón recibe más o menos agua, corrige aquí la cantidad. El ajuste se aplica a 5, 10 y 20 litros.</p>
      {configError ? <p className="m-notice m-error" role="alert">{configError}</p> : !calibration ? <p role="status" className="m-notice">Cargando el ajuste de esta máquina…</p> : null}
      <label className="m-field" htmlFor="machine-offset"><span>Desfase por cada 20 litros</span><div className="m-number-field"><input id="machine-offset" className="m-input" type="number" step="1" value={offset} disabled={disabled} onChange={(event) => setOffset(event.target.value)} /><span>ml</span></div></label>
      <div className="m-calibration-guide"><span><Icon name="Plus" size={15} /> Positivo: agrega agua</span><span><Icon name="Minus" size={15} /> Negativo: reduce agua</span></div>
      <div className="m-volume-preview" aria-live="polite">{[5, 10, 20].map((liters) => <div key={liters}><span>Al elegir {liters} L</span><strong>{preview ? `${Math.round(liters * 1000 * preview / calibration.base).toLocaleString('es-MX')} ml` : '—'}</strong></div>)}</div>
      <button type="button" className="m-button m-primary m-full" disabled={disabled || !preview} onClick={saveOffset}><Icon name="Save" size={17} />{busy === 'calibration' ? 'Guardando…' : 'Guardar desfase en ml'}</button>
      <p className="m-caption">Este cambio aplica únicamente a esta máquina.</p>
    </section>
    <section className="m-surface m-components">
      <div className="m-section-title"><span className="m-feature-icon"><Icon name="Settings2" size={20} /></span><div><h2>Controles de la máquina</h2><p>Cada botón controla un componente de {machine.id}.</p></div></div>
      {components.map((item) => <div className="m-component-row" key={item.state}>
        <div className="m-component-info"><Icon name={item.icon} size={21} /><div><h3>{item.title}</h3><p>{item.description}</p></div><span className={`m-state ${online ? telemetry?.[item.state] ? 'm-state-on' : 'm-state-off' : ''}`}>{online ? telemetry?.[item.state] ? item.activeLabel : item.inactiveLabel : 'Sin lectura'}</span></div>
        <div className="m-command-pair"><button className="m-button m-command-on" type="button" disabled={disabled} onClick={() => command(item.on, `${item.onLabel} ${item.title.toLowerCase()}`)}>{busy === item.on ? 'Enviando…' : item.onLabel}<Icon name="Play" size={14} /></button>
          <button className="m-button" type="button" disabled={disabled} onClick={() => command(item.off, `${item.offLabel} ${item.title.toLowerCase()}`)}>{busy === item.off ? 'Enviando…' : item.offLabel}<Icon name="Square" size={13} /></button></div>
      </div>)}
      <div className="m-safety"><div><Icon name="ShieldCheck" size={19} /><h3>Recuperar la máquina</h3></div><p>Apaga los componentes o regresa la máquina a espera.</p>
        <div className="m-command-pair"><button type="button" className="m-button m-danger-soft" disabled={disabled} onClick={() => command('apagar_valvulas_forzado', 'Apagar todo')}><Icon name="PowerOff" size={16} />{busy === 'apagar_valvulas_forzado' ? 'Enviando…' : 'Apagar todo'}</button>
          <button type="button" className="m-button" disabled={disabled} onClick={() => command('reiniciar_sistema', 'Reiniciar máquina')}><Icon name="RotateCcw" size={16} />{busy === 'reiniciar_sistema' ? 'Enviando…' : 'Reiniciar máquina'}</button></div>
      </div>
    </section>
    <section className="m-live-summary"><div><span className="m-live-dot" /><span>Estado de la máquina</span><strong>{online ? step.label : 'Esperando conexión'}</strong></div><div><span>Agua medida</span><strong>{online && calibration ? `${pulsesToLiters(telemetry.flowmeterPulses, calibration.pulsesPerLiter).toLocaleString('es-MX', { maximumFractionDigits: 2 })} L` : '—'}</strong></div><div><span>Última solicitud</span><strong>{lastCommand?.label || 'Todavía no has enviado comandos'}</strong></div></section>
    <details className="m-diagnostics"><summary>Ver diagnóstico técnico <Icon name="ChevronDown" size={16} /></summary><div><p>Trama recibida: <code>{telemetry?.rawFrame || 'Sin lectura'}</code></p><p>Respuesta: <code>{lastCommand?.response || telemetry?.error || 'Sin respuesta pendiente'}</code></p></div></details>
  </div>;
}
