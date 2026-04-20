// src/components/Landing/v2/Testimonials.jsx
import React, { useState, useEffect } from 'react';
import { Star, TrendingUp, Clock, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const testimonials = [
    {
      name: "María González",
      role: "Dueña de Café Central",
      location: "Las Condes, Santiago",
      specialty: "Especialidad en Latte Art",
      image: "☕",
      quote: "TappMesa transformó completamente nuestra cafetería. Ahora nuestros clientes pueden personalizar sus bebidas desde la mesa y el flujo es mucho más eficiente. ¡Las ventas subieron un 35%!",
      stats: [
        { label: "Ventas", value: "+35%", icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Eficiencia", value: "60% más rápido", icon: <Clock className="w-4 h-4" /> },
        { label: "Satisfacción", value: "4.9/5.0", icon: <Star className="w-4 h-4" /> }
      ],
      badge: "Cafetería del Mes"
    },
    {
      name: "Carlos Mendoza",
      role: "Gerente General",
      location: "Cadena 'Granos & Más' (5 sucursales)",
      specialty: "Cadena Exitosa",
      image: "☕",
      quote: "Gestionar 5 cafeterías era un caos hasta que llegó TappMesa. El sistema nos permite monitorear todas las sucursales desde un solo lugar. Los reportes automáticos son oro puro.",
      stats: [
        { label: "Sucursales", value: "5", icon: <Users className="w-4 h-4" /> },
        { label: "Órdenes", value: "2.5k mensuales", icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Admin", value: "70% menos", icon: <Clock className="w-4 h-4" /> }
      ],
      badge: "Cliente Enterprise"
    },
    {
      name: "Andrea Silva",
      role: "Propietaria de Rincón del Café",
      location: "Valparaíso",
      specialty: "Ambiente Acogedor",
      image: "☕",
      quote: "Soy una cafetería pequeña y familiar. TappMesa se adaptó perfecto a nosotros. Mis clientes aman poder reservar 'su mesa favorita junto a la ventana'. Es como tener un asistente digital 24/7.",
      stats: [
        { label: "Reservas", value: "+80%", icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Google", value: "5.0★", icon: <Star className="w-4 h-4" /> },
        { label: "Recurrentes", value: "40%", icon: <Users className="w-4 h-4" /> }
      ],
      badge: "Favorita Local"
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        // In desktop (showing 2 at a time), limit to length - 1
        const maxIndex = window.innerWidth >= 768 ? testimonials.length - 1 : testimonials.length - 1;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [testimonials.length]);

  // Navigation functions
  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = window.innerWidth >= 768 ? testimonials.length - 1 : testimonials.length - 1;
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const maxIndex = window.innerWidth >= 768 ? testimonials.length - 1 : testimonials.length - 1;
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  const goToSlide = (index) => {
    const maxIndex = window.innerWidth >= 768 ? testimonials.length - 1 : testimonials.length - 1;
    setCurrentIndex(Math.min(index, maxIndex));
  };

  return (
    <section id="testimonios" className="py-20 bg-cream-100/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-coffee-900">
            Historias de Éxito Reales
          </h2>
          <p className="text-xl text-coffee-600 max-w-3xl mx-auto mb-8">
            Desde pequeñas cafeterías familiares hasta cadenas exitosas, descubre cómo
            TappMesa está transformando el mundo del café.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {/* <div className="p-4 bg-cream-50 rounded-xl border-2 border-cream-300/50">
              <div className="text-3xl font-bold text-primary-500 mb-1">250+</div>
              <div className="text-sm text-coffee-600">Cafeterías Activas</div>
            </div> */}
            {/* <div className="p-4 bg-cream-50 rounded-xl border-2 border-cream-300/50">
              <div className="text-3xl font-bold text-primary-500 mb-1">45k+</div>
              <div className="text-sm text-coffee-600">Cafés Servidos/Mes</div>
            </div> */}
            <div className="p-4 bg-cream-50 rounded-xl border-2 border-cream-300/50">
              <div className="text-3xl font-bold text-primary-500 mb-1">4.9★</div>
              <div className="text-sm text-coffee-600">Satisfacción Promedio</div>
            </div>
            <div className="p-4 bg-cream-50 rounded-xl border-2 border-cream-300/50">
              <div className="text-3xl font-bold text-primary-500 mb-1">+40%</div>
              <div className="text-sm text-coffee-600">Aumento Ventas</div>
            </div>
          </div>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-7xl mx-auto">
          {/* Carousel Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / 2)}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="min-w-full md:min-w-[50%] px-3 md:px-4"
                >
                  <div className="p-6 lg:p-8 bg-cream-50 rounded-xl border-2 border-cream-300/50 shadow-coffee-lg h-full flex flex-col">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-terracotta-500/10 px-3 py-1 rounded-full mb-4 self-start">
                      <span className="text-xl">{testimonial.image}</span>
                      <span className="text-xs font-semibold text-terracotta-500">{testimonial.badge}</span>
                    </div>

                    {/* Quote */}
                    <blockquote className="text-coffee-900/90 mb-6 text-base lg:text-lg leading-relaxed flex-grow">
                      "{testimonial.quote}"
                    </blockquote>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-6">
                      {testimonial.stats.map((stat, idx) => (
                        <div key={idx} className="text-center p-3 bg-cream-100/50 rounded-lg">
                          <div className="flex justify-center mb-1 text-primary-500">
                            {stat.icon}
                          </div>
                          <div className="font-bold text-sm mb-0.5 text-coffee-900">{stat.value}</div>
                          <div className="text-xs text-coffee-600">{stat.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Author Info */}
                    <div className="pt-4 border-t border-cream-300">
                      <div className="font-bold text-lg mb-1 text-coffee-900">{testimonial.name}</div>
                      <div className="text-sm text-coffee-600 mb-1">{testimonial.role}</div>
                      <div className="text-xs text-coffee-600">{testimonial.location}</div>
                      <div className="text-xs text-terracotta-500 mt-2">{testimonial.specialty}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-12 bg-white p-3 rounded-full shadow-coffee-lg hover:shadow-coffee-xl hover:scale-110 transition-all text-coffee-900"
            aria-label="Testimonio anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-12 bg-white p-3 rounded-full shadow-coffee-lg hover:shadow-coffee-xl hover:scale-110 transition-all text-coffee-900"
            aria-label="Siguiente testimonio"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: testimonials.length }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-terracotta-500 w-8'
                    : 'bg-cream-300 hover:bg-terracotta-300'
                }`}
                aria-label={`Ir al testimonio ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 animate-fade-in">
          <p className="text-lg text-coffee-600 mb-4">
            Amado por Dueños de Cafeterías en Todo Chile
          </p>
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-terracotta-500 text-terracotta-500" />
            ))}
            <span className="ml-2 text-lg font-semibold text-coffee-900">4.9 / 5.0</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
