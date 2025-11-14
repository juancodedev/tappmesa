// src/components/Landing/v2/Navbar.jsx
import React from 'react';
import { Coffee, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative bg-gradient-to-br from-primary-500 to-secondary-500 p-2.5 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform">
                <Coffee className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              CaféMesa
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <a
              href="#caracteristicas"
              className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100/50 rounded-lg transition-all font-medium text-sm"
            >
              Características
            </a>
            <a
              href="#como-funciona"
              className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100/50 rounded-lg transition-all font-medium text-sm"
            >
              Cómo Funciona
            </a>
            <a
              href="#testimonios"
              className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100/50 rounded-lg transition-all font-medium text-sm"
            >
              Testimonios
            </a>
            <a
              href="#precios"
              className="px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100/50 rounded-lg transition-all font-medium text-sm"
            >
              Precios
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <button className="px-5 py-2.5 text-gray-700 hover:text-primary-600 hover:bg-gray-100/50 rounded-xl transition-all font-semibold text-sm">
              Iniciar Sesión
            </button>
            <button className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:shadow-xl hover:shadow-primary-500/20 hover:scale-105 transition-all font-semibold text-sm">
              Prueba Gratis
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-700 hover:bg-gray-100/50 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200/50 animate-fade-in">
            <div className="flex flex-col gap-2">
              <a
                href="#caracteristicas"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-gray-100/50 rounded-lg transition-all font-medium"
              >
                Características
              </a>
              <a
                href="#como-funciona"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-gray-100/50 rounded-lg transition-all font-medium"
              >
                Cómo Funciona
              </a>
              <a
                href="#testimonios"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-gray-100/50 rounded-lg transition-all font-medium"
              >
                Testimonios
              </a>
              <a
                href="#precios"
                onClick={() => setIsMenuOpen(false)}
                className="px-4 py-3 text-gray-700 hover:text-primary-600 hover:bg-gray-100/50 rounded-lg transition-all font-medium"
              >
                Precios
              </a>
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200/50">
                <button className="px-4 py-3 text-gray-700 hover:bg-gray-100/50 rounded-lg transition-all font-semibold text-center">
                  Iniciar Sesión
                </button>
                <button className="px-4 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold">
                  Prueba Gratis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
