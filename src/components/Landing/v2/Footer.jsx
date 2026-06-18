// src/components/Landing/v2/Footer.jsx
import React from 'react';
import { Coffee, Mail } from 'lucide-react';

// Brand icons as inline SVGs — Lucide doesn't ship trademarked logos
const FacebookIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
  </svg>
);

const InstagramIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="17.5" cy="6.5" r="1.5" />
  </svg>
);

const TwitterIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-16 lg:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-br from-primary-500 to-secondary-500 rounded-xl blur-md opacity-50" />
                <div className="relative bg-linear-to-br from-primary-500 to-secondary-500 p-2.5 rounded-xl shadow-lg">
                  <Coffee className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-linear-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                TappMesa
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Moderniza tu cafetería con tecnología de pedidos digitales. Más eficiencia, más ventas, clientes más felices.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a href="https://facebook.com/tappmesa" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-800 hover:bg-linear-to-br hover:from-primary-600 hover:to-secondary-600 rounded-lg transition-all group">
                <FacebookIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a href="https://instagram.com/tappmesa" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-800 hover:bg-linear-to-br hover:from-primary-600 hover:to-secondary-600 rounded-lg transition-all group">
                <InstagramIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a href="https://twitter.com/tappmesa" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-800 hover:bg-linear-to-br hover:from-primary-600 hover:to-secondary-600 rounded-lg transition-all group">
                <TwitterIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a href="https://linkedin.com/company/tappmesa" target="_blank" rel="noopener noreferrer" className="p-2.5 bg-gray-800 hover:bg-linear-to-br hover:from-primary-600 hover:to-secondary-600 rounded-lg transition-all group">
                <LinkedinIcon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
            </div>
          </div>

          {/* Producto */}
          <div>
            <h4 className="font-bold text-lg mb-6">Producto</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#caracteristicas" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Características
                </a>
              </li>
              <li>
                <a href="#precios" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Precios
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Demo
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Integraciones
                </a>
              </li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-bold text-lg mb-6">Recursos</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Guías
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Soporte
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                  Documentación
                </a>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-bold text-lg mb-6">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-gray-400">
                <Mail className="w-5 h-5 text-primary-400 shrink-0" />
                <a href="mailto:hola@laventech.com" className="hover:text-primary-400 transition-colors">
                  hola@laventech.com
                </a>
              </li>
              <li className="text-gray-400">
                Santiago, Chile
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
          <p className="text-gray-400">
            © 2025 <span className="text-white font-semibold">TappMesa</span>. Todos los derechos reservados.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
              Privacidad
            </a>
            <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
              Términos
            </a>
            <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
