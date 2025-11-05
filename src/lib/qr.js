// src/lib/qr.js
function normalizeQrPayload(payload) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;

  // Algunos scanners entregan objeto:
  // qr-scanner => { data: '...' }
  // zxing => { text: '...' } o { rawValue: '...' }
  // otros => { decodedText: '...' }
  if (typeof payload === 'object') {
    return (
      payload.data ||
      payload.text ||
      payload.rawValue ||
      payload.decodedText ||
      (Array.isArray(payload) && payload[0] && (payload[0].rawValue || payload[0].text)) ||
      ''
    );
  }
  return String(payload);
}

export function parseMachineFromQR(input) {
  const raw = String(normalizeQrPayload(input) || '').trim();
  if (!raw) return { machineId: null };

  // 1) Si parece URL, intenta parseo absoluto o relativo
  const looksLikeUrl = /^(https?:\/\/|www\.|\/|\?)/i.test(raw);
  if (looksLikeUrl) {
    try {
      const url = raw.startsWith('http') ? new URL(raw) : new URL(raw, window.location.origin);
      const m = url.searchParams.get('m') || url.searchParams.get('machineId');
      const ts = url.searchParams.get('ts') || undefined;
      const sig = url.searchParams.get('sig') || undefined;
      return { machineId: m || null, ts, sig, rawUrl: url.href };
    } catch {
      // sigue abajo al plan B
    }
  }

  // 2) Si vino como querystring suelto: "m=XX&sig=YY"
  if (raw.includes('=') && raw.includes('&')) {
    try {
      const qs = new URLSearchParams(raw);
      const m = qs.get('m') || qs.get('machineId');
      const ts = qs.get('ts') || undefined;
      const sig = qs.get('sig') || undefined;
      if (m) return { machineId: m, ts, sig, rawUrl: `?${qs.toString()}` };
    } catch {}
  }

  // 3) Si no, trátalo como machineId plano
  return { machineId: raw };
}
