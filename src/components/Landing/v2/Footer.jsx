// src/components/Landing/v2/Footer.jsx
import React from 'react';
import { Coffee, Facebook, Instagram, Twitter, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary-500 text-cream-50 py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-terracotta-500 p-2 rounded-lg">
                <Coffee className="w-6 h-6 text-cream-50" />
              </div>
              <span className="text-xl font-bold">TappMesa</span>
            </div>
            <p className="text-cream-200 text-sm">
              Moderniza tu cafetería con tecnología de pedidos digitales. Más eficiencia, más ventas, clientes más felices.
            </p>
          </div>

          {/* Producto */}
          <div>
            <h4 className="font-semibold mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-cream-200">
              <li><a href="#" className="hover:text-terracotta-400 transition-colors">Características</a></li>
              <li><a href="#" className="hover:text-terracotta-400 transition-colors">Precios</a></li>
              <li><a href="#" className="hover:text-terracotta-400 transition-colors">Demo</a></li>
              <li><a href="#" className="hover:text-terracotta-400 transition-colors">Integraciones</a></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm text-cream-200">
              <li><a href="#" className="hover:text-terracotta-400 transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-terracotta-400 transition-colors">Guías</a></li>
              <li><a href="#" className="hover:text-terracotta-400 transition-colors">Soporte</a></li>
              <li><a href="#" className="hover:text-terracotta-400 transition-colors">API Docs</a></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-cream-200">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:hola@tappmesa.com" className="hover:text-terracotta-400 transition-colors">
                  hola@tappmesa.com
                </a>
              </li>
              <li className="flex gap-3 mt-4">
                <a href="#" className="hover:text-terracotta-400 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-terracotta-400 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-terracotta-400 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-cream-50/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-cream-200">
          <p>© 2025 TappMesa. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-terracotta-400 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-terracotta-400 transition-colors">Términos</a>
            <a href="#" className="hover:text-terracotta-400 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
