// src/pages/landing/components/Header.jsx - Versión para Cafeterías
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigationItems = [
    { label: 'Características', href: '#features', action: 'scroll' },
    { label: 'Cómo Funciona', href: '#how-it-works', action: 'scroll' },
    { label: 'Demo', href: '#demo-section', action: 'scroll' },
    { label: 'Precios', href: '#pricing', action: 'scroll' },
    { label: 'Testimonios', href: '#testimonials', action: 'scroll' }
  ];

  const handleNavClick = (item) => {
    if (item.action === 'scroll') {
      const element = document.querySelector(item.href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleRegister = () => {
    navigate('/register');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-cream-200' 
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-3 text-xl font-bold text-coffee-900 hover:text-primary-500 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white text-xl">
                ☕
              </div>
              <span>TappMesa</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigationItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleNavClick(item)}
                className="text-coffee-600 hover:text-primary-500 font-medium transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              onClick={handleLogin}
              className="text-coffee-600 hover:text-primary-500 font-medium px-4 py-2 transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={handleRegister}
              className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 touch-target"
            >
              Comenzar Gratis
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-cream-100 transition-colors touch-target"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span className={`w-5 h-0.5 bg-coffee-600 transition-all duration-300 ${
                isMobileMenuOpen ? 'rotate-45 translate-y-1' : ''
              }`}></span>
              <span className={`w-5 h-0.5 bg-coffee-600 my-1 transition-opacity duration-300 ${
                isMobileMenuOpen ? 'opacity-0' : ''
              }`}></span>
              <span className={`w-5 h-0.5 bg-coffee-600 transition-all duration-300 ${
                isMobileMenuOpen ? '-rotate-45 -translate-y-1' : ''
              }`}></span>
            </div>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`lg:hidden transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
        }`}>
          <div className="bg-white rounded-lg shadow-lg border border-cream-200 mt-2 p-4">
            <nav className="flex flex-col space-y-3">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleNavClick(item)}
                  className="text-left text-coffee-600 hover:text-primary-500 font-medium py-2 transition-colors touch-target"
                >
                  {item.label}
                </button>
              ))}
            </nav>
            
            <div className="flex flex-col space-y-3 mt-4 pt-4 border-t border-cream-200">
              <button
                onClick={handleLogin}
                className="w-full border-2 border-cream-300 text-coffee-700 py-3 rounded-lg font-semibold hover:bg-cream-50 transition-colors touch-target"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={handleRegister}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-semibold transition-colors touch-target"
              >
                Comenzar Gratis
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-cream-200 text-center">
              <p className="text-sm text-coffee-500 mb-2">¿Necesitas ayuda?</p>
              <a href="tel:+56912345678" className="text-primary-500 font-medium text-sm">
                ☕ +56 9 1234 5678
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
};

export default Header;
