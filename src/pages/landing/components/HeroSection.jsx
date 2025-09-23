// src/pages/landing/components/HeroSection.jsx - Versión con Tailwind
import React from 'react';
import { useNavigate } from 'react-router-dom';

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
    <section className="relative pt-20 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenido principal */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Digitaliza tu{' '}
              <span className="text-primary-500">Restaurante</span>
              <br />
              con TappMesa
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl">
              La plataforma completa para restaurantes y cafeterías. 
              Permite a tus clientes ordenar desde su mesa, hacer reservas 
              y mejorar su experiencia gastronómica.
            </p>

            {/* Características principales */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: '📱', text: 'Menú Digital' },
                { icon: '🛒', text: 'Carrito de Compras' },
                { icon: '📋', text: 'Comandas Digitales' },
                { icon: '🗓️', text: 'Sistema de Reservas' }
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="font-medium text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button 
                onClick={handleGetStarted}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl touch-target"
              >
                Comenzar Gratis
              </button>
              <button 
                onClick={handleDemo}
                className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 touch-target"
              >
                Ver Demo
              </button>
            </div>

            {/* Estadísticas */}
            <div className="flex justify-center lg:justify-start gap-8 text-center">
              {[
                { number: '500+', label: 'Restaurantes' },
                { number: '50k+', label: 'Órdenes' },
                { number: '98%', label: 'Satisfacción' }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-2xl font-bold text-primary-500">{stat.number}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-lg">
              {/* Placeholder para imagen principal */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 aspect-[3/4]">
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                  <span className="text-6xl">📱</span>
                </div>
              </div>

              {/* Tarjetas flotantes */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 animate-pulse-slow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🍕</span>
                  <span className="font-semibold text-sm">Nueva Orden</span>
                </div>
                <p className="text-xs text-gray-600">Mesa #5 - Pizza Margherita</p>
                <span className="text-primary-500 font-bold">$18.900</span>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 animate-pulse-slow" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📅</span>
                  <span className="font-semibold text-sm">Reserva Confirmada</span>
                </div>
                <p className="text-xs text-gray-600">Mesa para 4 - 20:00</p>
                <span className="text-secondary-500 font-bold">Confirmada</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;