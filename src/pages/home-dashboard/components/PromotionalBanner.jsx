import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const PromotionalBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const banners = [
    {
      id: 1,
      title: "¡Agua Pura, Vida Pura!",
      subtitle: "Disfruta de agua purificada de la más alta calidad",
      image: "https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=800",
      gradient: "from-primary/20 to-accent/20",
      cta: "Dispensar Ahora"
    },
    {
      id: 2,
      title: "Recarga y Ahorra",
      subtitle: "Obtén 10% extra en recargas de $100 o más",
      image: "https://images.pexels.com/photos/40784/drops-of-water-water-nature-liquid-40784.jpeg",
      gradient: "from-success/20 to-primary/20",
      cta: "Recargar Saldo"
    },
    {
      id: 3,
      title: "Impacto Social",
      subtitle: "Cada litro dispensado ayuda a familias necesitadas",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80",
      gradient: "from-warning/20 to-success/20",
      cta: "Ver Impacto"
    }
  ];

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners?.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners?.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners?.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners?.length) % banners?.length);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-card border border-border">
      <div className="relative h-48 md:h-56">
        {banners?.map((banner, index) => (
          <div
            key={banner?.id}
            className={`
              absolute inset-0 transition-opacity duration-500
              ${index === currentSlide ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <div className="relative h-full">
              <Image
                src={banner?.image}
                alt={banner?.title}
                className="w-full h-full object-cover"
              />
              <div className={`
                absolute inset-0 bg-gradient-to-r ${banner?.gradient}
                flex items-center justify-between p-6
              `}>
                <div className="flex-1">
                  <h3 className="text-heading-md font-bold text-text-primary mb-2">
                    {banner?.title}
                  </h3>
                  <p className="text-body-sm text-text-secondary mb-4 max-w-xs">
                    {banner?.subtitle}
                  </p>
                  <button className="
                    bg-primary text-primary-foreground px-4 py-2 rounded-lg
                    text-body-sm font-medium hover:bg-primary/90
                    transition-colors duration-200
                  ">
                    {banner?.cta}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="
            absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10
            bg-background/80 backdrop-blur-sm rounded-full
            flex items-center justify-center hover:bg-background/90
            transition-colors duration-200
          "
          aria-label="Anterior"
        >
          <Icon name="ChevronLeft" size={20} className="text-text-primary" />
        </button>
        
        <button
          onClick={nextSlide}
          className="
            absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10
            bg-background/80 backdrop-blur-sm rounded-full
            flex items-center justify-center hover:bg-background/90
            transition-colors duration-200
          "
          aria-label="Siguiente"
        >
          <Icon name="ChevronRight" size={20} className="text-text-primary" />
        </button>
      </div>
      {/* Slide Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {banners?.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`
              w-2 h-2 rounded-full transition-colors duration-200
              ${index === currentSlide ? 'bg-primary' : 'bg-background/60'}
            `}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PromotionalBanner;