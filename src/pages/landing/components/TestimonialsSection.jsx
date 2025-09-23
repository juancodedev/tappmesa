// src/pages/landing/components/TestimonialsSection.jsx - Versión con Tailwind
import React, { useState, useEffect } from 'react';

const TestimonialsSection = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  const testimonials = [
    {
      id: 1,
      name: 'Carlos Mendoza',
      business: 'Café Central',
      location: 'Santiago, Chile',
      avatar: '👨‍💼',
      rating: 5,
      text: 'TappMesa revolucionó nuestro café. Los clientes aman poder ordenar desde su mesa sin esperar al mesero. Nuestras ventas aumentaron 35% en el primer mes.',
      results: {
        sales: '+35%',
        satisfaction: '98%',
        efficiency: '+40%'
      }
    },
    {
      id: 2,
      name: 'Ana Sofía Ruiz',
      business: 'Restaurante Marisquería del Puerto',
      location: 'Valparaíso, Chile',
      avatar: '👩‍🍳',
      rating: 5,
      text: 'Como chef, lo que más me gusta es que las órdenes llegan directamente a la cocina sin errores. Ya no tenemos problemas de comunicación con el servicio.',
      results: {
        errors: '-90%',
        speed: '+25%',
        quality: '99%'
      }
    },
    {
      id: 3,
      name: 'Miguel Torres',
      business: 'Pizzería Don Miguel',
      location: 'Concepción, Chile',
      avatar: '👨‍🍳',
      rating: 5,
      text: 'El sistema de reservas nos ayudó a optimizar el uso de nuestras mesas. Ahora podemos planificar mejor y nuestros clientes siempre tienen mesa disponible.',
      results: {
        occupancy: '+50%',
        planning: '100%',
        customer: '95%'
      }
    }
  ];

  const stats = [
    {
      number: '500+',
      label: 'Restaurantes Activos',
      description: 'Confiando en TappMesa'
    },
    {
      number: '50,000+',
      label: 'Órdenes Mensuales',
      description: 'Procesadas exitosamente'
    },
    {
      number: '98%',
      label: 'Satisfacción',
      description: 'De clientes satisfechos'
    },
    {
      number: '35%',
      label: 'Aumento Promedio',
      description: 'En ventas reportado'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => 
        prev === testimonials.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentTestimonial(
      currentTestimonial === testimonials.length - 1 ? 0 : currentTestimonial + 1
    );
  };

  const prevTestimonial = () => {
    setCurrentTestimonial(
      currentTestimonial === 0 ? testimonials.length - 1 : currentTestimonial - 1
    );
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>⭐</span>
    ));
  };

  return (
    <section id="testimonials" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-xl text-gray-600">
            Historias reales de restaurantes que transformaron su negocio con TappMesa
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-primary-500 mb-2">{stat.number}</div>
              <div className="font-semibold text-gray-900 mb-1">{stat.label}</div>
              <div className="text-sm text-gray-600">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Main Testimonial Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <button 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-primary-500 transition-colors z-10"
            onClick={prevTestimonial}
          >
            ‹
          </button>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 lg:p-12">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">"</div>
              <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed mb-8">
                {testimonials[currentTestimonial].text}
              </p>
              <div className="text-6xl mb-4">"</div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <h4 className="md:col-span-3 text-lg font-semibold text-gray-900 text-center mb-4">Resultados obtenidos:</h4>
              {Object.entries(testimonials[currentTestimonial].results).map(([key, value]) => (
                <div key={key} className="text-center bg-white rounded-2xl p-6 shadow-lg">
                  <div className="text-2xl font-bold text-primary-500 mb-2">{value}</div>
                  <div className="text-sm text-gray-600">
                    {key === 'sales' && 'Ventas'}
                    {key === 'satisfaction' && 'Satisfacción'}
                    {key === 'efficiency' && 'Eficiencia'}
                    {key === 'errors' && 'Menos Errores'}
                    {key === 'speed' && 'Más Rápido'}
                    {key === 'quality' && 'Calidad'}
                    {key === 'occupancy' && 'Ocupación'}
                    {key === 'planning' && 'Planificación'}
                    {key === 'customer' && 'Satisfacción'}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <div className="text-4xl">{testimonials[currentTestimonial].avatar}</div>
              <div className="text-center">
                <div className="font-bold text-gray-900 text-lg">
                  {testimonials[currentTestimonial].name}
                </div>
                <div className="text-gray-600">
                  {testimonials[currentTestimonial].business}
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  📍 {testimonials[currentTestimonial].location}
                </div>
                <div className="flex justify-center">
                  {renderStars(testimonials[currentTestimonial].rating)}
                </div>
              </div>
            </div>
          </div>
          
          <button 
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-primary-500 transition-colors z-10"
            onClick={nextTestimonial}
          >
            ›
          </button>
        </div>

        {/* Carousel Indicators */}
        <div className="flex justify-center mt-8 gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentTestimonial ? 'bg-primary-500' : 'bg-gray-300'
              }`}
              onClick={() => setCurrentTestimonial(index)}
            />
          ))}
        </div>

        {/* All Testimonials Grid */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Más testimonios de nuestros clientes</h3>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={testimonial.id} 
                className={`bg-white rounded-2xl p-6 shadow-lg border transition-all duration-300 cursor-pointer ${
                  index === currentTestimonial ? 'border-primary-500 shadow-xl' : 'border-gray-200 hover:shadow-xl'
                }`}
                onClick={() => setCurrentTestimonial(index)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.business}</div>
                    <div className="flex">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {testimonial.text.substring(0, 120)}...
                </p>
                <button className="text-primary-500 hover:text-primary-600 text-sm font-medium mt-3 transition-colors">
                  Leer más
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 lg:p-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Únete a la revolución digital gastronómica
            </h3>
            <p className="text-gray-600 mb-8">
              Cientos de restaurantes ya están ofreciendo una mejor experiencia a sus clientes
            </p>
            <div className="flex justify-center gap-4 text-4xl">
              <span>🏪</span>
              <span>🍕</span>
              <span>☕</span>
              <span>🍔</span>
              <span>🥗</span>
              <span>🍰</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;