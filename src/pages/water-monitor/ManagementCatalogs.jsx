import React, { useEffect, useState } from 'react';
import Icon from '../../components/AppIcon';

export function PremiumRates({ request }) {
  const [plans, setPlans] = useState(null), [busy, setBusy] = useState(false), [notice, setNotice] = useState(null);
  useEffect(() => {
    let cancelled = false;
    request('/api/monitor-admin/premium/plans').then((data) => { if (!cancelled) setPlans(data.items.map((plan) => ({ ...plan, price: (plan.monthlyPriceCents / 100).toFixed(2) }))); })
      .catch((error) => { if (!cancelled) setNotice({ error: true, text: error.message }); });
    return () => { cancelled = true; };
  }, [request]);
  const save = async (event) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setNotice(null);
    try { await request('/api/monitor-admin/premium/plans', { method: 'PUT', body: JSON.stringify({ prices: plans.map((plan) => ({ key: plan.key, monthlyPriceCents: Math.round(Number(plan.price) * 100) })) }) }); setNotice({ text: 'Tarifas guardadas. Los pagos ya realizados conservan su precio y vigencia.' }); }
    catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setBusy(false); }
  };
  return <section><div className="m-page-heading"><div><p className="m-kicker">PREMIUM PARA SOCIOS</p><h1>Tarifas por volumen</h1><p>El consumo del último mes completo determina la tarifa de cada máquina.</p></div></div>
    <div className="m-notice m-rate-explainer"><Icon name="Info" size={20} /><p>Estas tarifas aplican a todas las máquinas. Premium habilita sus estadísticas durante un mes; los controles y el desfase siguen incluidos en el acceso normal.</p></div>
    {notice && <p className={`m-notice ${notice.error ? 'm-error' : 'm-success'}`} role={notice.error ? 'alert' : 'status'}>{notice.text}</p>}
    {plans ? <form className="m-surface m-rate-table" onSubmit={save}><div className="m-rate-table-heading"><span>Segmento</span><span>Garrafones de 20 L / mes</span><span>Precio mensual</span></div>{plans.map((plan, index) => <div className="m-rate-row" key={plan.key}><strong>{plan.label}</strong><span>{index === 0 ? 0 : plans[index - 1].maxGarrafones + 1}{plan.maxGarrafones === null ? '+' : ` – ${plan.maxGarrafones}`} garrafones</span><label className="m-rate-input"><span>$</span><input className="m-input" aria-label={`Precio mensual ${plan.label}`} type="number" min="0.01" step="0.01" required disabled={busy} value={plan.price} onChange={(event) => setPlans((items) => items.map((item) => item.key === plan.key ? { ...item, price: event.target.value } : item))} /><span>MXN</span></label></div>)}<div className="m-form-actions"><span>Las membresías pagadas mantienen su vigencia.</span><button className="m-button m-primary" disabled={busy} type="submit"><Icon name="Save" size={17} />{busy ? 'Guardando…' : 'Guardar tarifas Premium'}</button></div></form> : !notice && <p role="status" className="m-empty">Cargando tarifas…</p>}
  </section>;
}

