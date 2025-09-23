// src/pages/landing/components/HeroSection.jsx - Versión para Cafeterías
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
    <section className="relative pt-20 pb-16 px-4 bg-coffee-gradient">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Contenido principal */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-coffee-900 leading-tight mb-6">
              Digitaliza tu{' '}
              <span className="text-primary-500">Cafetería</span>
              <br />
              con TappMesa
            </h1>
            
            <p className="text-xl text-coffee-600 mb-8 max-w-2xl leading-relaxed">
              La plataforma perfecta para cafeterías modernas. 
              Permite a tus clientes ordenar desde su mesa, disfrutar de una experiencia única 
              y crear el ambiente acogedor que tanto aman.
            </p>

            {/* Características principales para cafeterías */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { icon: '☕', text: 'Menú Digital de Café' },
                { icon: '🥐', text: 'Carrito Inteligente' },
                { icon: '📋', text: 'Órdenes Directas' },
                { icon: '🪑', text: 'Reserva de Mesas' }
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-cream-200">
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="font-medium text-coffee-700">{feature.text}</span>
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
                className="border-2 border-primary-500 text-primary-600 hover:bg-primary-500 hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 touch-target"
              >
                Ver Demo
              </button>
            </div>

            {/* Estadísticas específicas para cafeterías */}
            <div className="flex justify-center lg:justify-start gap-8 text-center">
              {[
                { number: '200+', label: 'Cafeterías' },
                { number: '25k+', label: 'Cafés Servidos' },
                { number: '99%', label: 'Clientes Felices' }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-2xl font-bold text-primary-600">{stat.number}</div>
                  <div className="text-sm text-coffee-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-lg">
              {/* Placeholder para imagen principal */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 aspect-[3/4] border border-cream-200">
                <div className="w-full h-full bg-warm-gradient rounded-xl flex items-center justify-center relative overflow-hidden">
                  <span className="text-6xl">☕</span>
                  {/* Efecto de vapor */}
                  <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-8 bg-gray-300 opacity-60 rounded-full animate-steam"></div>
                    <div className="w-1 h-6 bg-gray-300 opacity-40 rounded-full animate-steam ml-2" style={{ animationDelay: '0.5s' }}></div>
                    <div className="w-1 h-4 bg-gray-300 opacity-30 rounded-full animate-steam ml-4" style={{ animationDelay: '1s' }}></div>
                  </div>
                </div>
              </div>

              {/* Tarjetas flotantes específicas para cafeterías */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 animate-pulse-slow border border-cream-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">☕</span>
                  <span className="font-semibold text-sm text-coffee-800">Nueva Orden</span>
                </div>
                <p className="text-xs text-coffee-600">Mesa #3 - Latte + Croissant</p>
                <span className="text-primary-600 font-bold">$6.500</span>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 animate-pulse-slow border border-cream-200" style={{ animationDelay: '1s' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🪑</span>
                  <span className="font-semibold text-sm text-coffee-800">Mesa Reservada</span>
                </div>
                <p className="text-xs text-coffee-600">Mesa junto a ventana - 15:30</p>
                <span className="text-secondary-600 font-bold">Confirmada</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Elementos decorativos de ambiente de cafetería */}
      <div className="absolute top-10 left-10 opacity-20">
        <div className="text-6xl text-coffee-300 animate-pulse-slow">☕</div>
      </div>
      <div className="absolute bottom-10 right-10 opacity-20">
        <div className="text-4xl text-coffee-300 animate-pulse-slow" style={{ animationDelay: '1s' }}>🥐</div>
      </div>
      <div className="absolute top-1/2 left-5 opacity-15">
        <div className="text-3xl text-coffee-300 animate-pulse-slow" style={{ animationDelay: '2s' }}>🍰</div>
      </div>
    </section>
  );
};

export default HeroSection;