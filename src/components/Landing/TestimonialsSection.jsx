// src/components/Landing/TestimonialsSection.jsx
import { useState, useEffect } from 'react';
import { useInView } from '../../hooks/useInView';

export default function TestimonialsSection() {
  const { ref, isInView } = useInView({ threshold: 0.2 });
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const testimonials = [
    {
      id: 1,
      name: 'Carlos Mendoza',
      role: 'Chef Propietario',
      restaurant: 'Restaurante Milano',
      location: 'Santiago, Chile',
      avatar: '👨‍🍳',
      rating: 5,
      quote: 'TappMesa transformó completamente nuestro restaurante. En solo 3 semanas recuperamos la inversión completa. Nuestros clientes aman la experiencia digital y nosotros la eficiencia operativa.',
      metrics: {
        increase: '+35%',
        metric: 'en ventas'
      },
      highlight: 'ROI en 3 semanas'
    },
    {
      id: 2,
      name: 'María González',
      role: 'Gerente General',
      restaurant: 'Café Central',
      location: 'Valparaíso, Chile',
      avatar: '👩‍💼',
      rating: 5,
      quote: 'Lo que más me gusta es cómo se redujo el tiempo de espera de nuestros clientes. Antes tardábamos 15 minutos en tomar un pedido, ahora son 2 minutos. Los clientes están mucho más satisfechos.',
      metrics: {
        increase: '-85%',
        metric: 'tiempo de espera'
      },
      highlight: 'Servicio más rápido'
    },
    {
      id: 3,
      name: 'Roberto Silva',
      role: 'Dueño',
      restaurant: 'Pizzería Napoli',
      location: 'Concepción, Chile',
      avatar: '👨‍🍳',
      rating: 5,
      quote: 'El sistema de reservas online nos cambió la vida. Ya no perdemos mesas vacías y nuestros clientes pueden reservar 24/7. El dashboard me da toda la información que necesito para tomar decisiones.',
      metrics: {
        increase: '+50%',
        metric: 'ocupación mesas'
      },
      highlight: 'Reservas 24/7'
    },
    {
      id: 4,
      name: 'Ana Rodríguez',
      role: 'Propietaria',
      restaurant: 'Bistro Verde',
      location: 'La Serena, Chile',
      avatar: '👩‍🍳',
      rating: 5,
      quote: 'Implementamos TappMesa en nuestros 3 locales y la diferencia es increíble. Los reportes unificados me permiten ver todo desde una sola pantalla. El soporte técnico es excepcional.',
      metrics: {
        increase: '+40%',
        metric: 'eficiencia operativa'
      },
      highlight: 'Multi-ubicación'
    },
    {
      id: 5,
      name: 'Diego Morales',
      role: 'Chef Ejecutivo',
      restaurant: 'Marisquería del Puerto',
      location: 'Viña del Mar, Chile',
      avatar: '👨‍🍳',
      rating: 5,
      quote: 'Las comandas digitales organizaron completamente nuestra cocina. Ya no hay errores de pedidos y podemos manejar el doble de órdenes en las horas pico. Es como tener un chef digital ayudándonos.',
      metrics: {
        increase: '+100%',
        metric: 'capacidad en hora pico'
      },
      highlight: 'Cocina organizada'
    }
  ];

  const stats = [
    {
      number: '500+',
      label: 'Restaurantes activos',
      icon: '🏪'
    },
    {
      number: '98%',
      label: 'Satisfacción del cliente',
      icon: '⭐'
    },
    {
      number: '2.5M+',
      label: 'Pedidos procesados',
      icon: '📋'
    },
    {
      number: '25%',
      label: 'Aumento promedio en ventas',
      icon: '📈'
    }
  ];

  // Auto-rotate testimonials
  useEffect(() => {
    if (!autoPlay) return;

    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoPlay, testimonials.length]);

  const currentTestimonial = testimonials[activeTestimonial];

  const nextTestimonial = () => {
    setActiveTestimonial(prev => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setActiveTestimonial(prev => 
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={`star ${i < rating ? 'filled' : ''}`}>
        ⭐
      </span>
    ));
  };

  return (
    <section id="testimonials" className="testimonials-section" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <span className="badge-icon">💬</span>
            <span>Testimonios</span>
          </div>
          
          <h2 className="section-title">
            Lo que dicen nuestros{' '}
            <span className="highlight">clientes</span>
          </h2>
          
          <p className="section-description">
            Más de 500 restaurantes ya transformaron su negocio con TappMesa. 
            Descubre sus historias de éxito.
          </p>
        </div>

        {/* Main Testimonial */}
        <div className="main-testimonial">
          <div className="testimonial-content">
            <div className="testimonial-quote">
              <div className="quote-mark">"</div>
              <blockquote className="quote-text">
                {currentTestimonial.quote}
              </blockquote>
            </div>

            <div className="testimonial-author">
              <div className="author-avatar">
                {currentTestimonial.avatar}
              </div>
              <div className="author-info">
                <div className="author-name">{currentTestimonial.name}</div>
                <div className="author-role">{currentTestimonial.role}</div>
                <div className="author-restaurant">
                  {currentTestimonial.restaurant} • {currentTestimonial.location}
                </div>
                <div className="author-rating">
                  {renderStars(currentTestimonial.rating)}
                </div>
              </div>
            </div>

            <div className="testimonial-metrics">
              <div className="metric-item">
                <div className="metric-value">{currentTestimonial.metrics.increase}</div>
                <div className="metric-label">{currentTestimonial.metrics.metric}</div>
              </div>
              <div className="metric-highlight">
                {currentTestimonial.highlight}
              </div>
            </div>
          </div>

          <div className="testimonial-controls">
            <button 
              className="control-btn prev"
              onClick={prevTestimonial}
              onMouseEnter={() => setAutoPlay(false)}
              onMouseLeave={() => setAutoPlay(true)}
            >
              ←
            </button>
            
            <div className="testimonial-indicators">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === activeTestimonial ? 'active' : ''}`}
                  onClick={() => setActiveTestimonial(index)}
                />
              ))}
            </div>
            
            <button 
              className="control-btn next"
              onClick={nextTestimonial}
              onMouseEnter={() => setAutoPlay(false)}
              onMouseLeave={() => setAutoPlay(true)}
            >
              →
            </button>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className={`testimonial-card ${
                index === activeTestimonial ? 'active' : ''
              } ${isInView ? 'animate-in' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setActiveTestimonial(index)}
            >
              <div className="card-header">
                <div className="card-avatar">{testimonial.avatar}</div>
                <div className="card-rating">
                  {renderStars(testimonial.rating)}
                </div>
              </div>

              <div className="card-content">
                <p className="card-quote">"{testimonial.quote.slice(0, 100)}..."</p>
                
                <div className="card-author">
                  <div className="author-name">{testimonial.name}</div>
                  <div className="author-restaurant">{testimonial.restaurant}</div>
                </div>

                <div className="card-metric">
                  <span className="metric-value">{testimonial.metrics.increase}</span>
                  <span className="metric-label">{testimonial.metrics.metric}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Statistics */}
        <div className="testimonials-stats">
          <div className="stats-header">
            <h3>Resultados que hablan por sí solos</h3>
          </div>
          
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`stat-item ${isInView ? 'animate-in' : ''}`}
                style={{ animationDelay: `${(index + 1) * 200}ms` }}
              >
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Testimonials Preview */}
        <div className="video-testimonials">
          <h3 className="video-title">Ve testimonios en video</h3>
          
          <div className="video-grid">
            <div className="video-card">
              <div className="video-thumbnail">
                <div className="video-play-btn">▶️</div>
                <div className="video-info">
                  <span className="video-restaurant">Restaurante Milano</span>
                  <span className="video-duration">2:34</span>
                </div>
              </div>
            </div>
            
            <div className="video-card">
              <div className="video-thumbnail">
                <div className="video-play-btn">▶️</div>
                <div className="video-info">
                  <span className="video-restaurant">Café Central</span>
                  <span className="video-duration">1:58</span>
                </div>
              </div>
            </div>
            
            <div className="video-card">
              <div className="video-thumbnail">
                <div className="video-play-btn">▶️</div>
                <div className="video-info">
                  <span className="video-restaurant">Pizzería Napoli</span>
                  <span className="video-duration">3:12</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Stories */}
        <div className="success-stories">
          <h3 className="stories-title">Casos de éxito destacados</h3>
          
          <div className="stories-grid">
            <div className="story-card">
              <div className="story-header">
                <h4>De 50 a 150 pedidos diarios</h4>
                <span className="story-tag">Crecimiento</span>
              </div>
              <p className="story-content">
                Café Central triplicó su capacidad de pedidos sin contratar más personal, 
                optimizando sus procesos con TappMesa.
              </p>
              <div className="story-metrics">
                <span className="metric">+200% pedidos</span>
                <span className="metric">0 personal extra</span>
              </div>
            </div>

            <div className="story-card">
              <div className="story-header">
                <h4>Reducción del 90% en errores</h4>
                <span className="story-tag">Eficiencia</span>
              </div>
              <p className="story-content">
                Marisquería del Puerto eliminó prácticamente todos los errores en pedidos 
                gracias a las comandas digitales automatizadas.
              </p>
              <div className="story-metrics">
                <span className="metric">-90% errores</span>
                <span className="metric">+$500k ahorrados</span>
              </div>
            </div>

            <div className="story-card">
              <div className="story-header">
                <h4>ROI del 450% en 30 días</h4>
                <span className="story-tag">Retorno</span>
              </div>
              <p className="story-content">
                Bistro Verde recuperó completamente su inversión en el primer mes 
                y sigue viendo crecimiento constante.
              </p>
              <div className="story-metrics">
                <span className="metric">450% ROI</span>
                <span className="metric">30 días recuperación</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="trust-badges">
          <div className="badges-grid">
            <div className="trust-badge">
              <div className="badge-icon">🏆</div>
              <div className="badge-text">
                <strong>Mejor Solución Gastronómica 2024</strong>
                <span>Restaurant Tech Awards</span>
              </div>
            </div>
            
            <div className="trust-badge">
              <div className="badge-icon">🛡️</div>
              <div className="badge-text">
                <strong>Certificación ISO 27001</strong>
                <span>Seguridad de datos garantizada</span>
              </div>
            </div>
            
            <div className="trust-badge">
              <div className="badge-icon">📱</div>
              <div className="badge-text">
                <strong>App del Año 2024</strong>
                <span>Chile Mobile Awards</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}