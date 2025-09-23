// src/pages/landing/components/TestimonialsSection.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../../components/ui/Card';

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
    },
    {
      id: 4,
      name: 'Patricia González',
      business: 'Café & Books',
      location: 'La Serena, Chile',
      avatar: '👩‍💼',
      rating: 5,
      text: 'Perfecto para nuestro café-librería. Los clientes pueden tomar su tiempo para decidir mientras leen, y ordenar cuando quieran. El ambiente es mucho más relajado.',
      results: {
        time: '+60%',
        orders: '+28%',
        ambiance: '100%'
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
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>⭐</span>
    ));
  };

  return (
    <section className="testimonials-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Lo que dicen nuestros clientes</h2>
          <p className="section-description">
            Historias reales de restaurantes que transformaron su negocio con TappMesa
          </p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-card">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-description">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Main Testimonial Carousel */}
        <div className="testimonial-carousel">
          <button className="carousel-btn prev" onClick={prevTestimonial}>
            ‹
          </button>
          
          <div className="testimonial-container">
            <Card className="testimonial-card featured">
              <div className="testimonial-content">
                <div className="testimonial-quote">
                  <span className="quote-mark">"</span>
                  <p className="testimonial-text">
                    {testimonials[currentTestimonial].text}
                  </p>
                  <span className="quote-mark">"</span>
                </div>
                
                <div className="testimonial-results">
                  <h4>Resultados obtenidos:</h4>
                  <div className="results-grid">
                    {Object.entries(testimonials[currentTestimonial].results).map(([key, value]) => (
                      <div key={key} className="result-item">
                        <span className="result-value">{value}</span>
                        <span className="result-label">
                          {key === 'sales' && 'Ventas'}
                          {key === 'satisfaction' && 'Satisfacción'}
                          {key === 'efficiency' && 'Eficiencia'}
                          {key === 'errors' && 'Menos Errores'}
                          {key === 'speed' && 'Más Rápido'}
                          {key === 'quality' && 'Calidad'}
                          {key === 'occupancy' && 'Ocupación'}
                          {key === 'planning' && 'Planificación'}
                          {key === 'customer' && 'Satisfacción'}
                          {key === 'time' && 'Tiempo Mesa'}
                          {key === 'orders' && 'Órdenes'}
                          {key === 'ambiance' && 'Ambiente'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="testimonial-author">
                  <div className="author-avatar">
                    <span>{testimonials[currentTestimonial].avatar}</span>
                  </div>
                  <div className="author-info">
                    <div className="author-name">
                      {testimonials[currentTestimonial].name}
                    </div>
                    <div className="author-business">
                      {testimonials[currentTestimonial].business}
                    </div>
                    <div className="author-location">
                      📍 {testimonials[currentTestimonial].location}
                    </div>
                    <div className="testimonial-rating">
                      {renderStars(testimonials[currentTestimonial].rating)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          <button className="carousel-btn next" onClick={nextTestimonial}>
            ›
          </button>
        </div>

        {/* Carousel Indicators */}
        <div className="carousel-indicators">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentTestimonial ? 'active' : ''}`}
              onClick={() => setCurrentTestimonial(index)}
            />
          ))}
        </div>

        {/* All Testimonials Grid */}
        <div className="all-testimonials">
          <h3>Más testimonios de nuestros clientes</h3>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <Card key={testimonial.id} className={`testimonial-card small ${index === currentTestimonial ? 'highlighted' : ''}`}>
                <div className="testimonial-header">
                  <div className="author-avatar small">
                    <span>{testimonial.avatar}</span>
                  </div>
                  <div className="author-info">
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-business">{testimonial.business}</div>
                    <div className="testimonial-rating">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
                <p className="testimonial-text short">
                  {testimonial.text.substring(0, 120)}...
                </p>
                <button 
                  className="read-more-btn"
                  onClick={() => setCurrentTestimonial(index)}
                >
                  Leer más
                </button>
              </Card>
            ))}
          </div>
        </div>

        {/* Social Proof */}
        <div className="social-proof">
          <div className="proof-content">
            <h3>Únete a la revolución digital gastronómica</h3>
            <p>Cientos de restaurantes ya están ofreciendo una mejor experiencia a sus clientes</p>
            <div className="proof-logos">
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