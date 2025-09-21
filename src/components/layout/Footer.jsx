// src/components/layout/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Producto',
      links: [
        { label: 'Características', href: '/#features' },
        { label: 'Precios', href: '/#pricing' },
        { label: 'Demo', href: '/#demo' },
        { label: 'Casos de Uso', href: '/casos-de-uso' }
      ]
    },
    {
      title: 'Recursos',
      links: [
        { label: 'Centro de Ayuda', href: '/help' },
        { label: 'Guías', href: '/help/guides' },
        { label: 'API', href: '/developers' },
        { label: 'Status', href: '/status' }
      ]
    },
    {
      title: 'Empresa',
      links: [
        { label: 'Acerca de', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Carreras', href: '/careers' },
        { label: 'Contacto', href: '/contact' }
      ]
    },
    {
      title: 'Legal',
      links: [
        { label: 'Términos de Servicio', href: '/terms' },
        { label: 'Política de Privacidad', href: '/privacy' },
        { label: 'Cookies', href: '/cookies' },
        { label: 'GDPR', href: '/gdpr' }
      ]
    }
  ];

  const socialLinks = [
    { 
      name: 'Facebook', 
      href: 'https://facebook.com/tappmesa', 
      icon: '📘',
      color: '#1877f2'
    },
    { 
      name: 'Instagram', 
      href: 'https://instagram.com/tappmesa', 
      icon: '📷',
      color: '#e4405f'
    },
    { 
      name: 'Twitter', 
      href: 'https://twitter.com/tappmesa', 
      icon: '🐦',
      color: '#1da1f2'
    },
    { 
      name: 'LinkedIn', 
      href: 'https://linkedin.com/company/tappmesa', 
      icon: '💼',
      color: '#0077b5'
    },
    { 
      name: 'YouTube', 
      href: 'https://youtube.com/tappmesa', 
      icon: '📺',
      color: '#ff0000'
    }
  ];

  const handleLinkClick = (href) => {
    if (href.startsWith('/#')) {
      const element = document.querySelector(href.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        {/* Main Footer Content */}
        <div className="footer-main">
          {/* Brand Section */}
          <div className="footer-brand">
            <Logo size="medium" linkTo="/" />
            <p className="footer-description">
              La plataforma líder para digitalizar restaurantes en Chile. 
              Más de 500 establecimientos confían en TappMesa para mejorar 
              la experiencia de sus clientes.
            </p>
            
            <div className="footer-contact">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <a href="mailto:hola@tappmesa.com">hola@tappmesa.com</a>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <a href="tel:+56912345678">+56 9 1234 5678</a>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span>Santiago, Chile</span>
              </div>
            </div>

            <div className="footer-social">
              <span className="social-title">Síguenos:</span>
              <div className="social-links">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    title={social.name}
                    style={{ '--hover-color': social.color }}
                  >
                    <span className="social-icon">{social.icon}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Links Sections */}
          <div className="footer-links">
            {footerSections.map((section) => (
              <div key={section.title} className="footer-section">
                <h3 className="section-title">{section.title}</h3>
                <ul className="section-links">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('/#') ? (
                        <button
                          onClick={() => handleLinkClick(link.href)}
                          className="footer-link"
                        >
                          {link.label}
                        </button>
                      ) : (
                        <Link to={link.href} className="footer-link">
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="footer-newsletter">
          <div className="newsletter-content">
            <div className="newsletter-info">
              <h3>Mantente actualizado</h3>
              <p>Recibe las últimas novedades, consejos y actualizaciones de TappMesa</p>
            </div>
            <form className="newsletter-form">
              <div className="newsletter-input-group">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className="newsletter-input"
                  required
                />
                <button type="submit" className="newsletter-button">
                  Suscribirse
                </button>
              </div>
              <p className="newsletter-disclaimer">
                Al suscribirte, aceptas recibir emails de marketing. 
                Puedes cancelar en cualquier momento.
              </p>
            </form>
          </div>
        </div>

        {/* Awards and Certifications */}
        <div className="footer-awards">
          <div className="awards-content">
            <span className="awards-title">Reconocimientos:</span>
            <div className="awards-list">
              <div className="award-item">
                <span className="award-icon">🏆</span>
                <span className="award-text">Startup del Año 2024</span>
              </div>
              <div className="award-item">
                <span className="award-icon">🔒</span>
                <span className="award-text">Certificado SSL</span>
              </div>
              <div className="award-item">
                <span className="award-icon">⭐</span>
                <span className="award-text">4.9/5 Satisfacción</span>
              </div>
              <div className="award-item">
                <span className="award-icon">🇨🇱</span>
                <span className="award-text">Empresa Chilena</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <div className="footer-copyright">
              <span>© {currentYear} TappMesa. Todos los derechos reservados.</span>
              <span className="footer-made-with">
                Hecho con ❤️ en Chile
              </span>
            </div>
            
            <div className="footer-bottom-links">
              <Link to="/terms" className="bottom-link">Términos</Link>
              <Link to="/privacy" className="bottom-link">Privacidad</Link>
              <Link to="/cookies" className="bottom-link">Cookies</Link>
              <button className="bottom-link language-selector">
                🌐 Español
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button 
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Volver arriba"
      >
        ↑
      </button>
    </footer>
  );
};

export default Footer;