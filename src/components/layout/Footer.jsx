// src/pages/landing/components/Footer.jsx - Versión con Tailwind
import React from 'react';
import { Link } from 'react-router-dom';

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
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-5 gap-8 py-16">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-white text-2xl">
                🍽️
              </div>
              <div>
                <div className="text-2xl font-bold">TappMesa</div>
                <div className="text-sm text-gray-400">Digital Restaurant</div>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6 leading-relaxed">
              La plataforma líder para digitalizar restaurantes en Chile. 
              Más de 500 establecimientos confían en TappMesa para mejorar 
              la experiencia de sus clientes.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-lg">📧</span>
                <a href="mailto:hola@tappmesa.com" className="text-gray-300 hover:text-primary-400 transition-colors">
                  hola@tappmesa.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">📞</span>
                <a href="tel:+56912345678" className="text-gray-300 hover:text-primary-400 transition-colors">
                  +56 9 1234 5678
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">📍</span>
                <span className="text-gray-300">Santiago, Chile</span>
              </div>
            </div>

            <div>
              <span className="text-white font-semibold mb-3 block">Síguenos:</span>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
                    title={social.name}
                  >
                    <span className="text-lg">{social.icon}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith('/#') ? (
                      <button
                        onClick={() => handleLinkClick(link.href)}
                        className="text-gray-300 hover:text-primary-400 transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <Link 
                        to={link.href} 
                        className="text-gray-300 hover:text-primary-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Subscription */}
        <div className="border-t border-gray-800 py-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Mantente actualizado</h3>
              <p className="text-gray-300">Recibe las últimas novedades, consejos y actualizaciones de TappMesa</p>
            </div>
            <form className="flex gap-3">
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <button 
                type="submit" 
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap touch-target"
              >
                Suscribirse
              </button>
            </form>
          </div>
          <p className="text-xs text-gray-400 mt-3 lg:text-right">
            Al suscribirte, aceptas recibir emails de marketing. Puedes cancelar en cualquier momento.
          </p>
        </div>

        {/* Awards and Certifications */}
        <div className="border-t border-gray-800 py-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <span className="text-white font-semibold">Reconocimientos:</span>
            <div className="flex flex-wrap gap-6">
              {[
                { icon: '🏆', text: 'Startup del Año 2024' },
                { icon: '🔒', text: 'Certificado SSL' },
                { icon: '⭐', text: '4.9/5 Satisfacción' },
                { icon: '🇨🇱', text: 'Empresa Chilena' }
              ].map((award, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-300">
                  <span className="text-lg">{award.icon}</span>
                  <span className="text-sm">{award.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="text-center lg:text-left">
              <span className="text-gray-400">© {currentYear} TappMesa. Todos los derechos reservados.</span>
              <div className="text-sm text-gray-500 mt-1">
                Hecho con ❤️ en Chile
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              <Link to="/terms" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                Términos
              </Link>
              <Link to="/privacy" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                Privacidad
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-primary-400 transition-colors text-sm">
                Cookies
              </Link>
              <button className="flex items-center gap-2 text-gray-400 hover:text-primary-400 transition-colors text-sm">
                🌐 Español
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button 
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Volver arriba"
      >
        ↑
      </button>
    </footer>
  );
};

export default Footer;