export function PromotionSettings({ promotions, request, onChanged }) {
  const [busy, setBusy] = useState(''), [error, setError] = useState('');
  const [points, setPoints] = useState('0.5');
  useEffect(() => { const value = promotions.find((promotion) => promotion.key === 'monthly_consumption_points')?.config?.pointsPerLiter; if (value != null) setPoints(String(value)); }, [promotions]);
  const update = async (key, payload) => {
    if (busy) return;
    setBusy(key); setError('');
    try { await request(`/api/monitor-admin/promotions/${encodeURIComponent(key)}`, { method: 'PUT', body: JSON.stringify(payload) }); await onChanged(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(''); }
  };
  const list = promotions.filter((promotion) => promotion.key !== 'premium_membership');
  return <section><div className="m-page-heading"><div><p className="m-kicker">BENEFICIOS PARA CLIENTES</p><h1>Promociones y recompensas</h1><p>Elige qué beneficios pueden ver y usar los clientes de la app.</p></div></div>
    {error && <p role="alert" className="m-notice m-error">{error}</p>}
    <form className="m-surface m-points-form" onSubmit={(event) => { event.preventDefault(); update('monthly_consumption_points', { config: { pointsPerLiter: Number(points) } }); }}><div className="m-section-title"><Icon name="Coins" size={23} /><div><h2>EVA Coins por consumo</h2><p>Cada 20 litros suma {(Number(points) * 20).toLocaleString('es-MX')} puntos.</p></div></div><label className="m-field"><span>Puntos por litro</span><input className="m-input" type="number" min="0" step="0.1" required value={points} onChange={(event) => setPoints(event.target.value)} disabled={Boolean(busy)} /></label><button className="m-button m-primary" disabled={Boolean(busy)} type="submit">{busy === 'monthly_consumption_points' ? 'Guardando…' : 'Guardar puntos'}</button></form>
    <div className="m-promotion-grid">{list.map((promotion) => <article className="m-surface m-promotion-card" key={promotion.key}><div><span className="m-feature-icon"><Icon name={promotion.kind === 'membership' ? 'Package' : promotion.kind === 'points' ? 'Coins' : 'Gift'} size={22} /></span><span className={`m-badge ${promotion.isActive ? 'm-green' : ''}`}>{promotion.isActive ? 'Activa' : 'Inactiva'}</span></div><h2>{promotion.title}</h2><p>{promotion.summary || promotion.description}</p><button className="m-button" disabled={Boolean(busy)} onClick={() => update(promotion.key, { isActive: !promotion.isActive })}>{busy === promotion.key ? 'Guardando…' : promotion.isActive ? 'Desactivar promoción' : 'Activar promoción'}</button></article>)}</div>
  </section>;
}

export function MachineQr({ machine, request }) {
  const [qr, setQr] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const controller = React.useRef(null);
  useEffect(() => { setQr(null); setError(''); return () => controller.current?.abort(); }, [machine.id]);
  const generate = async () => {
    if (busy) return;
    controller.current = new AbortController(); setBusy(true); setError('');
    try { const data = await request(`/api/monitor-admin/machines/${encodeURIComponent(machine.id)}/qr`, { signal: controller.current.signal }); if (!controller.current.signal.aborted) setQr(data); }
    catch (failure) { if (!controller.current.signal.aborted) setError(failure.message); }
    finally { if (!controller.current.signal.aborted) setBusy(false); }
  };
  return <section className="m-surface m-qr"><div><p className="m-kicker">EL ACCESO DE TUS CLIENTES</p><h2>Código QR de {machine.name || machine.id}</h2><p className="m-description">Coloca este código en la máquina para que tus clientes puedan escanearla y dispensar agua.</p><p className="m-caption">Cada máquina tiene su propio código. Este corresponde a {machine.id}.</p><button className="m-button m-primary" onClick={generate} disabled={busy || machine.detectedOnly || !machine.isActive}><Icon name="QrCode" size={18} />{busy ? 'Generando…' : qr ? 'Actualizar código QR' : 'Generar código QR'}</button>{qr && <a className="m-button" href={qr.qrPngDataUrl} download={`QR-${machine.id}.png`}><Icon name="Download" size={17} />Descargar QR</a>}{error && <p role="alert" className="m-notice m-error">{error}</p>}{(machine.detectedOnly || !machine.isActive) && <p className="m-notice">Registra y habilita esta máquina para generar su código.</p>}</div><div className="m-qr-frame">{qr ? <img src={qr.qrPngDataUrl} alt={`Código QR de ${qr.machineId}`} /> : <div><Icon name="ScanLine" size={78} /><span>QR de {machine.id}</span></div>}</div></section>;
}
