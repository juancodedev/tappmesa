// src/components/Landing/CTASection.jsx
import { useInView } from '../../hooks/useInView';

export default function CTASection({ 
  title, 
  description, 
  primaryAction, 
  secondaryAction, 
  showStats = false,
  theme = 'gradient' // 'gradient', 'dark', 'light'
}) {
  const { ref, isInView } = useInView({ threshold: 0.3 });

  const stats = [
    { number: '500+', label: 'Restaurantes activos' },
    { number: '98%', label: 'Satisfacción' },
    { number: '2.5M+', label: 'Pedidos procesados' },
    { number: '< 24h', label: 'Implementación' }
  ];

  const getThemeClass = () => {
    switch (theme) {
      case 'dark': return 'cta-section-dark';
      case 'light': return 'cta-section-light';
      default: return 'cta-section-gradient';
    }
  };

  return (
    <section className={`cta-section ${getThemeClass()}`} ref={ref}>
      <div className="cta-background">
        {theme === 'gradient' && (
          <>
            <div className="gradient-orb orb-1"></div>
            <div className="gradient-orb orb-2"></div>
            <div className="gradient-orb orb-3"></div>
          </>
        )}
        {theme === 'dark' && (
          <div className="stars-background">
            {Array.from({ length: 50 }, (_, i) => (
              <div 
                key={i} 
                className="star" 
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="container">
        <div className={`cta-content ${isInView ? 'animate-in' : ''}`}>
          <div className="cta-text">
            <h2 className="cta-title">{title}</h2>
            {description && (
              <p className="cta-description">{description}</p>
            )}
          </div>

          <div className="cta-actions">
            {primaryAction && (
              <button 
                className="cta-btn primary large"
                onClick={primaryAction.onClick}
              >
                <span className="btn-icon">🚀</span>
                {primaryAction.text}
                <span className="btn-glow"></span>
              </button>
            )}
            
            {secondaryAction && (
              <button 
                className="cta-btn secondary large"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.text}
              </button>
            )}
          </div>

          {showStats && (
            <div className="cta-stats">
              <div className="stats-grid">
                {stats.map((stat, index) => (
                  <div 
                    key={index}
                    className={`stat-item ${isInView ? 'animate-in' : ''}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="stat-number">{stat.number}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trust indicators */}
          <div className="cta-trust">
            <div className="trust-items">
              <div className="trust-item">
                <span className="trust-icon">✅</span>
                <span>Setup gratuito</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✅</span>
                <span>2 meses de prueba</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✅</span>
                <span>Soporte 24/7</span>
              </div>
              <div className="trust-item">
                <span className="trust-icon">✅</span>
                <span>Sin compromisos</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}