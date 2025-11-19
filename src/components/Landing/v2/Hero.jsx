// src/components/Landing/v2/Hero.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, QrCode, Smartphone, ArrowRight, CheckCircle2 } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20" style={{
      backgroundImage: 'linear-gradient(rgba(139, 69, 19, 0.85), rgba(92, 64, 51, 0.9)), url("https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=2000")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      {/* Decorative gradient blobs - hidden for coffee theme */}
      <div className="absolute top-20 -left-40 w-80 h-80 bg-primary-400/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 -right-40 w-96 h-96 bg-secondary-400/10 rounded-full blur-3xl animate-float-delay" />

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Text Content */}
          <div className="text-left animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-coffee-800/90 px-4 py-2 rounded-full mb-8">
              <Coffee className="w-4 h-4 text-cream-200" />
              <span className="text-sm font-semibold text-cream-100">Revoluciona tu Cafetería</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Tus Clientes Ordenan</span>
              <br />
              <span className="text-secondary-300">
                Desde su Mesa
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl lg:text-2xl mb-8 text-cream-100 leading-relaxed max-w-2xl">
              Sistema de pedidos digital que moderniza tu cafetería. Sin meseros corriendo, sin esperas largas. Solo café delicioso y clientes felices.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-start">
              <button onClick={() => navigate('/register')}
                className="group px-8 py-4 bg-secondary-500 text-white rounded-xl hover:bg-secondary-600 hover:shadow-2xl hover:scale-105 transition-all font-semibold text-lg flex items-center justify-center gap-2">
                Inscribete Gratis
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              {/* <button className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl hover:bg-white/10 transition-all font-semibold text-lg flex items-center justify-center gap-2">
                Ver Demo
              </button> */}
            </div>
          </div>

          {/* Right Column - Feature Cards */}
          <div className="space-y-4 lg:space-y-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <FeatureCard
              icon={<QrCode className="w-6 h-6" />}
              title="Escanea QR"
              description="Cliente escanea código desde su mesa"
              delay="0.3s"
            />
            <FeatureCard
              icon={<Smartphone className="w-6 h-6" />}
              title="Ordena Fácil"
              description="Elige productos, personaliza y paga en segundos"
              delay="0.4s"
            />
            <FeatureCard
              icon={<Coffee className="w-6 h-6" />}
              title="Recibe Directo"
              description="Pedido llega a cocina automáticamente"
              delay="0.5s"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-20 max-w-3xl">
          <div className="text-left animate-scale-in" style={{ animationDelay: '0.6s' }}>
            <div className="text-4xl lg:text-5xl font-bold text-secondary-300 mb-2">300+</div>
            <div className="text-sm text-cream-200 font-medium">Cafeterías</div>
          </div>
          <div className="text-left animate-scale-in" style={{ animationDelay: '0.7s' }}>
            <div className="text-4xl lg:text-5xl font-bold text-secondary-300 mb-2">50k+</div>
            <div className="text-sm text-cream-200 font-medium">Pedidos/Mes</div>
          </div>
          <div className="text-left animate-scale-in" style={{ animationDelay: '0.8s' }}>
            <div className="text-4xl lg:text-5xl font-bold text-secondary-300 mb-2">98%</div>
            <div className="text-sm text-cream-200 font-medium">Satisfacción</div>
          </div>
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description, delay = '0s' }) => {
  return (
    <div
      className="group relative bg-white/95 backdrop-blur-sm p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-scale-in"
      style={{ animationDelay: delay }}
    >
      {/* Gradient glow effect on hover */}
      <div className="absolute inset-0 bg-linear-to-r from-secondary-400 to-secondary-600 opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity" />

      <div className="relative flex items-start gap-4">
        <div className="shrink-0 p-3 rounded-xl bg-linear-to-br from-secondary-500 to-secondary-600 text-white shadow-md group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-xl mb-2 text-gray-900">{title}</h3>
          <p className="text-gray-700 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default Hero;
