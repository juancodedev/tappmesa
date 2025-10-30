// src/components/Landing/v2/Navbar.jsx
import React from 'react';
import { Coffee } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-cream-50/80 backdrop-blur-lg border-b border-cream-300/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-2 rounded-lg">
              <Coffee className="w-6 h-6 text-cream-50" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              TappMesa
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#caracteristicas"
              className="text-coffee-900 hover:text-primary-500 transition-colors font-medium"
            >
              Características
            </a>
            <a
              href="#como-funciona"
              className="text-coffee-900 hover:text-primary-500 transition-colors font-medium"
            >
              Cómo Funciona
            </a>
            <a
              href="#testimonios"
              className="text-coffee-900 hover:text-primary-500 transition-colors font-medium"
            >
              Testimonios
            </a>
            <a
              href="#precios"
              className="text-coffee-900 hover:text-primary-500 transition-colors font-medium"
            >
              Precios
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <button className="hidden sm:inline-flex px-4 py-2 text-coffee-900 hover:bg-cream-200 rounded-lg transition-colors font-medium">
              Iniciar Sesión
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-cream-50 rounded-lg hover:shadow-coffee-lg transition-all font-medium">
              Prueba Gratis
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
