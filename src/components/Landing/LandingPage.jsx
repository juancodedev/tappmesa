// src/components/Landing/LandingPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

// Components
import Header from '../UI/Header';
import Footer from '../UI/Footer';
import AuthModal from '../Auth/AuthModal';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import BenefitsSection from './BenefitsSection';
import PricingSection from './PricingSection';
import TestimonialsSection from './TestimonialsSection';
import ContactSection from './ContactSection';
import CTASection from './CTASection';

// Hooks
import { useScrollAnimation } from '../../hooks/useInView';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('register');
  const [isLoading, setIsLoading] = useState(true);
  const { scrollY, scrollDirection } = useScrollAnimation();

  useEffect(() => {
    // Simular carga inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Preload critical resources
    const preloadImages = [
      '/images/hero-phone.png',
      '/images/features-demo.png',
      '/images/testimonials-bg.jpg'
    ];

    preloadImages.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const handleAuthSuccess = (userData) => {
    setShowAuthModal(false);
    // Redirect será manejado por el AuthContext y Router
  };

  const openRegisterModal = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const openLoginModal = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleSwitchAuthMode = (mode) => {
    setAuthMode(mode);
  };

  // Loading screen
  if (isLoading) {
    return (
      <div className="landing-loader">
        <div className="loader-content">
          <div className="loader-logo">
            <span className="logo-icon">🍽️</span>
            <span className="logo-text">TappMesa</span>
          </div>
          <div className="loader-spinner"></div>
          <p className="loader-text">Preparando la mejor experiencia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Header */}
      <Header 
        onOpenLogin={openLoginModal}
        onOpenRegister={openRegisterModal}
      />

      {/* Main Content */}
      <main className="landing-main">
        <HeroSection 
          onOpenRegister={openRegisterModal}
          onOpenLogin={openLoginModal}
        />
        
        <FeaturesSection />
        
        <BenefitsSection />
        
        {/* CTA intermedio */}
        <CTASection 
          title="¿Listo para ver TappMesa en acción?"
          description="Agenda una demo personalizada y descubre cómo podemos transformar tu restaurante"
          primaryAction={{
            text: "Solicitar Demo Gratis",
            onClick: () => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
          }}
          secondaryAction={{
            text: "Comenzar Prueba Gratis",
            onClick: openRegisterModal
          }}
          theme="gradient"
        />
        
        <TestimonialsSection />
        
        <PricingSection 
          onOpenRegister={openRegisterModal}
        />
        
        <ContactSection 
          onOpenRegister={openRegisterModal}
        />
        
        {/* CTA final */}
        <CTASection 
          title="Únete a los 500+ restaurantes que ya transformaron su negocio"
          description="No esperes más. Comienza tu transformación digital hoy mismo."
          primaryAction={{
            text: "Comenzar Prueba Gratis",
            onClick: openRegisterModal
          }}
          showStats={true}
          theme="dark"
        />
      </main>

      {/* Footer */}
      <Footer />

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          onSwitchMode={handleSwitchAuthMode}
        />
      )}

      {/* Scroll Progress Bar */}
      <div className="scroll-progress">
        <div 
          className="scroll-progress-bar"
          style={{ 
            transform: `scaleX(${Math.min(scrollY / (document.documentElement.scrollHeight - window.innerHeight), 1)})` 
          }}
        />
      </div>

      {/* Floating Action Button */}
      {scrollY > 1000 && (
        <div className="floating-actions">
          <button
            className="fab demo-fab"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            title="Solicitar Demo"
          >
            🎯
          </button>
          
          <button
            className="fab trial-fab"
            onClick={openRegisterModal}
            title="Comenzar Prueba Gratis"
          >
            🚀
          </button>
          
          <button
            className="fab scroll-top-fab"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Volver arriba"
          >
            ↑
          </button>
        </div>
      )}

      {/* Chat Widget */}
      <div className="chat-widget">
        <button className="chat-trigger">
          <span className="chat-icon">💬</span>
          <span className="chat-badge">¿Dudas?</span>
        </button>
      </div>

      {/* Notification Banner (for authenticated users) */}
      {isAuthenticated && user && (
        <div className="welcome-banner">
          <div className="banner-content">
            <span className="banner-icon">👋</span>
            <div className="banner-text">
              <strong>¡Bienvenido de vuelta, {user.ownerName}!</strong>
              <span>Ve las últimas actualizaciones de TappMesa</span>
            </div>
            <a href="/dashboard" className="banner-action">
              Ir al Dashboard
            </a>
          </div>
          <button className="banner-close" onClick={() => document.querySelector('.welcome-banner').style.display = 'none'}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}