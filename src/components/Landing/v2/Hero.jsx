// src/components/Landing/v2/Hero.jsx
import React from 'react';
import { Coffee, QrCode, Smartphone, TrendingUp } from 'lucide-react';
import heroImage from '../../../assets/hero-cafe.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Clientes ordenando desde tablets en cafetería moderna"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/95 via-primary-500/85 to-primary-500/70" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-cream-50 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-terracotta-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Coffee className="w-4 h-4" />
              <span className="text-sm font-medium">Revoluciona tu Cafetería</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Tus Clientes Ordenan
              <span className="block bg-gradient-to-r from-terracotta-400 to-secondary-500 bg-clip-text text-transparent">
                Desde su Mesa
              </span>
            </h1>

            <p className="text-xl mb-8 text-cream-100 leading-relaxed">
              Sistema de pedidos digital que moderniza tu cafetería. Sin meseros corriendo, sin esperas largas.
              Solo café delicioso y clientes felices.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <button className="group px-8 py-3 bg-gradient-to-r from-terracotta-500 to-secondary-500 text-cream-50 rounded-lg hover:shadow-glow-coffee-lg transition-all font-medium text-base flex items-center gap-2">
                Prueba Gratis 14 Días
                <TrendingUp className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-3 bg-cream-50/10 backdrop-blur-sm border-2 border-cream-50/30 text-cream-50 rounded-lg hover:bg-cream-50/20 transition-all font-medium text-base">
                Ver Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="text-3xl font-bold text-terracotta-400">300+</div>
                <div className="text-sm text-cream-200">Cafeterías</div>
              </div>
              <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
                <div className="text-3xl font-bold text-terracotta-400">50k+</div>
                <div className="text-sm text-cream-200">Pedidos/Mes</div>
              </div>
              <div className="animate-scale-in" style={{ animationDelay: '0.4s' }}>
                <div className="text-3xl font-bold text-terracotta-400">98%</div>
                <div className="text-sm text-cream-200">Satisfacción</div>
              </div>
            </div>
          </div>

          {/* Right Column - Feature Cards */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <FeatureCard
              icon={<QrCode className="w-6 h-6" />}
              title="Escanea QR"
              description="Cliente escanea código desde su mesa"
              delay="0.4s"
            />
            <FeatureCard
              icon={<Smartphone className="w-6 h-6" />}
              title="Ordena Fácil"
              description="Elige productos, personaliza y paga en segundos"
              delay="0.5s"
            />
            <FeatureCard
              icon={<Coffee className="w-6 h-6" />}
              title="Recibe Directo"
              description="Pedido llega a cocina automáticamente"
              delay="0.6s"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description, delay = '0s' }) => {
  return (
    <div
      className="flex items-start gap-4 bg-cream-50/95 backdrop-blur-sm p-6 rounded-xl shadow-coffee hover:shadow-coffee-lg transition-all hover:scale-105 animate-scale-in"
      style={{ animationDelay: delay }}
    >
      <div className="bg-primary-500 text-cream-50 p-3 rounded-lg flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1 text-coffee-900">{title}</h3>
        <p className="text-coffee-600 text-sm">{description}</p>
      </div>
    </div>
  );
};

export default Hero;
