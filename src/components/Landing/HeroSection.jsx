// src/components/Landing/HeroSection.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function HeroSection({ onOpenRegister, onOpenLogin }) {
  const { isAuthenticated, user } = useAuth();
  const [currentStat, setCurrentStat] = useState(0);

  const stats = [
    { number: 50, text: "Menos tiempo de espera", suffix: "%" },
    { number: 30, text: "Aumento en ventas", suffix: "%" },
    { number: 100, text: "Sin contacto físico", suffix: "%" },
    { number: 500, text: "Restaurantes confían", suffix: "+" }
  ];

  // Animación de números contador
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % stats.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.offsetTop - headerHeight;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-gradient"></div>
        <div className="hero-pattern"></div>
      </div>

      <div className="hero-content">
        <div className="hero-text">
          <div className="hero-badge">
            <span className="badge-icon">🚀</span>
            <span>Nuevo: Sistema de Reservas Automáticas</span>
          </div>

          <h1 className="hero-title">
            Digitaliza tu Restaurante con{' '}
            <span className="brand-highlight">TappMesa</span>
          </h1>

          <p className="hero-description">
            La solución completa para modernizar tu restaurante: menús digitales, 
            comandas automáticas, sistema de reservas y carrito de compras integrado. 
            Todo desde el celular del cliente.
          </p>

          {/* Stats Dinámicos */}
          <div className="hero-stats">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className={`stat ${index === currentStat ? 'active' : ''}`}
              >
                <div className="stat-number">
                  <AnimatedNumber 
                    value={stat.number} 
                    suffix={stat.suffix}
                    isActive={index === currentStat}
                  />
                </div>
                <div className="stat-text">{stat.text}</div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hero-actions">
            {isAuthenticated ? (
              <div className="authenticated-actions">
                <h3>¡Bienvenido de vuelta, {user?.ownerName}!</h3>
                <a href="/dashboard" className="cta-btn primary large">
                  <span className="btn-icon">📊</span>
                  Ir al Dashboard
                </a>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="cta-btn secondary large"
                >
                  Ver Novedades
                </button>
              </div>
            ) : (
              <>
                <button 
                  onClick={onOpenRegister} 
                  className="cta-btn primary large pulse"
                >
                  <span className="btn-icon">🚀</span>
                  Comenzar Prueba Gratis
                  <span className="btn-badge">2 meses</span>
                </button>
                
                <button 
                  onClick={onOpenLogin} 
                  className="cta-btn secondary large"
                >
                  <span className="btn-icon">👤</span>
                  Ya tengo cuenta
                </button>
              </>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="trust-indicators">
            <div className="trust-item">
              <span className="trust-icon">✅</span>
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">✅</span>
              <span>2 meses gratis</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">✅</span>
              <span>Soporte incluido</span>
            </div>
            <div className="trust-item">
              <span className="trust-icon">✅</span>
              <span>Setup en 24 horas</span>
            </div>
          </div>

          {/* Social Proof */}
          <div className="social-proof">
            <p className="social-proof-text">
              Más de <strong>500 restaurantes</strong> ya transformaron su negocio
            </p>
            <div className="social-proof-logos">
              <div className="logo-placeholder">🍕</div>
              <div className="logo-placeholder">🍔</div>
              <div className="logo-placeholder">☕</div>
              <div className="logo-placeholder">🍽️</div>
              <div className="logo-placeholder">🥗</div>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="phone-mockup floating">
            <div className="phone-frame">
              <div className="phone-screen">
                <div className="screen-header">
                  <div className="screen-status">
                    <span className="signal">📶</span>
                    <span className="time">12:34</span>
                    <span className="battery">🔋</span>
                  </div>
                </div>
                
                <div className="screen-content">
                  <div className="app-header">
                    <h3>🍽️ TappMesa</h3>
                    <div className="table-badge">Mesa 5</div>
                  </div>
                  
                  <div className="menu-preview">
                    <div className="menu-category">
                      <span className="category-icon">☕</span>
                      <span>Bebidas</span>
                    </div>
                    
                    <div className="menu-items">
                      <div className="menu-item">
                        <div className="item-info">
                          <span className="item-name">Café Americano</span>
                          <span className="item-price">$2.500</span>
                        </div>
                        <button className="add-btn">+</button>
                      </div>
                      
                      <div className="menu-item">
                        <div className="item-info">
                          <span className="item-name">Cappuccino</span>
                          <span className="item-price">$3.200</span>
                        </div>
                        <button className="add-btn">+</button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="cart-preview">
                    <div className="cart-icon">🛒</div>
                    <span className="cart-count">2</span>
                    <span className="cart-total">$5.700</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="floating-elements">
            <div className="floating-card order-card">
              <div className="card-icon">📋</div>
              <div className="card-text">
                <strong>Nuevo Pedido</strong>
                <small>Mesa 3 - $12.500</small>
              </div>
            </div>
            
            <div className="floating-card notification-card">
              <div className="card-icon">🔔</div>
              <div className="card-text">
                <strong>Pedido Listo</strong>
                <small>Mesa 7</small>
              </div>
            </div>
            
            <div className="floating-card analytics-card">
              <div className="card-icon">📈</div>
              <div className="card-text">
                <strong>+25% ventas</strong>
                <small>Este mes</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="scroll-indicator">
        <button 
          onClick={() => scrollToSection('features')}
          className="scroll-btn"
          aria-label="Scroll to features"
        >
          <span className="scroll-text">Descubre más</span>
          <span className="scroll-arrow">↓</span>
        </button>
      </div>
    </section>
  );
}

// Componente para números animados
function AnimatedNumber({ value, suffix = '', isActive }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    let start = 0;
    const end = value;
    const duration = 1000; // 1 segundo
    const increment = end / (duration / 16); // 60fps

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, isActive]);

  return (
    <span className="animated-number">
      {displayValue}{suffix}
    </span>
  );
}