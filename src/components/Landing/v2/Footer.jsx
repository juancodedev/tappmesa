// src/components/Landing/v2/Footer.jsx
import React from 'react';
import { Coffee, Facebook, Instagram, Twitter, Mail, Linkedin, Youtube } from 'lucide-react';

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
              <a href="#" className="p-2.5 bg-gray-800 hover:bg-linear-to-br hover:from-primary-600 hover:to-secondary-600 rounded-lg transition-all group">
                <Facebook className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a href="#" className="p-2.5 bg-gray-800 hover:bg-linear-to-br hover:from-primary-600 hover:to-secondary-600 rounded-lg transition-all group">
                <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a href="#" className="p-2.5 bg-gray-800 hover:bg-linear-to-br hover:from-primary-600 hover:to-secondary-600 rounded-lg transition-all group">
                <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </a>
              <a href="#" className="p-2.5 bg-gray-800 hover:bg-linear-to-br hover:from-primary-600 hover:to-secondary-600 rounded-lg transition-all group">
                <Linkedin className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
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
                <a href="mailto:hola@tappmesa.com" className="hover:text-primary-400 transition-colors">
                  hola@tappmesa.com
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
