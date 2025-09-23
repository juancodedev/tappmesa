// src/pages/landing/components/Footer.jsx - Versión para Cafeterías
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Para tu Cafetería',
      links: [
        { label: 'Características', href: '/#features' },
        { label: 'Precios', href: '/#pricing' },
        { label: 'Demo', href: '/#demo' },
        { label: 'Casos de Éxito', href: '/casos-de-exito' }
      ]
    },
    {
      title: 'Recursos',
      links: [
        { label: 'Centro de Ayuda', href: '/help' },
        { label: 'Guías para Baristas', href: '/help/guides' },
        { label: 'Blog de Cafeterías', href: '/blog' },
        { label: 'Recetas Digitales', href: '/recetas' }
      ]
    },
    {
      title: 'Comunidad',
      links: [
        { label: 'Historia', href: '/about' },
        { label: 'Cafeterías Partner', href: '/partners' },
        { label: 'Trabajar con nosotros', href: '/careers' },
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
      name: 'Instagram', 
      href: 'https://instagram.com/tappmesa', 
      icon: '📷',
      color: '#e4405f'
    },
    { 
      name: 'Facebook', 
      href: 'https://facebook.com/tappmesa', 
      icon: '📘',
      color: '#1877f2'
    },
    { 
      name: 'TikTok', 
      href: 'https://tiktok.com/@tappmesa', 
      icon: '🎵',
      color: '#000000'
    },
    { 
      name: 'LinkedIn', 
      href: 'https://linkedin.com/company/tappmesa', 
      icon: '💼',
      color: '#0077b5'
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
    <footer className="bg-coffee-dark text-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-5 gap-8 py-16">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-500 rounded-xl flex items-center justify-center text-white text-2xl">
                ☕
              </div>
              <div>
                <div className="text-2xl font-bold">TappMesa</div>
                <div className="text-sm text-coffee-300">Para Cafeterías</div>
              </div>
            </div>
            
            <p className="text-coffee-200 mb-6 leading-relaxed">
              La plataforma favorita de las cafeterías chilenas. 
              Más de 200 establecimientos confían en TappMesa para crear 
              experiencias únicas y acogedoras para sus clientes.
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-lg">📧</span>
                <a href="mailto:cafeterias@tappmesa.com" className="text-coffee-200 hover:text-primary-400 transition-colors">
                  cafeterias@tappmesa.com
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">☕</span>
                <a href="tel:+56912345678" className="text-coffee-200 hover:text-primary-400 transition-colors">
                  +56 9 1234 5678
                </a>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">📍</span>
                <span className="text-coffee-200">Santiago, Chile</span>
              </div>
            </div>

            <div>
              <span className="text-white font-semibold mb-3 block">Conecta con nosotros:</span>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-coffee-700 hover:bg-coffee-600 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110"
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
                        className="text-coffee-200 hover:text-primary-400 transition-colors text-left"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a 
                        href={link.href} 
                        className="text-coffee-200 hover:text-primary-400 transition-colors"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter específico para cafeterías */}
        <div className="border-t border-coffee-700 py-8">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <span>☕</span>
                Café Semanal Digital
              </h3>
              <p className="text-coffee-200">Recibe tips, tendencias y novedades del mundo de las cafeterías digitales</p>
            </div>
            <form className="flex gap-3">
              <input
                type="email"
                placeholder="tu@cafeteria.com"
                className="flex-1 px-4 py-3 bg-coffee-700 border border-coffee-600 rounded-lg text-white placeholder-coffee-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          <p className="text-xs text-coffee-400 mt-3 lg:text-right">
            Tips semanales sobre cafeterías digitales. Sin spam, solo café y tecnología.
          </p>
        </div>

        {/* Certificaciones específicas para cafeterías */}
        <div className="border-t border-coffee-700 py-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <span className="text-white font-semibold flex items-center gap-2">
              <span>🏆</span>
              Reconocimientos:
            </span>
            <div className="flex flex-wrap gap-6">
              {[
                { icon: '☕', text: 'Mejor App para Cafeterías 2024' },
                { icon: '🔒', text: 'Datos Seguros SSL' },
                { icon: '⭐', text: '4.9/5 en Cafeterías' },
                { icon: '🇨🇱', text: 'Hecho en Chile' }
              ].map((award, index) => (
                <div key={index} className="flex items-center gap-2 text-coffee-200">
                  <span className="text-lg">{award.icon}</span>
                  <span className="text-sm">{award.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-coffee-700 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="text-center lg:text-left">
              <span className="text-coffee-300">© {currentYear} TappMesa. Creado con ❤️ para cafeterías chilenas.</span>
              <div className="text-sm text-coffee-400 mt-1 flex items-center gap-2">
                <span>☕</span>
                Digitalizando una taza a la vez
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              <a href="/terms" className="text-coffee-300 hover:text-primary-400 transition-colors text-sm">
                Términos
              </a>
              <a href="/privacy" className="text-coffee-300 hover:text-primary-400 transition-colors text-sm">
                Privacidad
              </a>
              <a href="/cookies" className="text-coffee-300 hover:text-primary-400 transition-colors text-sm">
                Cookies
              </a>
              <button className="flex items-center gap-2 text-coffee-300 hover:text-primary-400 transition-colors text-sm">
                🌐 Español
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button con tema de café */}
      <button 
        className="fixed bottom-6 right-6 w-12 h-12 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center text-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 z-50"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Volver arriba"
      >
        ☕
      </button>
    </footer>
  );
};

export default Footer;