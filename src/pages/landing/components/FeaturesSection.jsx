// src/pages/landing/components/FeaturesSection.jsx - Versión para Cafeterías
import React from 'react';

const FeaturesSection = () => {
  const features = [
    {
      icon: '☕',
      title: 'Menú Digital de Cafetería',
      description: 'Muestra tu carta de cafés, tés, pasteles y snacks con fotos apetitosas. Actualiza precios y disponibilidad en tiempo real.',
      benefits: ['Fotos HD de productos', 'Descripciones de sabores', 'Opciones de personalización', 'Gestión de stock en vivo']
    },
    {
      icon: '🛒',
      title: 'Experiencia de Pedido Suave',
      description: 'Tus clientes pueden personalizar su café (tamaño, leche, endulzantes) y agregar acompañamientos de forma intuitiva.',
      benefits: ['Personalización de bebidas', 'Combos automáticos', 'Recomendaciones inteligentes', 'Cálculo de total en vivo']
    },
    {
      icon: '📋',
      title: 'Órdenes Directo a Barista',
      description: 'Cada pedido llega organizadamente a tu estación de café con todos los detalles de preparación y preferencias del cliente.',
      benefits: ['Sin errores de comunicación', 'Tiempos de preparación', 'Cola de órdenes visual', 'Notificaciones de listo']
    },
    {
      icon: '🪑',
      title: 'Reservas de Mesa',
      description: 'Los clientes pueden reservar su mesa favorita (junto a la ventana, en el rincón tranquilo) desde su celular.',
      benefits: ['Selección de ubicación', 'Horarios flexibles', 'Confirmación automática', 'Recordatorios por email']
    },
    {
      icon: '📊',
      title: 'Insights de Cafetería',
      description: 'Descubre qué cafés son más populares, en qué horarios hay más demanda y las preferencias de tus clientes habituales.',
      benefits: ['Bebidas más vendidas', 'Horarios pico', 'Análisis de clientes', 'Reportes de ventas']
    },
    {
      icon: '💳',
      title: 'Pagos Sin Filas',
      description: 'Los clientes pagan desde su mesa cuando terminan, sin hacer fila en caja. Acepta tarjetas, transferencias y efectivo.',
      benefits: ['Pago desde la mesa', 'Múltiples métodos', 'Propinas digitales', 'Recibos por email']
    }
  ];

  return (
    <section id="features" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-coffee-900 mb-4">
            Todo lo que tu cafetería necesita para brillar
          </h2>
          <p className="text-xl text-coffee-600 max-w-3xl mx-auto">
            Crea la experiencia perfecta para tus clientes mientras optimizas tu operación diaria
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white border border-cream-200 rounded-2xl p-8 hover:shadow-xl hover:border-primary-300 transition-all duration-300 group h-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-warm-gradient rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 border border-cream-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-coffee-900">{feature.title}</h3>
              </div>
              
              <p className="text-coffee-600 mb-6 leading-relaxed">
                {feature.description}
              </p>
              
              <ul className="space-y-3">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-coffee-700">
                    <span className="w-5 h-5 bg-secondary-100 text-secondary-600 rounded-full flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-warm-gradient rounded-3xl p-8 lg:p-12 text-center border border-cream-200">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center gap-4 mb-6">
              <span className="text-4xl animate-pulse-slow">☕</span>
              <span className="text-4xl animate-pulse-slow" style={{ animationDelay: '0.5s' }}>🥐</span>
              <span className="text-4xl animate-pulse-slow" style={{ animationDelay: '1s' }}>🍰</span>
            </div>
            <h3 className="text-2xl font-bold text-coffee-900 mb-4">
              ¿Lista para transformar tu cafetería?
            </h3>
            <p className="text-coffee-600 mb-8">
              Únete a cientos de cafeterías que ya crearon experiencias inolvidables para sus clientes
            </p>
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl touch-target">
              Comenzar Prueba Gratuita
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;