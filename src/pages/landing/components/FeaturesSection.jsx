// src/pages/landing/components/FeaturesSection.jsx
import React from 'react';
import Card from '../../../components/ui/Card';

const FeaturesSection = () => {
  const features = [
    {
      icon: '📱',
      title: 'Menú Digital Interactivo',
      description: 'Tus clientes pueden ver el menú completo desde su celular con fotos, descripciones y precios actualizados en tiempo real.',
      benefits: ['Actualización instantánea', 'Fotos HD de platillos', 'Información nutricional', 'Personalización por cliente']
    },
    {
      icon: '🛒',
      title: 'Carrito de Compras Inteligente',
      description: 'Sistema de carrito que permite a los clientes agregar productos, personalizar órdenes y revisar antes de enviar a cocina.',
      benefits: ['Personalización de platillos', 'Cálculo automático de totales', 'Aplicación de descuentos', 'Historial de órdenes']
    },
    {
      icon: '📋',
      title: 'Comandas Digitales',
      description: 'Las órdenes llegan directamente a la cocina de forma organizada, reduciendo errores y mejorando los tiempos de preparación.',
      benefits: ['Reducción de errores', 'Tiempos de preparación', 'Organización por prioridad', 'Estado en tiempo real']
    },
    {
      icon: '🗓️',
      title: 'Sistema de Reservas',
      description: 'Permite a los clientes reservar mesas online, seleccionar ubicación y horarios disponibles automáticamente.',
      benefits: ['Reservas 24/7', 'Selección de mesas', 'Confirmaciones automáticas', 'Gestión de capacidad']
    },
    {
      icon: '📊',
      title: 'Analytics y Reportes',
      description: 'Obtén insights valiosos sobre las preferencias de tus clientes, productos más vendidos y rendimiento del negocio.',
      benefits: ['Reportes de ventas', 'Productos populares', 'Análisis de clientes', 'Tendencias temporales']
    },
    {
      icon: '💳',
      title: 'Pagos Integrados',
      description: 'Acepta múltiples métodos de pago de forma segura: tarjetas, transferencias, efectivo y billeteras digitales.',
      benefits: ['Múltiples métodos', 'Transacciones seguras', 'Conciliación automática', 'Facturación electrónica']
    }
  ];

  return (
    <section className="features-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">
            Todo lo que necesitas para modernizar tu restaurante
          </h2>
          <p className="section-description">
            Una plataforma completa que se adapta a cualquier tipo de establecimiento gastronómico
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <Card key={index} className="feature-card">
              <div className="feature-header">
                <div className="feature-icon-container">
                  <span className="feature-icon">{feature.icon}</span>
                </div>
                <h3 className="feature-title">{feature.title}</h3>
              </div>
              
              <p className="feature-description">
                {feature.description}
              </p>
              
              <ul className="feature-benefits">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx} className="benefit-item">
                    <span className="benefit-check">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        <div className="features-cta">
          <div className="cta-content">
            <h3>¿Listo para transformar tu negocio?</h3>
            <p>Únete a cientos de restaurantes que ya digitalizaron su operación</p>
            <button className="btn btn-primary">
              Comenzar Prueba Gratuita
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;