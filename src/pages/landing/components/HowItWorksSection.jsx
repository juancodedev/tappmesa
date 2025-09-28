// src/pages/landing/components/HowItWorksSection.jsx - Versión con Tailwind
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
    <section id="how-it-works" className="py-16 lg:py-24 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            ¿Cómo funciona TappMesa?
          </h2>
          <p className="text-xl text-gray-600">
            Simple, rápido y sin complicaciones para clientes y restaurantes
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-white rounded-xl p-2 shadow-lg border border-gray-200">
            <button 
              className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'customer' 
                  ? 'bg-primary-500 text-coffee-900 shadow-md' 
                  : 'text-gray-600 hover:text-primary-500'
              }`}
              onClick={() => setActiveTab('customer')}
            >
              <span className="text-xl">👤</span>
              Para Clientes
            </button>
            <button 
              className={`flex items-center gap-3 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'restaurant' 
                  ? 'bg-primary-500 text-coffee-900 shadow-md' 
                  : 'text-gray-600 hover:text-primary-500'
              }`}
              onClick={() => setActiveTab('restaurant')}
            >
              <span className="text-xl">🏪</span>
              Para Restaurantes
            </button>
          </div>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            {currentSteps.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-16 h-16 bg-primary-500 text-coffee-900 rounded-full flex items-center justify-center text-xl font-bold shadow-lg">
                      {step.step}
                    </div>
                    {index < currentSteps.length - 1 && (
                      <div className="w-0.5 h-16 bg-primary-200 mt-4 hidden lg:block"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-3xl">{step.icon}</span>
                      <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                    </div>
                    <p className="text-lg text-gray-600 mb-4">{step.description}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.details}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Video */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-200 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Ve TappMesa en acción</h3>
            <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-coffee-900 text-3xl mb-4 mx-auto hover:scale-110 transition-transform duration-300 cursor-pointer">
                  ▶️
                </div>
                <p className="text-gray-600 font-medium">Video demo interactivo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Summary */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {[
            { icon: '⚡', title: 'Más Rápido', desc: 'Reduce tiempos de espera hasta en 40%' },
            { icon: '✅', title: 'Sin Errores', desc: 'Elimina errores de comunicación en órdenes' },
            { icon: '📈', title: 'Más Ventas', desc: 'Incrementa ventas promedio por mesa' },
            { icon: '😊', title: 'Mejor Experiencia', desc: 'Clientes más satisfechos y fidelizados' }
          ].map((benefit, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h4>
              <p className="text-gray-600 text-sm">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;