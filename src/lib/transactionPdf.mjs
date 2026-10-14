const money = (value, currency = 'MXN') => {
  const amount = Number(value || 0);
  try { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: currency || 'MXN' }).format(amount); }
  catch { return `$${amount.toFixed(2)} MXN`; }
};

const dateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? 'Fecha no disponible' : date.toLocaleString('es-MX');
};

const typeLabel = (type) => ({ recharge: 'Recarga de saldo', dispensing: 'Dispensado de agua', membership: 'Compra de membresia' }[type] || 'Transaccion');
const statusLabel = (status) => ({ completed: 'Completada', succeeded: 'Completada', pending: 'Pendiente', failed: 'Fallida', cancelled: 'Cancelada', canceled: 'Cancelada' }[String(status || '').toLowerCase()] || 'Registrada');

function printable(value) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
}

function wrap(value, max = 92) {
  const words = printable(value).split(' ').filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (word.length > max) {
      if (line) lines.push(line);
      line = '';
      for (let index = 0; index < word.length; index += max) lines.push(word.slice(index, index + max));
    } else if (!line) line = word;
    else if (`${line} ${word}`.length <= max) line += ` ${word}`;
    else { lines.push(line); line = word; }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

const hexText = (value) => Array.from(printable(value), (character) => character.charCodeAt(0).toString(16).padStart(2, '0')).join('').toUpperCase();

function createPdf({ title, subtitle, lines }) {
  const pageSize = 48;
  const pages = [];
  for (let index = 0; index < lines.length || index === 0; index += pageSize) pages.push(lines.slice(index, index + pageSize));
  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

  const pageIds = pages.map((_, index) => 5 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  pages.forEach((pageLines, pageIndex) => {
    const pageId = pageIds[pageIndex], streamId = pageId + 1;
    let content = `BT /F2 18 Tf 48 754 Td <${hexText(title)}> Tj ET\n`;
    content += `BT /F1 9 Tf 48 735 Td <${hexText(subtitle)}> Tj ET\n`;
    content += '0.04 0.45 0.50 RG 48 722 m 564 722 l S\n';
    pageLines.forEach((line, lineIndex) => {
      const y = 704 - lineIndex * 13;
      content += `BT /F1 9 Tf 48 ${y} Td <${hexText(line)}> Tj ET\n`;
    });
    content += `BT /F1 8 Tf 500 32 Td <${hexText(`Pagina ${pageIndex + 1} de ${pages.length}`)}> Tj ET\n`;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`;
    objects[streamId] = `<< /Length ${content.length} >>\nstream\n${content}endstream`;
  });

  let document = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = document.length;
    document += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = document.length;
  document += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) document += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  document += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return document;
}

function downloadPdf(fileName, title, subtitle, lines) {
  const blob = new Blob([createPdf({ title, subtitle, lines: lines.flatMap((line) => wrap(line)) })], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${printable(fileName).replace(/[^a-zA-Z0-9_-]+/g, '-') || 'AquaQR'}.pdf`;
  link.rel = 'noopener';
  link.style.position = 'fixed';
  link.style.left = '-10000px';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function transactionLines(transaction) {
  const type = String(transaction?.type || '').toLowerCase();
  const currency = transaction?.currency || 'MXN';
  const amount = Math.abs(Number(transaction?.amount || 0));
  const lines = [
    `Tipo: ${typeLabel(type)}`,
    `Estado: ${statusLabel(transaction?.status)}`,
    `Fecha: ${dateTime(transaction?.date)}`,
    `Monto: ${money(amount, currency)}`,
  ];
  if (Number(transaction?.bonusAmount) > 0) lines.push(`Bono aplicado: ${money(transaction.bonusAmount, currency)}`);
  if (Number(transaction?.totalReceivedAmount) > 0) lines.push(`Total recibido en saldo: ${money(transaction.totalReceivedAmount, currency)}`);
  if (transaction?.paymentMethod) lines.push(`Metodo de pago: ${transaction.paymentMethod}`);
  if (transaction?.machineId) lines.push(`Maquina: ${transaction.machineId}`);
  if (transaction?.machineLocation) lines.push(`Ubicacion: ${transaction.machineLocation}`);
  if (transaction?.liters != null) lines.push(`Litros: ${transaction.liters} L`);
  if (Number(transaction?.membershipCoveredLiters) > 0) lines.push(`Cubierto por membresia: ${transaction.membershipCoveredLiters} L`);
  if (transaction?.balanceBefore != null) lines.push(`Saldo anterior: ${money(transaction.balanceBefore, currency)}`);
  if (transaction?.balanceAfter != null) lines.push(`Saldo posterior: ${money(transaction.balanceAfter, currency)}`);
  if (transaction?.id) lines.push(`ID de transaccion: ${transaction.id}`);
  if (transaction?.providerPaymentId) lines.push(`Referencia de pago: ${transaction.providerPaymentId}`);
  if (transaction?.description) lines.push(`Descripcion: ${transaction.description}`);
  return lines;
}

export function downloadTransactionReceiptPdf(transaction) {
  const id = transaction?.id || Date.now();
  downloadPdf(`AquaQR-Recibo-${id}`, 'Comprobante de transaccion', typeLabel(transaction?.type), transactionLines(transaction));
}

export function downloadTransactionHistoryPdf(transactions = []) {
  const lines = [`Transacciones incluidas: ${transactions.length}`, `Generado: ${dateTime(new Date())}`, ''];
  transactions.forEach((transaction, index) => {
    lines.push(`${index + 1}. ${dateTime(transaction?.date)} | ${typeLabel(transaction?.type)} | ${money(Math.abs(Number(transaction?.amount || 0)), transaction?.currency)}`);
    lines.push(`Estado: ${statusLabel(transaction?.status)} | ${transaction?.description || 'Sin descripcion'}`);
    if (transaction?.machineId) lines.push(`Maquina: ${transaction.machineId}${transaction?.liters != null ? ` | Litros: ${transaction.liters} L` : ''}`);
    lines.push(`ID: ${transaction?.id || 'No disponible'}`);
    if (Number(transaction?.bonusAmount) > 0) lines.push(`Bono: ${money(transaction.bonusAmount, transaction?.currency)}`);
    lines.push('');
  });
  downloadPdf('AquaQR-Historial', 'Historial de transacciones', `Generado ${dateTime(new Date())}`, lines);
}

export function downloadDispenseReceiptPdf(transaction) {
  const date = dateTime(transaction?.at);
  const cost = Number(transaction?.amountCents ?? 0) / 100;
  const balance = Number(transaction?.newBalanceCents ?? 0) / 100;
  const lines = [
    'Tipo: Dispensado de agua',
    'Estado: Completado',
    `Fecha: ${date}`,
    `Cantidad dispensada: ${Number(transaction?.liters || 0)} L`,
    `Costo total: ${money(cost)}`,
    `Saldo restante: ${money(balance)}`,
    `Ubicacion: ${transaction?.location || 'No disponible'}`,
    `Maquina: ${transaction?.machineId || 'No disponible'}`,
    `ID de transaccion: ${transaction?.txId || transaction?.id || 'No disponible'}`,
  ];
  downloadPdf(`AquaQR-Dispensado-${transaction?.txId || transaction?.id || Date.now()}`, 'Comprobante de dispensado', date, lines);
}

export function downloadRechargeReceiptPdf(completion) {
  const currency = completion?.currency || 'MXN';
  const amountCents = Number(completion?.amountCents || 0);
  const bonusCents = Number(completion?.bonusCents || 0);
  const lines = [
    'Tipo: Recarga de saldo',
    'Estado: Aplicada a tu saldo',
    `Fecha: ${dateTime(completion?.date)}`,
    `Monto pagado: ${money(amountCents / 100, currency)}`,
    ...(bonusCents > 0 ? [`Bono aplicado: ${money(bonusCents / 100, currency)}`] : []),
    `Saldo recibido: ${money((amountCents + bonusCents) / 100, currency)}`,
    ...(Number.isFinite(Number(completion?.balanceCents)) ? [`Saldo disponible: ${money(Number(completion.balanceCents) / 100, currency)}`] : []),
    ...(completion?.rechargeId ? [`ID de recarga: ${completion.rechargeId}`] : []),
  ];
  downloadPdf(`AquaQR-Recarga-${completion?.rechargeId || Date.now()}`, 'Comprobante de recarga', 'Pago confirmado', lines);
}
