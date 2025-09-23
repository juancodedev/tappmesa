// src/pages/landing/components/HowItWorksSection.jsx
import React, { useState } from 'react';

const HowItWorksSection = () => {
  const [activeTab, setActiveTab] = useState('customer');

  const customerSteps = [
    {
      step: 1,
      title: 'Escanea el QR',
      description: 'El cliente escanea el código QR en la mesa con su celular',
      icon: '📱',
      details: 'Sin necesidad de descargar apps. Funciona directamente en el navegador del celular.'
    },
    {
      step: 2,
      title: 'Explora el Menú',
      description: 'Navega por el menú digital con fotos, descripciones y precios',
      icon: '📖',
      details: 'Menú categorizado, buscador, filtros por alérgenos y preferencias dietéticas.'
    },
    {
      step: 3,
      title: 'Personaliza y Agrega',
      description: 'Personaliza los platillos y agrégalos al carrito',
      icon: '🛒',
      details: 'Modifica ingredientes, elige tamaños, agrega notas especiales para la cocina.'
    },
    {
      step: 4,
      title: 'Envía tu Orden',
      description: 'Revisa y confirma tu pedido. Se envía directo a cocina',
      icon: '📋',
      details: 'La orden llega inmediatamente a la cocina con todos los detalles necesarios.'
    },
    {
      step: 5,
      title: 'Paga Fácil',
      description: 'Elige tu método de pago preferido cuando termines de comer',
      icon: '💳',
      details: 'Pago con tarjeta, transferencia, efectivo o billeteras digitales.'
    }
  ];

  const restaurantSteps = [
    {
      step: 1,
      title: 'Configura tu Perfil',
      description: 'Registra tu restaurante y personaliza la información básica',
      icon: '🏪',
      details: 'Logo, descripción, horarios, información de contacto y redes sociales.'
    },
    {
      step: 2,
      title: 'Carga tu Menú',
      description: 'Agrega tus platillos con fotos, precios y descripciones',
      icon: '📝',
      details: 'Editor intuitivo con categorías, opciones de personalización y gestión de inventario.'
    },
    {
      step: 3,
      title: 'Configura las Mesas',
      description: 'Define la distribución de mesas y genera códigos QR',
      icon: '🪑',
      details: 'Mapa visual del restaurante, capacidad por mesa y códigos QR únicos.'
    },
    {
      step: 4,
      title: 'Recibe Órdenes',
      description: 'Las órdenes llegan organizadas a tu panel de cocina',
      icon: '👨‍🍳',
      details: 'Panel en tiempo real con tiempos de preparación y estado de órdenes.'
    },
    {
      step: 5,
      title: 'Gestiona Reservas',
      description: 'Administra las reservas y optimiza la ocupación',
      icon: '📅',
      details: 'Calendario inteligente con gestión automática de disponibilidad.'
    }
  ];

  const currentSteps = activeTab === 'customer' ? customerSteps : restaurantSteps;

  return (
    <section className="how-it-works-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">¿Cómo funciona TappMesa?</h2>
          <p className="section-description">
            Simple, rápido y sin complicaciones para clientes y restaurantes
          </p>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'customer' ? 'active' : ''}`}
              onClick={() => setActiveTab('customer')}
            >
              <span className="tab-icon">👤</span>
              Para Clientes
            </button>
            <button 
              className={`tab ${activeTab === 'restaurant' ? 'active' : ''}`}
              onClick={() => setActiveTab('restaurant')}
            >
              <span className="tab-icon">🏪</span>
              Para Restaurantes
            </button>
          </div>
        </div>

        <div className="steps-container">
          <div className="steps-timeline">
            {currentSteps.map((step, index) => (
              <div key={step.step} className="step-item">
                <div className="step-number">
                  <span>{step.step}</span>
                </div>
                <div className="step-content">
                  <div className="step-header">
                    <span className="step-icon">{step.icon}</span>
                    <h3 className="step-title">{step.title}</h3>
                  </div>
                  <p className="step-description">{step.description}</p>
                  <p className="step-details">{step.details}</p>
                </div>
                {index < currentSteps.length - 1 && (
                  <div className="step-connector"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="how-it-works-demo">
          <div className="demo-preview">
            <h3>Ve TappMesa en acción</h3>
            <div className="demo-video-placeholder">
              <div className="play-button">
                <span>▶️</span>
              </div>
              <p>Video demo interactivo</p>
            </div>
          </div>
        </div>

        <div className="benefits-summary">
          <div className="benefit-item">
            <span className="benefit-icon">⚡</span>
            <div>
              <h4>Más Rápido</h4>
              <p>Reduce tiempos de espera hasta en 40%</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">✅</span>
            <div>
              <h4>Sin Errores</h4>
              <p>Elimina errores de comunicación en órdenes</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">📈</span>
            <div>
              <h4>Más Ventas</h4>
              <p>Incrementa ventas promedio por mesa</p>
            </div>
          </div>
          <div className="benefit-item">
            <span className="benefit-icon">😊</span>
            <div>
              <h4>Mejor Experiencia</h4>
              <p>Clientes más satisfechos y fidelizados</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;