// src/components/UI/Header.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

export default function Header({ onOpenLogin, onOpenRegister }) {
  const { isAuthenticated, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80;
      const elementPosition = element.offsetTop - headerHeight;

      window.scrollTo({
        top: elementPosition,
        behavior: "smooth",
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={`header ${isScrolled ? "scrolled" : ""}`}>
      <nav className="nav">
        <div className="nav-brand">
          <a href="/" className="logo">
            <span className="logo-icon">🍽️</span>
            <span className="logo-text">TappMesa</span>
          </a>
        </div>

        {/* Desktop Navigation */}
        <ul className="nav-links desktop-only">
          <li>
            <button
              onClick={() => scrollToSection("features")}
              className="nav-link"
            >
              Características
            </button>
          </li>
          <li>
            <button
              onClick={() => scrollToSection("benefits")}
              className="nav-link"
            >
              Beneficios
            </button>
          </li>
          <li>
            <button
              onClick={() => scrollToSection("pricing")}
              className="nav-link"
            >
              Precios
            </button>
          </li>
          <li>
            <button
              onClick={() => scrollToSection("testimonials")}
              className="nav-link"
            >
              Testimonios
            </button>
          </li>
          <li>
            <button
              onClick={() => scrollToSection("contact")}
              className="nav-link"
            >
              Contacto
            </button>
          </li>
        </ul>

        {/* Header Actions */}
        <div className="header-actions desktop-only">
          {isAuthenticated ? (
            <div className="user-menu">
              <span className="user-greeting">Hola, {user?.ownerName}</span>
              <a href="/dashboard" className="btn-dashboard">
                Ir al Dashboard
              </a>
            </div>
          ) : (
            <>
              <button onClick={onOpenLogin} className="btn-login">
                Iniciar Sesión
              </button>
              <button onClick={onOpenRegister} className="cta-btn">
                Prueba Gratis
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn mobile-only"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? "open" : ""}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMobileMenuOpen ? "open" : ""}`}>
          <div className="mobile-menu-content">
            <ul className="mobile-nav-links">
              <li>
                <button
                  onClick={() => scrollToSection("features")}
                  className="mobile-nav-link"
                >
                  Características
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("benefits")}
                  className="mobile-nav-link"
                >
                  Beneficios
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className="mobile-nav-link"
                >
                  Precios
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("testimonials")}
                  className="mobile-nav-link"
                >
                  Testimonios
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection("contact")}
                  className="mobile-nav-link"
                >
                  Contacto
                </button>
              </li>
            </ul>

            <div className="mobile-actions">
              {isAuthenticated ? (
                <div className="mobile-user-menu">
                  <span className="mobile-user-greeting">
                    Hola, {user?.ownerName}
                  </span>
                  <a href="/dashboard" className="btn-dashboard mobile">
                    Ir al Dashboard
                  </a>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onOpenLogin();
                      setIsMobileMenuOpen(false);
                    }}
                    className="btn-login mobile"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => {
                      onOpenRegister();
                      setIsMobileMenuOpen(false);
                    }}
                    className="cta-btn mobile"
                  >
                    Prueba Gratis
                  </button>
                </>
              )}
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
      </nav>
    </header>
  );
}
