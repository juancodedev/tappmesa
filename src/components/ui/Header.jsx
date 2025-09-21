// src/components/UI/Header.jsx

// src/components/layout/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../common/Logo';
import Button from '../ui/Button';

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
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <div className="header-content">
          {/* Logo */}
          <div className="header-logo">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
              <Logo />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="desktop-nav">
            <ul className="nav-list">
              {navigationItems.map((item, index) => (
                <li key={index} className="nav-item">
                  <button
                    onClick={() => handleNavClick(item)}
                    className="nav-link"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Auth Buttons */}
          <div className="header-actions">
            <Button
              onClick={handleLogin}
              variant="ghost"
              className="login-btn"
            >
              Iniciar Sesión
            </Button>
            <Button
              onClick={handleRegister}
              className="register-btn"
            >
              Comenzar Gratis
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`mobile-menu-btn ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-content">
            <ul className="mobile-nav-list">
              {navigationItems.map((item, index) => (
                <li key={index} className="mobile-nav-item">
                  <button
                    onClick={() => handleNavClick(item)}
                    className="mobile-nav-link"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="mobile-auth-actions">
              <Button
                onClick={handleLogin}
                variant="outline"
                className="btn-block"
              >
                Iniciar Sesión
              </Button>
              <Button
                onClick={handleRegister}
                className="btn-block"
              >
                Comenzar Gratis
              </Button>
            </div>

            <div className="mobile-contact">
              <p>¿Necesitas ayuda?</p>
              <a href="tel:+56912345678" className="contact-link">
                📞 +56 9 1234 5678
              </a>
              <a href="mailto:hola@tappmesa.com" className="contact-link">
                ✉️ hola@tappmesa.com
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="mobile-menu-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </header>
  );
};

export default Header;