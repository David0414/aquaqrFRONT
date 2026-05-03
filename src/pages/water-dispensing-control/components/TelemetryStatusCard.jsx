import React from 'react';
import { formatMoneyAmount, getTelemetryStepInfo } from '../telemetry';

function StatusDot({ active, activeClassName, inactiveClassName }) {
  return (
    <span
      className={`h-4 w-4 rounded-full border ${active ? activeClassName : inactiveClassName}`}
      aria-hidden="true"
    />
  );
}

function MetricItem({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

export default function TelemetryStatusCard({
  telemetry,
  title = 'Estado',
  compact = false,
  showCoinMetrics = false,
  showStageMetric = false,
  showFlowmeterMetric = false,
}) {
  const stepInfo = getTelemetryStepInfo(telemetry.currentStageCode);
  const wrapperClassName = compact
    ? 'space-y-3 rounded-2xl border border-border bg-card p-4'
    : 'space-y-4 rounded-2xl border border-border bg-card p-4';

  const metrics = [];

  if (showStageMetric) {
    metrics.push({
      label: 'Paso',
      value: stepInfo.code ? `${stepInfo.code} · ${stepInfo.label || 'Sin etapa'}` : (stepInfo.label || 'Sin etapa'),
    });
  }

  if (showFlowmeterMetric) {
    metrics.push({
      label: 'Pulsos',
      value: `${telemetry.flowmeterPulses ?? 0}`,
    });
  }

  if (showCoinMetrics) {
    metrics.push(
      {
        label: 'Moneda',
        value: telemetry.insertedCoinLabel || 'Sin moneda',
      },
      {
        label: 'Acumulado',
        value: formatMoneyAmount(telemetry.accumulatedMoney),
      },
    );
  }

  return (
    <div className={wrapperClassName}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary">
            {stepInfo.code || '--'} · {stepInfo.label || 'Sin etapa'}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
          <div>
            <p className="text-sm font-medium text-text-primary">Bomba</p>
            <p className="text-xs text-text-secondary">{telemetry.pumpOn ? 'On' : 'Off'}</p>
          </div>
          <StatusDot
            active={telemetry.pumpOn}
            activeClassName="border-green-600 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.45)]"
            inactiveClassName="border-slate-300 bg-slate-300"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
          <div>
            <p className="text-sm font-medium text-text-primary">Llenado</p>
            <p className="text-xs text-text-secondary">{telemetry.fillValveOn ? 'On' : 'Off'}</p>
          </div>
          <StatusDot
            active={telemetry.fillValveOn}
            activeClassName="border-sky-600 bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.45)]"
            inactiveClassName="border-slate-300 bg-slate-300"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2">
          <div>
            <p className="text-sm font-medium text-text-primary">Enjuague</p>
            <p className="text-xs text-text-secondary">{telemetry.rinseValveOn ? 'On' : 'Off'}</p>
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
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
