// src/pages/home-dashboard/components/PromotionalBanner.jsx
import React, { useState, useEffect, useRef } from 'react';
import Image from '../../../components/AppImage';

const AUTO_MS = 5000;
const SWIPE_THRESHOLD = 60; // píxeles para considerar swipe

const PromotionalBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const intervalRef = useRef(null);

  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);
  const lastDeltaXRef = useRef(0);
  const containerRef = useRef(null);

  const banners = [
    {
      id: 1,
      title: '¡Agua Pura, Vida Pura!',
      subtitle: 'Disfruta de agua purificada de la más alta calidad',
      image:
        'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=800',
      gradient: 'from-primary/20 to-accent/20',
      cta: 'Dispensar Ahora',
    },
    {
      id: 2,
      title: 'Recarga y Ahorra',
      subtitle: 'Obtén 10% extra en recargas de $100 o más',
      image:
        'https://images.pexels.com/photos/40784/drops-of-water-water-nature-liquid-40784.jpeg',
      gradient: 'from-success/20 to-primary/20',
      cta: 'Recargar Saldo',
    },
    {
      id: 3,
      title: 'Impacto Social',
      subtitle: 'Cada litro dispensado ayuda a familias necesitadas',
      image:
        'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80',
      gradient: 'from-warning/20 to-success/20',
      cta: 'Ver Impacto',
    },
  ];

  const goToSlide = (index) => {
    setCurrentSlide((index + banners.length) % banners.length);
  };
  const nextSlide = () => goToSlide(currentSlide + 1);
  const prevSlide = () => goToSlide(currentSlide - 1);

  // autoplay
  const startAutoplay = () => {
    stopAutoplay();
    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, AUTO_MS);
  };
  const stopAutoplay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Gestos táctiles & mouse ---
  const onPointerDown = (clientX) => {
    stopAutoplay();
    isDraggingRef.current = true;
    startXRef.current = clientX;
    lastDeltaXRef.current = 0;
  };

  const onPointerMove = (clientX) => {
    if (!isDraggingRef.current) return;
    lastDeltaXRef.current = clientX - startXRef.current;
    // (opcional) podrías aplicar translateX para previsualizar el arrastre
  };

  const onPointerUp = () => {
    if (!isDraggingRef.current) return;
    const dx = lastDeltaXRef.current;
    isDraggingRef.current = false;
    lastDeltaXRef.current = 0;

    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx < 0) nextSlide(); // swipe hacia la izquierda -> siguiente
      else prevSlide();        // swipe hacia la derecha -> anterior
    }
    startAutoplay();
  };

  // eventos touch
  const handleTouchStart = (e) => onPointerDown(e.touches[0].clientX);
  const handleTouchMove = (e) => onPointerMove(e.touches[0].clientX);
  const handleTouchEnd = () => onPointerUp();

  // eventos mouse (drag)
  const handleMouseDown = (e) => onPointerDown(e.clientX);
  const handleMouseMove = (e) => onPointerMove(e.clientX);
  const handleMouseUp = () => onPointerUp();
  const handleMouseLeave = () => onPointerUp();

  return (
    <div
      ref={containerRef}
      className="relative rounded-2xl overflow-hidden bg-card border border-border select-none touch-pan-y"
      // táctil
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      // mouse
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      // accesibilidad
      role="region"
      aria-roledescription="carrusel"
      aria-label="Promociones"
    >
      <div className="relative h-48 md:h-56">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden={index !== currentSlide}
          >
            <div className="relative h-full">
              <Image
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
                draggable={false}
              />

              {/* Capa OSCURA + gradiente de marca para contraste */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/10" />
                <div className={`absolute inset-0 bg-gradient-to-r ${banner.gradient}`} />
              </div>

              {/* Contenido */}
              <div className="absolute inset-0 p-6 flex items-center justify-between">
                <div className="flex-1 relative z-10">
                  <h3
                    className="text-heading-md font-bold text-white mb-2"
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,.45)' }}
                  >
                    {banner.title}
                  </h3>
                  <p
                    className="text-body-sm text-white/90 mb-4 max-w-xs"
                    style={{ textShadow: '0 1px 1px rgba(0,0,0,.35)' }}
                  >
                    {banner.subtitle}
                  </p>
                  <button
                    className="
                      bg-primary text-primary-foreground px-4 py-2 rounded-lg
                      text-body-sm font-medium hover:bg-primary/90
                      transition-colors duration-200
                      ring-1 ring-white/60 shadow-md shadow-black/20
                    "
                  >
                    {banner.cta}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Indicadores (dots) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors duration-200 ${
              index === currentSlide ? 'bg-white' : 'bg-white/60'
            }`}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PromotionalBanner;
