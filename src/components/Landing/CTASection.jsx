// src/pages/landing/components/CTASection.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const CTASection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleQuickStart = () => {
    navigate('/register');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envío de email
    setTimeout(() => {
      setIsSubmitting(false);
      navigate(`/register?email=${encodeURIComponent(email)}`);
    }, 1000);
  };

  const benefits = [
    {
      icon: '⚡',
      title: 'Configuración en 10 minutos',
      description: 'Tu restaurante digital listo en menos de 10 minutos'
    },
    {
      icon: '🎯',
      title: 'Soporte personalizado',
      description: 'Te acompañamos en cada paso de la configuración'
    },
    {
      icon: '📈',
      title: 'Resultados inmediatos',
      description: 'Comienza a ver mejoras desde el primer día'
    },
    {
      icon: '🔄',
      title: 'Sin compromiso',
      description: 'Cancela cuando quieras, sin penalizaciones'
    }
  ];

  const urgencyFactors = [
    'Únete a 500+ restaurantes que ya digitalizaron su operación',
    'Más de 50,000 órdenes procesadas exitosamente',
    'Promedio de 35% de aumento en ventas reportado',
    '98% de clientes satisfechos con el servicio'
  ];

  return (
    <section className="cta-section">
      <div className="container">
        {/* Main CTA */}
        <div className="main-cta">
          <div className="cta-content">
            <div className="cta-header">
              <h2 className="cta-title">
                ¿Listo para revolucionar tu restaurante?
              </h2>
              <p className="cta-subtitle">
                Únete a cientos de restaurantes que ya transformaron su negocio con TappMesa. 
                Comienza tu prueba gratuita hoy mismo.
              </p>
            </div>

            <div className="cta-benefits">
              <div className="benefits-grid">
                {benefits.map((benefit, index) => (
                  <div key={index} className="benefit-item">
                    <div className="benefit-icon">{benefit.icon}</div>
                    <div className="benefit-content">
                      <h4>{benefit.title}</h4>
                      <p>{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="cta-actions">
              <div className="primary-action">
                <Button 
                  onClick={handleQuickStart}
                  className="btn-primary btn-large"
                >
                  Comenzar Prueba Gratuita
                </Button>
                <p className="action-note">
                  ✓ 14 días gratis • ✓ Sin tarjeta de crédito • ✓ Configuración incluida
                </p>
              </div>

              <div className="email-capture">
                <p className="email-intro">O déjanos tu email para más información:</p>
                <form onSubmit={handleEmailSubmit} className="email-form">
                  <div className="input-group">
                    <input
                      type="email"
                      id="cta-email"
                      name="cta-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@restaurante.com"
                      className="email-input"
                      autoComplete="email"
                      required
                    />
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="btn-secondary"
                    >
                      {isSubmitting ? 'Enviando...' : 'Recibir Info'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="cta-visual">
            <div className="success-illustration">
              <div className="illustration-container">
                <div className="restaurant-icon">🏪</div>
                <div className="transformation-arrow">→</div>
                <div className="digital-restaurant">
                  <div className="digital-icon">📱</div>
                  <div className="success-indicators">
                    <div className="indicator sales">📈 +35% ventas</div>
                    <div className="indicator efficiency">⚡ +40% eficiencia</div>
                    <div className="indicator satisfaction">😊 98% satisfacción</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof / Urgency */}
        <div className="social-proof-banner">
          <div className="proof-content">
            <h3>¿Por qué elegir TappMesa ahora?</h3>
            <div className="urgency-factors">
              {urgencyFactors.map((factor, index) => (
                <div key={index} className="urgency-item">
                  <span className="urgency-check">✓</span>
                  <span>{factor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Last Chance CTA */}
        <div className="final-cta">
          <div className="final-cta-content">
            <h3>No te quedes atrás de la competencia</h3>
            <p>
              Cada día que esperas es una oportunidad perdida de mejorar la experiencia 
              de tus clientes y aumentar tus ventas.
            </p>
            
            <div className="time-sensitive-offer">
              <div className="offer-badge">
                <span className="badge-icon">🎯</span>
                <div className="badge-content">
                  <span className="badge-title">Oferta Especial</span>
                  <span className="badge-subtitle">Configuración gratuita por tiempo limitado</span>
                </div>
              </div>
            </div>

            <div className="final-actions">
              <Button 
                onClick={handleQuickStart}
                className="btn-primary btn-large"
              >
                Sí, quiero digitalizar mi restaurante
              </Button>
              
              <div className="contact-alternative">
                <p>¿Prefieres hablar con alguien?</p>
                <a href="tel:+56912345678" className="phone-link">
                  📞 +56 9 1234 5678
                </a>
                <span className="availability">Lun-Vie 9:00-18:00</span>
              </div>
            </div>

            <div className="security-badges">
              <div className="badge">
                <span>🔒</span>
                <span>Datos Seguros</span>
              </div>
              <div className="badge">
                <span>🇨🇱</span>
                <span>Empresa Chilena</span>
              </div>
              <div className="badge">
                <span>💳</span>
                <span>Sin Tarjeta</span>
              </div>
              <div className="badge">
                <span>📞</span>
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Reversal */}
        <div className="risk-reversal">
          <h4>Garantía de satisfacción 100%</h4>
          <p>
            Si en los primeros 30 días no estás completamente satisfecho, 
            te devolvemos tu dinero sin preguntas.
          </p>
          <div className="guarantee-features">
            <span>✓ Soporte técnico incluido</span>
            <span>✓ Capacitación personalizada</span>
            <span>✓ Migración de datos gratuita</span>
            <span>✓ Sin costos ocultos</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;