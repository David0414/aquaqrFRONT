import React, { useEffect, useState } from 'react';

export default function StartupStatus({ failed = false }) {
  const [delayed, setDelayed] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setDelayed(true), 15000);
    return () => window.clearTimeout(timer);
  }, []);
  return (
    <main role={failed ? 'alert' : 'status'} aria-live="polite"
      className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-sky-50 px-6 text-center text-[#1E3F7A]">
      <div className="max-w-sm space-y-4">
        <p className="text-3xl font-black">AGUA<span className="text-[#42B9D4]">/24</span></p>
        {!failed ? <div aria-hidden="true" className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-sky-100 border-t-cyan-500" /> : null}
        <h1 className="text-xl font-semibold">{failed ? 'No se pudo abrir la aplicación' : delayed ? 'La conexión está tardando' : 'Cargando tu cuenta…'}</h1>
        <p className="text-sm leading-6 text-slate-600">{failed || delayed ? 'Comprueba tu conexión a internet e intenta nuevamente.' : 'Estamos preparando tu acceso.'}</p>
        {failed || delayed ? <button type="button" onClick={() => window.location.reload()}
          className="rounded-xl bg-[#1E3F7A] px-5 py-3 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2">Reintentar</button> : null}
      </div>
    </main>
  );
}
