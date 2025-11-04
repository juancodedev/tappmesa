// src/components/Landing/v2/Features.jsx
import React from 'react';
import { ClipboardList, Users, TrendingUp, Zap, Clock, Wallet } from 'lucide-react';

const features = [
  {
    icon: <ClipboardList className="w-8 h-8" />,
    title: "Menú Digital Completo",
    description: "Carta digital con fotos, descripciones y precios actualizados en tiempo real. Personalización de productos al instante.",
    color: "from-primary-500 to-primary-600",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Pedidos Instantáneos",
    description: "Los pedidos llegan directo a la cocina y al barista. Cero errores de comunicación, máxima eficiencia.",
    color: "from-secondary-500 to-terracotta-500",
  },
  {
    icon: <Clock className="w-8 h-8" />,
    title: "Ahorra Tiempo",
    description: "Reduce hasta 60% el tiempo de atención. Tus meseros se enfocan en servicio premium, no en tomar pedidos.",
    color: "from-terracotta-500 to-secondary-500",
  },
  {
    icon: <Wallet className="w-8 h-8" />,
    title: "Pago Integrado",
    description: "Múltiples métodos de pago. Los clientes pagan cuando quieran, directamente desde su mesa.",
    color: "from-primary-500 to-secondary-500",
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Aumenta Ventas",
    description: "Recomendaciones inteligentes y upselling automático aumentan el ticket promedio hasta un 35%.",
    color: "from-secondary-500 to-primary-500",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Clientes Felices",
    description: "Experiencia moderna y sin esperas. Tus clientes ordenan a su ritmo y vuelven más seguido.",
    color: "from-terracotta-500 to-primary-500",
  },
];

const Features = () => {
  return (
    <section id="caracteristicas" className="py-20 bg-gradient-to-b from-cream-50 to-cream-100/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-coffee-900">
            Todo lo que tu Cafetería
            <span className="block bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
              Necesita para Crecer
            </span>
          </h2>
          <p className="text-xl text-coffee-600 max-w-2xl mx-auto">
            Moderniza tu operación y ofrece una experiencia que tus clientes amarán
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-8 bg-cream-50 rounded-xl border-2 border-cream-300/50 hover:shadow-coffee-lg transition-all duration-300 hover:scale-105 animate-scale-in group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.color} text-cream-50 mb-6 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-coffee-900">{feature.title}</h3>
              <p className="text-coffee-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
