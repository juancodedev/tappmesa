// src/components/Landing/BenefitsSection.jsx
import { useState } from 'react';
import { useInView } from '../../hooks/useInView';

export default function BenefitsSection() {
  const { ref, isInView } = useInView({ threshold: 0.2 });
  const [activeTab, setActiveTab] = useState('efficiency');

  const tabs = [
    {
      id: 'efficiency',
      title: 'Eficiencia',
      icon: '⚡',
      color: '#ff6b35'
    },
    {
      id: 'revenue',
      title: 'Ingresos',
      icon: '📈',
      color: '#28a745'
    },
    {
      id: 'experience',
      title: 'Experiencia',
      icon: '⭐',
      color: '#007bff'
    }
  ];

  const benefits = {
    efficiency: [
      {
        icon: '🚀',
        title: 'Implementación Rápida',
        description: 'Tu restaurante estará funcionando con TappMesa en menos de 24 horas',
        metric: '< 24h',
        details: [
          'Setup automático del menú',
          'Configuración de mesas y QR',
          'Capacitación del personal',
          'Soporte durante el lanzamiento'
        ]
      },
      {
        icon: '💰',
        title: 'Reduce Costos Operativos',
        description: 'Elimina la necesidad de menús impresos y reduce el personal requerido',
        metric: '40%',
        details: [
          'Sin costos de impresión de menús',
          'Menos personal para tomar pedidos',
          'Reducción de errores costosos',
          'Automatización de procesos'
        ]
      },
      {
        icon: '📊',
        title: 'Operación Optimizada',
        description: 'Flujo de trabajo más eficiente desde el pedido hasta la entrega',
        metric: '50%',
        details: [
          'Comandas organizadas automáticamente',
          'Estados de preparación en tiempo real',
          'Comunicación directa cocina-mesero',
          'Gestión inteligente de mesas'
        ]
      }
    ],
    revenue: [
      {
        icon: '📈',
        title: 'Aumenta las Ventas',
        description: 'Los menús digitales muestran mejor los productos y generan más pedidos',
        metric: '+30%',
        details: [
          'Fotos atractivas de productos',
          'Sugerencias inteligentes',
          'Promociones dirigidas',
          'Facilidad para agregar extras'
        ]
      },
      {
        icon: '🛒',
        title: 'Ticket Promedio Mayor',
        description: 'Los clientes tienden a pedir más cuando usan el carrito digital',
        metric: '+25%',
        details: [
          'Visibilidad del total en tiempo real',
          'Fácil agregar productos adicionales',
          'Recomendaciones automáticas',
          'Sin presión del mesero'
        ]
      },
      {
        icon: '🔄',
        title: 'Más Rotación de Mesas',
        description: 'Servicio más rápido significa más clientes por día',
        metric: '+20%',
        details: [
          'Pedidos más rápidos',
          'Menos tiempo de espera',
          'Proceso de pago eficiente',
          'Reservas optimizadas'
        ]
      }
    ],
    experience: [
      {
        icon: '🎯',
        title: 'Experiencia Personalizada',
        description: 'Recomendaciones inteligentes y promociones dirigidas a cada cliente',
        metric: '95%',
        details: [
          'Historial de pedidos',
          'Preferencias guardadas',
          'Ofertas personalizadas',
          'Programa de lealtad'
        ]
      },
      {
        icon: '📱',
        title: 'Tecnología Moderna',
        description: 'Experiencia digital que los clientes esperan en 2024',
        metric: '4.8★',
        details: [
          'Interfaz intuitiva y moderna',
          'Compatibilidad total móvil',
          'Actualizaciones constantes',
          'Soporte multiidioma'
        ]
      },
      {
        icon: '🛡️',
        title: 'Seguridad y Confianza',
        description: 'Experiencia sin contacto y pagos seguros para tranquilidad total',
        metric: '100%',
        details: [
          'Experiencia contactless',
          'Pagos seguros SSL',
          'Datos protegidos',
          'Cumplimiento GDPR'
        ]
      }
    ]
  };

  const getActiveContent = () => benefits[activeTab] || benefits.efficiency;

  return (
    <section id="benefits" className="benefits-section" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <span className="badge-icon">💎</span>
            <span>Beneficios</span>
          </div>
          
          <h2 className="section-title">
            ¿Por qué elegir{' '}
            <span className="highlight">TappMesa</span>?
          </h2>
          
          <p className="section-description">
            Más que una herramienta, es una inversión que transforma 
            tu restaurante en un negocio más rentable y eficiente.
          </p>
        </div>

        {/* Benefits Tabs */}
        <div className="benefits-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`benefit-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ '--tab-color': tab.color }}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-title">{tab.title}</span>
            </button>
          ))}
        </div>

        {/* Benefits Content */}
        <div className="benefits-content">
          <div className="benefits-grid">
            {getActiveContent().map((benefit, index) => (
              <div
                key={index}
                className={`benefit-card ${isInView ? 'animate-in' : ''}`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="card-header">
                  <div className="card-icon-wrapper">
                    <span className="card-icon">{benefit.icon}</span>
                  </div>
                  <div className="card-metric">
                    {benefit.metric}
                  </div>
                </div>

                <div className="card-content">
                  <h3 className="card-title">{benefit.title}</h3>
                  <p className="card-description">{benefit.description}</p>
                  
                  <div className="card-details">
                    <h4 className="details-title">Incluye:</h4>
                    <ul className="details-list">
                      {benefit.details.map((detail, i) => (
                        <li key={i} className="detail-item">
                          <span className="detail-check">✓</span>
                          <span className="detail-text">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="card-footer">
                  <button className="learn-more-btn">
                    Ver más detalles
                    <span className="btn-arrow">→</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Calculator Preview */}
        <div className="roi-preview">
          <div className="roi-content">
            <div className="roi-text">
              <h3 className="roi-title">
                Calcula tu retorno de inversión
              </h3>
              <p className="roi-description">
                Descubre cuánto puedes ahorrar y ganar con TappMesa
              </p>
            </div>
            
            <div className="roi-calculator">
              <div className="calculator-inputs">
                <div className="input-group">
                  <label>Mesas promedio ocupadas/día</label>
                  <input type="number" defaultValue="20" min="1" max="100" />
                </div>
                <div className="input-group">
                  <label>Ticket promedio actual</label>
                  <input type="number" defaultValue="15000" min="1000" />
                </div>
              </div>
              
              <div className="calculator-results">
                <div className="result-item">
                  <span className="result-label">Aumento mensual estimado:</span>
                  <span className="result-value">+$2.250.000</span>
                </div>
                <div className="result-item">
                  <span className="result-label">ROI en primer mes:</span>
                  <span className="result-value highlight">450%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="benefits-social-proof">
          <div className="proof-stats">
            <div className="proof-stat">
              <div className="stat-number">500+</div>
              <div className="stat-label">Restaurantes activos</div>
            </div>
            <div className="proof-stat">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfacción del cliente</div>
            </div>
            <div className="proof-stat">
              <div className="stat-number">25%</div>
              <div className="stat-label">Aumento promedio en ventas</div>
            </div>
            <div className="proof-stat">
              <div className="stat-number">< 1 mes</div>
              <div className="stat-label">Tiempo de recuperación</div>
            </div>
          </div>

          <div className="proof-testimonial">
            <blockquote className="testimonial-quote">
              "En solo 3 semanas recuperamos la inversión completa. 
              Nuestros clientes aman la experiencia digital y nosotros 
              la eficiencia operativa."
            </blockquote>
            <div className="testimonial-author">
              <div className="author-avatar">👨‍🍳</div>
              <div className="author-info">
                <div className="author-name">Carlos Mendoza</div>
                <div className="author-role">Chef Propietario, Restaurante Milano</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}