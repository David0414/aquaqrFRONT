// src/lib/qr.js
export function parseMachineFromQR(text) {
  try {
    const u = new URL(text);
    const m = u.searchParams.get('m') || u.searchParams.get('machineId');
    const ts = u.searchParams.get('ts') || undefined;
    const sig = u.searchParams.get('sig') || undefined;
    return { machineId: m || null, ts, sig, rawUrl: u.href };
  } catch {
    // Texto plano (p.ej. "AQ-001")
    const s = String(text || '').trim();
    return { machineId: s || null };
  }
}
