// src/components/Landing/FeaturesSection.jsx
import { useState } from 'react';
import { useInView } from '../hooks/useInView';

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);
  const { ref, isInView } = useInView({ threshold: 0.2 });

  const features = [
    {
      id: 'qr-menu',
      icon: '📱',
      title: 'Menú Digital QR',
      description: 'Los clientes escanean el código QR y acceden al menú completo desde su celular, sin necesidad de menús físicos.',
      benefits: [
        'Actualización en tiempo real',
        'Sin costos de impresión',
        'Experiencia sin contacto',
        'Disponible 24/7'
      ],
      demo: 'qr-scan',
      highlight: 'Sin menús físicos'
    },
    {
      id: 'cart-system',
      icon: '🛒',
      title: 'Carrito de Compras',
      description: 'Sistema intuitivo que permite a los clientes seleccionar productos, personalizar cantidad y realizar pedidos directamente.',
      benefits: [
        'Agregar múltiples productos',
        'Modificar cantidades fácilmente',
        'Ver total en tiempo real',
        'Notas especiales por producto'
      ],
      demo: 'cart-demo',
      highlight: 'Pedidos más grandes'
    },
    {
      id: 'digital-orders',
      icon: '📋',
      title: 'Comandas Digitales',
      description: 'Los pedidos llegan automáticamente a la cocina con todos los detalles, número de mesa y especificaciones del cliente.',
      benefits: [
        'Sin errores de transcripción',
        'Organización automática',
        'Estados de preparación',
        'Tiempo estimado por plato'
      ],
      demo: 'order-flow',
      highlight: 'Cocina organizada'
    },
    {
      id: 'reservations',
      icon: '📅',
      title: 'Sistema de Reservas',
      description: 'Los clientes pueden reservar mesas, seleccionar horarios disponibles y especificar el número de personas.',
      benefits: [
        'Reservas 24/7 online',
        'Gestión automática de mesas',
        'Confirmación por SMS/Email',
        'Reduce no-shows'
      ],
      demo: 'reservation-calendar',
      highlight: 'Mesas siempre llenas'
    },
    {
      id: 'payments',
      icon: '💳',
      title: 'Pagos Integrados',
      description: 'Procesamiento de pagos seguro con múltiples métodos: tarjetas, transferencias y billeteras digitales.',
      benefits: [
        'Pagos seguros',
        'Múltiples métodos',
        'Propinas incluidas',
        'Conciliación automática'
      ],
      demo: 'payment-flow',
      highlight: 'Pagos sin fricción'
    },
    {
      id: 'analytics',
      icon: '📊',
      title: 'Dashboard Analítico',
      description: 'Reportes detallados de ventas, productos más pedidos, horarios pico y rendimiento del restaurante.',
      benefits: [
        'Métricas en tiempo real',
        'Productos más vendidos',
        'Análisis de horarios',
        'Reportes financieros'
      ],
      demo: 'analytics-dashboard',
      highlight: 'Decisiones inteligentes'
    }
  ];

  const demos = {
    'qr-scan': (
      <div className="demo-qr">
        <div className="qr-code">
          <div className="qr-pattern"></div>
        </div>
        <div className="scan-animation"></div>
        <div className="phone-preview">
          <span>Menú cargando...</span>
        </div>
      </div>
    ),
    'cart-demo': (
      <div className="demo-cart">
        <div className="cart-items">
          <div className="cart-item">Café Americano × 2</div>
          <div className="cart-item">Sandwich Club × 1</div>
        </div>
        <div className="cart-total">Total: $8.700</div>
      </div>
    ),
    'order-flow': (
      <div className="demo-order">
        <div className="order-steps">
          <div className="step active">📱 Pedido recibido</div>
          <div className="step">👨‍🍳 En preparación</div>
          <div className="step">✅ Listo</div>
        </div>
      </div>
    ),
    'reservation-calendar': (
      <div className="demo-calendar">
        <div className="calendar-grid">
          <div className="time-slot available">18:00</div>
          <div className="time-slot selected">19:00</div>
          <div className="time-slot occupied">20:00</div>
        </div>
      </div>
    ),
    'payment-flow': (
      <div className="demo-payment">
        <div className="payment-methods">
          <div className="method">💳 Tarjeta</div>
          <div className="method">📱 Transferencia</div>
          <div className="method">💰 Efectivo</div>
        </div>
      </div>
    ),
    'analytics-dashboard': (
      <div className="demo-analytics">
        <div className="chart-bars">
          <div className="bar" style={{height: '60%'}}></div>
          <div className="bar" style={{height: '80%'}}></div>
          <div className="bar" style={{height: '45%'}}></div>
        </div>
        <div className="metrics">📈 +25% ventas</div>
      </div>
    )
  };

  return (
    <section id="features" className="features-section" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <span className="badge-icon">⚡</span>
            <span>Funcionalidades</span>
          </div>
          
          <h2 className="section-title">
            Todo lo que necesitas para{' '}
            <span className="highlight">modernizar tu restaurante</span>
          </h2>
          
          <p className="section-description">
            Una plataforma completa que integra todas las herramientas necesarias 
            para brindar una experiencia digital excepcional a tus clientes.
          </p>
        </div>

        <div className="features-container">
          {/* Features Navigation */}
          <div className="features-nav">
            {features.map((feature, index) => (
              <button
                key={feature.id}
                className={`feature-nav-item ${activeFeature === index ? 'active' : ''}`}
                onClick={() => setActiveFeature(index)}
              >
                <div className="nav-item-icon">{feature.icon}</div>
                <div className="nav-item-content">
                  <h4 className="nav-item-title">{feature.title}</h4>
                  <p className="nav-item-highlight">{feature.highlight}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Active Feature Display */}
          <div className="feature-display">
            <div className="feature-content">
              <div className="feature-header">
                <div className="feature-icon-large">
                  {features[activeFeature].icon}
                </div>
                <div className="feature-info">
                  <h3 className="feature-title">
                    {features[activeFeature].title}
                  </h3>
                  <p className="feature-description">
                    {features[activeFeature].description}
                  </p>
                </div>
              </div>

              <div className="feature-benefits">
                <h4 className="benefits-title">Beneficios clave:</h4>
                <ul className="benefits-list">
                  {features[activeFeature].benefits.map((benefit, index) => (
                    <li key={index} className="benefit-item">
                      <span className="benefit-icon">✅</span>
                      <span className="benefit-text">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="feature-demo">
              <div className="demo-container">
                {demos[features[activeFeature].demo]}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="features-stats">
          <div className="stat-item">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">< 3s</div>
            <div className="stat-label">Tiempo de carga</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">24/7</div>
            <div className="stat-label">Soporte</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">SSL</div>
            <div className="stat-label">Seguridad</div>
          </div>
        </div>

        {/* Feature Grid (Alternative View) */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={feature.id}
              className={`feature-card ${isInView ? 'animate-in' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="card-header">
                <div className="card-icon">{feature.icon}</div>
                <div className="card-badge">{feature.highlight}</div>
              </div>
              
              <h3 className="card-title">{feature.title}</h3>
              <p className="card-description">{feature.description}</p>
              
              <div className="card-benefits">
                {feature.benefits.slice(0, 2).map((benefit, i) => (
                  <div key={i} className="card-benefit">
                    <span className="benefit-check">✓</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              
              <button 
                className="card-action"
                onClick={() => setActiveFeature(index)}
              >
                Ver Demo
                <span className="action-arrow">→</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}