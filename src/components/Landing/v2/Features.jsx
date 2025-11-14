// src/components/Landing/v2/Features.jsx
import React from 'react';
import { ClipboardList, Users, TrendingUp, Zap, Clock, Wallet } from 'lucide-react';

const features = [
  {
    icon: <ClipboardList className="w-7 h-7" />,
    title: "Menú Digital Completo",
    description: "Carta digital con fotos, descripciones y precios actualizados en tiempo real. Personalización de productos al instante.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: <Zap className="w-7 h-7" />,
    title: "Pedidos Instantáneos",
    description: "Los pedidos llegan directo a la cocina y al barista. Cero errores de comunicación, máxima eficiencia.",
    gradient: "from-yellow-500 to-orange-500",
  },
  {
    icon: <Clock className="w-7 h-7" />,
    title: "Ahorra Tiempo",
    description: "Reduce hasta 60% el tiempo de atención. Tus meseros se enfocan en servicio premium, no en tomar pedidos.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: <Wallet className="w-7 h-7" />,
    title: "Pago Integrado",
    description: "Múltiples métodos de pago. Los clientes pagan cuando quieran, directamente desde su mesa.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: <TrendingUp className="w-7 h-7" />,
    title: "Aumenta Ventas",
    description: "Recomendaciones inteligentes y upselling automático aumentan el ticket promedio hasta un 35%.",
    gradient: "from-primary-500 to-secondary-500",
  },
  {
    icon: <Users className="w-7 h-7" />,
    title: "Clientes Felices",
    description: "Experiencia moderna y sin esperas. Tus clientes ordenan a su ritmo y vuelven más seguido.",
    gradient: "from-indigo-500 to-purple-500",
  },
];

const Features = () => {
  return (
    <section id="caracteristicas" className="py-24 lg:py-32 bg-gradient-to-b from-white via-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 lg:mb-20 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            Todo lo que tu Cafetería
            <span className="block bg-linear-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mt-2">
              Necesita para Crecer
            </span>
          </h2>
          <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
            Moderniza tu operación y ofrece una experiencia que tus clientes amarán
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white p-8 rounded-2xl border border-gray-200/50 hover:border-gray-300 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Gradient glow effect on hover */}
              <div className={`absolute inset-0 bg-linear-to-r ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />

              {/* Icon */}
              <div className="relative mb-6">
                <div className={`inline-flex p-4 rounded-xl bg-linear-to-br ${feature.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
              </div>

              {/* Content */}
              <div className="relative">
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
