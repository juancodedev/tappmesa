import { useState } from 'react';
import { Coffee, Mail, Phone, MapPin, ExternalLink, CheckCircle } from 'lucide-react';

const Footer = () => {
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [email, setEmail] = useState('');
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Para tu Cafetería',
      links: [
        { label: 'Características', href: '/#features', description: 'Funciones específicas' },
        { label: 'Precios', href: '/#pricing', description: 'Planes flexibles' },
        { label: 'Demo Interactiva', href: '/#demo', description: 'Prueba la experiencia' },
        { label: 'Testimonios', href: '/#testimonials', description: 'Casos de éxito reales' },
        { label: 'Registro Gratis', href: '/register', description: 'Comienza ya' }
      ]
    },
    {
      title: 'Recursos',
      links: [
        { label: 'Centro de Ayuda', href: '/help', description: 'Soporte completo' },
        { label: 'Guía del Barista Digital', href: '/guia-barista', description: 'Capacitación gratuita' },
        { label: 'Blog Cafetero', href: '/blog', description: 'Tips y tendencias' },
        { label: 'Recetas Digitales', href: '/recetas', description: 'Menús optimizados' },
        { label: 'API Developers', href: '/api', description: 'Integraciones' }
      ]
    },
    {
      title: 'Comunidad',
      links: [
        { label: 'Nuestra Historia', href: '/about', description: 'Quiénes somos' },
        { label: 'Cafeterías Partner', href: '/partners', description: 'Red de aliados' },
        { label: 'Programa de Referidos', href: '/referidos', description: 'Gana recompensas' },
        { label: 'Eventos y Talleres', href: '/eventos', description: 'Capacitación presencial' },
        { label: 'Trabaja con Nosotros', href: '/careers', description: 'Únete al equipo' }
      ]
    },
    {
      title: 'Soporte',
      links: [
        { label: 'Contacto Directo', href: '/contact', description: 'Habla con un experto' },
        { label: 'Chat en Vivo', href: '/chat', description: 'Ayuda inmediata' },
        { label: 'Estado del Sistema', href: '/status', description: 'Monitoreo en tiempo real' },
        { label: 'Solicitar Función', href: '/feature-request', description: 'Mejoras sugeridas' },
        { label: 'Reportar Problema', href: '/bug-report', description: 'Soporte técnico' }
      ]
    }
  ];

  const socialLinks = [
    { 
      name: 'Instagram', 
      href: 'https://instagram.com/tappmesa_chile', 
      icon: '📷',
      color: '#e4405f',
      followers: '12.5K'
    },
    { 
      name: 'Facebook', 
      href: 'https://facebook.com/TappMesaChile', 
      icon: '📘',
      color: '#1877f2',
      followers: '8.2K'
    },
    { 
      name: 'TikTok', 
      href: 'https://tiktok.com/@tappmesa_chile', 
      icon: '🎵',
      color: '#000000',
      followers: '15.8K'
    },
    { 
      name: 'LinkedIn', 
      href: 'https://linkedin.com/company/tappmesa-chile', 
      icon: '💼',
      color: '#0077b5',
      followers: '2.1K'
    },
    { 
      name: 'YouTube', 
      href: 'https://youtube.com/@TappMesaChile', 
      icon: '📺',
      color: '#ff0000',
      followers: '5.3K'
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

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    // Simular envío
    setEmailSubmitted(true);
    setTimeout(() => {
      setEmailSubmitted(false);
      setEmail('');
    }, 3000);
  };

  return (
    <footer className="bg-coffee-dark text-coffee-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-linear-to-br from-coffee-900 via-coffee-800 to-coffee-900"></div>
      <div className="absolute top-10 left-10 text-6xl opacity-5 animate-float">☕</div>
      <div className="absolute bottom-20 right-20 text-4xl opacity-5 animate-float">🥐</div>
      <div className="absolute top-40 right-10 text-5xl opacity-5 animate-float">⭐</div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Main Footer Content */}
        <div className="grid lg:grid-cols-5 gap-8 py-16">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-linear-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-coffee-100 text-2xl shadow-lg">
                ☕
              </div>
              <div>
                <div className="text-3xl font-bold">TappMesa</div>
                <div className="text-sm text-primary-300 font-medium">Digitaliza tu Cafetería</div>
              </div>
            </div>
            
            <p className="text-coffee-200 mb-6 leading-relaxed text-lg">
              La plataforma #1 para cafeterías chilenas. 
              <span className="text-primary-300 font-semibold"> Más de 250 establecimientos</span> confían 
              en TappMesa para crear experiencias digitales únicas y acogedoras.
            </p>

            {/* Stats destacados */}
            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-coffee-800/50 rounded-lg border border-coffee-700">
              <div className="text-center">
                <div className="text-xl font-bold text-primary-400">250+</div>
                <div className="text-xs text-coffee-300">Cafeterías</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary-400">45k+</div>
                <div className="text-xs text-coffee-300">Órdenes/mes</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-primary-400">4.9★</div>
                <div className="text-xs text-coffee-300">Satisfacción</div>
              </div>
            </div>
            
            {/* Contact info mejorado */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-coffee-800/30 rounded-lg hover:bg-coffee-800/50 transition-colors">
                <Mail className="h-5 w-5 text-primary-400" />
                <div>
                  <a 
                    href="mailto:cafeterias@tappmesa.cl" 
                    className="text-coffee-200 hover:text-primary-400 transition-colors font-medium"
                  >
                    cafeterias@tappmesa.cl
                  </a>
                  <div className="text-xs text-coffee-400">Soporte especializado en cafeterías</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-coffee-800/30 rounded-lg hover:bg-coffee-800/50 transition-colors">
                <Phone className="h-5 w-5 text-primary-400" />
                <div>
                  <a 
                    href="tel:+56912345678" 
                    className="text-coffee-200 hover:text-primary-400 transition-colors font-medium"
                  >
                    +56 9 1234 5678
                  </a>
                  <div className="text-xs text-coffee-400">Lun-Vie 9:00-18:00, Sáb 9:00-14:00</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-coffee-800/30 rounded-lg">
                <MapPin className="h-5 w-5 text-primary-400" />
                <div>
                  <span className="text-coffee-200 font-medium">Santiago, Chile</span>
                  <div className="text-xs text-coffee-400">Creado con ❤️ para cafeterías chilenas</div>
                </div>
              </div>
            </div>

            {/* Social media mejorado */}
            <div>
              <span className="text-coffee-100 font-semibold mb-4 block flex items-center gap-2">
                <span>🌐</span>
                Síguenos en Redes Sociales:
              </span>
              <div className="flex gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative w-12 h-12 bg-coffee-700 hover:bg-coffee-600 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 "
                    title={`${social.name} - ${social.followers} seguidores`}
                  >
                    <span className="text-lg group-hover:scale-110 transition-transform">{social.icon}</span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 bg-coffee-900 text-coffee-100 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {social.followers}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Links Sections mejoradas */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-coffee-100 font-bold mb-4 flex items-center gap-2">
                {section.title === 'Para tu Cafetería' && '☕'}
                {section.title === 'Recursos' && '📚'}
                {section.title === 'Comunidad' && '👥'}
                {section.title === 'Soporte' && '🛠️'}
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label} className="group">
                    {link.href.startsWith('/#') ? (
                      <button
                        onClick={() => handleLinkClick(link.href)}
                        className="text-coffee-200 hover:text-primary-400 transition-colors text-left w-full group-hover:translate-x-1 transition-transform duration-200"
                        title={link.description}
                      >
                        <div className="font-medium">{link.label}</div>
                        <div className="text-xs text-coffee-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {link.description}
                        </div>
                      </button>
                    ) : (
                      <a 
                        href={link.href} 
                        className="text-coffee-200 hover:text-primary-400 transition-colors block group-hover:translate-x-1 transition-transform duration-200"
                        title={link.description}
                      >
                        <div className="font-medium">{link.label}</div>
                        <div className="text-xs text-coffee-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          {link.description}
                        </div>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter mejorado específico para cafeterías */}
        <div className="border-t border-coffee-700 py-8">
          <div className="bg-linear-to-r from-coffee-800/50 to-primary-900/20 rounded-2xl p-6 border border-coffee-600">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-coffee-100 mb-3 flex items-center gap-3">
                  <span className="text-3xl">☕</span>
                  <div>
                    <div>Café Digital Semanal</div>
                    <div className="text-sm text-primary-300 font-normal">Newsletter exclusivo para cafeteros</div>
                  </div>
                </h3>
                <p className="text-coffee-200 mb-2">
                  Tips, tendencias y novedades del mundo de las cafeterías digitales. 
                  <span className="text-primary-300 font-semibold"> +5,000 dueños suscritos.</span>
                </p>
                <div className="text-sm text-coffee-400">
                  ✨ Casos de éxito • 📊 Métricas del sector • 🚀 Nuevas funciones
                </div>
              </div>
              
              <div>
                {!emailSubmitted ? (
                  <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@cafeteria.com"
                      className="flex-1 px-4 py-3 bg-coffee-700 border border-coffee-600 rounded-lg text-coffee-100 placeholder-coffee-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all form-input-enhanced"
                      required
                    />
                    <button 
                      type="submit" 
                      className="bg-primary-500 hover:bg-primary-600 text-coffee-100 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap "
                    >
                      Suscribirse Gratis
                    </button>
                  </form>
                ) : (
                  <div className="bg-green-600 text-coffee-100 p-4 rounded-lg flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 shrink-0" />
                    <div>
                      <div className="font-semibold">¡Bienvenido a la comunidad!</div>
                      <div className="text-sm opacity-90">Recibirás el primer café digital esta semana</div>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-coffee-400 mt-3">
                  🔒 Sin spam, solo contenido valioso. Cancela cuando quieras.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Certificaciones y reconocimientos específicos */}
        <div className="border-t border-coffee-700 py-8">
          <div className="text-center mb-6">
            <h4 className="text-coffee-100 font-bold text-lg mb-4 flex items-center justify-center gap-2">
              <span>🏆</span>
              Reconocimientos y Certificaciones
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: '☕', title: 'Mejor App para Cafeterías 2024', subtitle: 'Revista Cafés de Chile' },
                { icon: '🔒', title: 'Datos Seguros SSL', subtitle: 'Certificación ISO 27001' },
                { icon: '⭐', title: '4.9/5 Satisfacción', subtitle: 'Promedio de 250+ cafeterías' },
                { icon: '🇨🇱', title: 'Producto Chileno', subtitle: 'Hecho con orgullo nacional' }
              ].map((award, index) => (
                <div 
                  key={index} 
                  className="bg-coffee-800/30 p-4 rounded-lg text-center hover:bg-coffee-800/50 transition-colors"
                >
                  <div className="text-2xl mb-2">{award.icon}</div>
                  <div className="text-sm font-semibold text-coffee-100">{award.title}</div>
                  <div className="text-xs text-coffee-400 mt-1">{award.subtitle}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Bottom mejorado */}
        <div className="border-t border-coffee-700 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div className="text-center lg:text-left">
              <div className="flex items-center gap-2 text-coffee-300 mb-2">
                <Coffee className="h-4 w-4" />
                <span>© {currentYear} TappMesa SpA. Todos los derechos reservados.</span>
              </div>
              <div className="text-sm text-coffee-400 flex items-center gap-2">
                <span>☕</span>
                Digitalizando el café chileno, una taza a la vez
                <span className="mx-2">•</span>
                <span className="text-primary-400">RUT: 77.123.456-7</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-6">
              <a 
                href="/terms" 
                className="text-coffee-300 hover:text-primary-400 transition-colors text-sm flex items-center gap-1"
              >
                Términos <ExternalLink className="h-3 w-3" />
              </a>
              <a 
                href="/privacy" 
                className="text-coffee-300 hover:text-primary-400 transition-colors text-sm flex items-center gap-1"
              >
                Privacidad <ExternalLink className="h-3 w-3" />
              </a>
              <a 
                href="/cookies" 
                className="text-coffee-300 hover:text-primary-400 transition-colors text-sm flex items-center gap-1"
              >
                Cookies <ExternalLink className="h-3 w-3" />
              </a>
              <button className="flex items-center gap-2 text-coffee-300 hover:text-primary-400 transition-colors text-sm">
                🌐 Español (Chile)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top Button mejorado */}
      <button 
        className="fixed bottom-6 right-6 w-14 h-14 bg-linear-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-coffee-100 rounded-full flex items-center justify-center text-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 z-50 "
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Volver arriba con un café ☕"
      >
        <span className="animate-pulse">☕</span>
      </button>
    </footer>
  );
};

export default Footer;
