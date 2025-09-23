// src/pages/landing/components/HeroSection.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleDemo = () => {
    document.getElementById('demo-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Digitaliza tu <span className="text-primary">Restaurante</span>
              <br />
              con TappMesa
            </h1>
            <p className="hero-description">
              La plataforma completa para restaurantes y cafeterías. 
              Permite a tus clientes ordenar desde su mesa, hacer reservas 
              y mejorar su experiencia gastronómica.
            </p>
            <div className="hero-features">
              <div className="feature-item">
                <span className="feature-icon">📱</span>
                <span>Menú Digital</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🛒</span>
                <span>Carrito de Compras</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📋</span>
                <span>Comandas Digitales</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🗓️</span>
                <span>Sistema de Reservas</span>
              </div>
            </div>
            <div className="hero-actions">
              <Button 
                onClick={handleGetStarted}
                className="btn-primary btn-large"
              >
                Comenzar Gratis
              </Button>
              <Button 
                onClick={handleDemo}
                variant="outline"
                className="btn-large"
              >
                Ver Demo
              </Button>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Restaurantes</span>
              </div>
              <div className="stat">
                <span className="stat-number">50k+</span>
                <span className="stat-label">Órdenes</span>
              </div>
              <div className="stat">
                <span className="stat-number">98%</span>
                <span className="stat-label">Satisfacción</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-image-container">
              <img 
                src="/images/demo/app-screenshot-1.png" 
                alt="TappMesa App Demo"
                className="hero-image"
              />
              <div className="floating-card order-card">
                <div className="card-header">
                  <span className="card-icon">🍕</span>
                  <span className="card-title">Nueva Orden</span>
                </div>
                <div className="card-content">
                  <p>Mesa #5 - Pizza Margherita</p>
                  <span className="card-price">$18.900</span>
                </div>
              </div>
              <div className="floating-card reservation-card">
                <div className="card-header">
                  <span className="card-icon">📅</span>
                  <span className="card-title">Reserva Confirmada</span>
                </div>
                <div className="card-content">
                  <p>Mesa para 4 - 20:00</p>
                  <span className="card-status">Confirmada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;