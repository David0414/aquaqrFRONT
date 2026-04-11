import React from 'react';
import { formatMoneyAmount } from '../telemetry';

function StatusDot({ active, activeClassName, inactiveClassName }) {
  return (
    <span
      className={`h-4 w-4 rounded-full border ${active ? activeClassName : inactiveClassName}`}
      aria-hidden="true"
    />
  );
}

function MetricItem({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-text-secondary">{hint}</p> : null}
    </div>
  );
}

export default function TelemetryStatusCard({
  telemetry,
  title = 'Estado actual',
  compact = false,
  showCoinMetrics = false,
  showStageMetric = false,
  showFlowmeterMetric = false,
}) {
  const wrapperClassName = compact
    ? 'space-y-3 rounded-2xl border border-border bg-card p-4'
    : 'space-y-4 rounded-2xl border border-border bg-card p-4';

  const metrics = [];

  if (showStageMetric) {
    metrics.push({
      label: 'Paso actual',
      value: telemetry.currentStageLabel || 'Sin etapa',
      hint: `Byte ${telemetry.currentStageCode || '--'}`,
    });
  }

  if (showFlowmeterMetric) {
    metrics.push({
      label: 'Caudalimetro',
      value: `${telemetry.flowmeterPulses ?? 0} pulsos`,
      hint: `Hex ${telemetry.flowmeterHex || '--'}`,
    });
  }

  if (showCoinMetrics) {
    metrics.push(
      {
        label: 'Moneda insertada',
        value: telemetry.insertedCoinLabel || 'Sin moneda',
        hint: `Hex ${telemetry.coinHex || '--'}`,
      },
      {
        label: 'Dinero acumulado',
        value: formatMoneyAmount(telemetry.accumulatedMoney),
        hint: `Hex ${telemetry.accumulatedMoneyHex || '--'}`,
      },
    );
  }

  return (
    <div className={wrapperClassName}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary">
            Paso {telemetry.currentStageCode || '--'}: {telemetry.currentStageLabel || 'Sin etapa'}
          </p>
        </div>
        <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-text-secondary">
          Monitor en vivo
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
          <div>
            <p className="text-sm font-medium text-text-primary">Bomba</p>
            <p className="text-xs text-text-secondary">{telemetry.pumpOn ? 'Encendida' : 'Apagada'}</p>
          </div>
          <StatusDot
            active={telemetry.pumpOn}
            activeClassName="border-green-600 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.45)]"
            inactiveClassName="border-slate-300 bg-slate-300"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
          <div>
            <p className="text-sm font-medium text-text-primary">Valvula de llenado</p>
            <p className="text-xs text-text-secondary">{telemetry.fillValveOn ? 'Encendida' : 'Apagada'}</p>
          </div>
          <StatusDot
            active={telemetry.fillValveOn}
            activeClassName="border-sky-600 bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.45)]"
            inactiveClassName="border-slate-300 bg-slate-300"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
          <div>
            <p className="text-sm font-medium text-text-primary">Valvula de enjuague</p>
            <p className="text-xs text-text-secondary">{telemetry.rinseValveOn ? 'Encendida' : 'Apagada'}</p>
          </div>
          <StatusDot
            active={telemetry.rinseValveOn}
            activeClassName="border-amber-600 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.45)]"
            inactiveClassName="border-slate-300 bg-slate-300"
          />
        </div>
      </div>

      {metrics.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricItem
              key={metric.label}
              label={metric.label}
              value={metric.value}
              hint={metric.hint}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
