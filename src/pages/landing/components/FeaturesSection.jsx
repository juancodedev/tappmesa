// src/pages/landing/components/FeaturesSection.jsx - Versión con Tailwind
import React from 'react';

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
    <section id="features" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Todo lo que necesitas para modernizar tu restaurante
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Una plataforma completa que se adapta a cualquier tipo de establecimiento gastronómico
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl hover:border-primary-300 transition-all duration-300 group h-full"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
              </div>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {feature.description}
              </p>
              
              <ul className="space-y-3">
                {feature.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-3xl p-8 lg:p-12 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Listo para transformar tu negocio?
            </h3>
            <p className="text-gray-600 mb-8">
              Únete a cientos de restaurantes que ya digitalizaron su operación
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