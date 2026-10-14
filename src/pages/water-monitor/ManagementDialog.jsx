import React, { useEffect, useRef } from 'react';
import Icon from '../../components/AppIcon';

export default function ManagementDialog({ title, description, onClose, busy = false, children }) {
  const ref = useRef(null);
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="m-dialog" aria-labelledby="management-dialog-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="m-dialog-heading"><div><h2 id="management-dialog-title">{title}</h2>{description && <p>{description}</p>}</div>
      <button type="button" className="m-icon-button" disabled={busy} onClick={onClose} aria-label="Cerrar ventana"><Icon name="X" size={20} /></button></div>
    {children}
  </dialog>;
}
