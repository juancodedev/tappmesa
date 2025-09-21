// src/components/UI/Footer.jsx
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Simular suscripción
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Producto',
      links: [
        { label: 'Características', href: '#features' },
        { label: 'Precios', href: '#pricing' },
        { label: 'Demo', href: '#contact' },
        { label: 'Integraciones', href: '/integraciones' },
        { label: 'API', href: '/api-docs' },
        { label: 'Actualizaciones', href: '/changelog' }
      ]
    },
    {
      title: 'Soluciones',
      links: [
        { label: 'Restaurantes', href: '/restaurantes' },
        { label: 'Cafeterías', href: '/cafeterias' },
        { label: 'Bares', href: '/bares' },
        { label: 'Cadenas', href: '/cadenas' },
        { label: 'Food Trucks', href: '/food-trucks' },
        { label: 'Casos de Éxito', href: '/casos-exito' }
      ]
    },
    {
      title: 'Recursos',
      links: [
        { label: 'Blog', href: '/blog' },
        { label: 'Guías', href: '/guias' },
        { label: 'Centro de Ayuda', href: '/ayuda' },
        { label: 'Webinars', href: '/webinars' },
        { label: 'Plantillas', href: '/plantillas' },
        { label: 'ROI Calculator', href: '/calculadora-roi' }
      ]
    },
    {
      title: 'Empresa',
      links: [
        { label: 'Sobre Nosotros', href: '/nosotros' },
        { label: 'Carreras', href: '/carreras' },
        { label: 'Prensa', href: '/prensa' },
        { label: 'Partners', href: '/partners' },
        { label: 'Afiliados', href: '/afiliados' },
        { label: 'Contacto', href: '/contacto' }
      ]
    }
  ];

  const socialLinks = [
    { 
      name: 'LinkedIn', 
      icon: '💼', 
      url: 'https://linkedin.com/company/tappmesa',
      color: '#0077b5'
    },
    { 
      name: 'Twitter', 
      icon: '🐦', 
      url: 'https://twitter.com/tappmesa',
      color: '#1da1f2'
    },
    { 
      name: 'Instagram', 
      icon: '📷', 
      url: 'https://instagram.com/tappmesa',
      color: '#e4405f'
    },
    { 
      name: 'YouTube', 
      icon: '📺', 
      url: 'https://youtube.com/tappmesa',
      color: '#ff0000'
    },
    { 
      name: 'TikTok', 
      icon: '🎵', 
      url: 'https://tiktok.com/@tappmesa',
      color: '#000000'
    }
  ];

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="footer">
      {/* Newsletter Section */}
      <div className="newsletter-section">
        <div className="container">
          <div className="newsletter-content">
            <div className="newsletter-text">
              <h3>Mantente al día con TappMesa</h3>
              <p>Recibe tips, actualizaciones y casos de éxito directamente en tu email</p>
            </div>
            
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <div className="newsletter-input-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="newsletter-input"
                  required
                />
                <button type="submit" className="newsletter-btn">
                  {isSubscribed ? '✅' : 'Suscribirse'}
                </button>
              </div>
              
              {isSubscribed && (
                <div className="newsletter-success">
                  ¡Gracias! Te has suscrito exitosamente.
                </div>
              )}
              
              <p className="newsletter-disclaimer">
                Sin spam. Puedes darte de baja en cualquier momento.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-content">
            {/* Company Info */}
            <div className="footer-company">
              <div className="footer-logo">
                <span className="logo-icon">🍽️</span>
                <span className="logo-text">TappMesa</span>
              </div>
              
              <p className="company-description">
                La plataforma líder en digitalización de restaurantes en Latinoamérica. 
                Transformamos la experiencia gastronómica con tecnología de vanguardia.
              </p>
              
              <div className="company-stats">
                <div className="stat">
                  <strong>500+</strong>
                  <span>Restaurantes</span>
                </div>
                <div className="stat">
                  <strong>98%</strong>
                  <span>Satisfacción</span>
                </div>
                <div className="stat">
                  <strong>24/7</strong>
                  <span>Soporte</span>
                </div>
              </div>

              <div className="social-links">
                <div className="social-title">Síguenos:</div>
                <div className="social-icons">
                  {socialLinks.map((social) => (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="social-link"
                      style={{ '--social-color': social.color }}
                      title={social.name}
                    >
                      <span className="social-icon">{social.icon}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="footer-links">
              {footerSections.map((section) => (
                <div key={section.title} className="footer-section">
                  <h4 className="section-title">{section.title}</h4>
                  <ul className="section-links">
                    {section.links.map((link) => (
                      <li key={link.label}>
                        <a 
                          href={link.href}
                          className="footer-link"
                          onClick={(e) => {
                            if (link.href.startsWith('#')) {
                              e.preventDefault();
                              const element = document.querySelector(link.href);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth' });
                              }
                            }
                          }}
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="footer-contact">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <div className="contact-info">
                <strong>Oficina Principal</strong>
                <span>Av. Providencia 1208, Santiago, Chile</span>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <div className="contact-info">
                <strong>Teléfono</strong>
                <span>+56 2 1234 5678</span>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon">💬</div>
              <div className="contact-info">
                <strong>WhatsApp</strong>
                <span>+56 9 8765 4321</span>
              </div>
            </div>
            
            <div className="contact-item">
              <div className="contact-icon">📧</div>
              <div className="contact-info">
                <strong>Email</strong>
                <span>hola@tappmesa.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <div className="footer-legal">
              <p>&copy; {currentYear} TappMesa. Todos los derechos reservados.</p>
              <div className="legal-links">
                <a href="/terms" className="legal-link">Términos de Servicio</a>
                <a href="/privacy" className="legal-link">Política de Privacidad</a>
                <a href="/cookies" className="legal-link">Política de Cookies</a>
                <a href="/security" className="legal-link">Seguridad</a>
              </div>
            </div>

            <div className="footer-meta">
              <div className="certifications">
                <div className="cert-item">
                  <span className="cert-icon">🛡️</span>
                  <span>ISO 27001</span>
                </div>
                <div className="cert-item">
                  <span className="cert-icon">🔒</span>
                  <span>SSL Seguro</span>
                </div>
                <div className="cert-item">
                  <span className="cert-icon">🏆</span>
                  <span>Mejor App 2024</span>
                </div>
              </div>

              <button className="back-to-top" onClick={scrollToTop}>
                <span className="back-to-top-icon">↑</span>
                <span className="back-to-top-text">Volver arriba</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}