// src/components/Landing/v2/Pricing.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Check, TrendingUp } from 'lucide-react';

const Pricing = () => {
  const plans = [
    {
      name: "Café Express",
      description: "Perfecto para cafeterías pequeñas y acogedoras",
      price: "$29.990",
      period: "/mes",
      features: [
        "Hasta 50 productos en menú",
        "1 cafetería registrada",
        "Menú digital básico",
        "Órdenes directas al barista",
        "Soporte por email",
        "Estadísticas básicas de ventas",
        "Personalización de bebidas",
        "Dashboard básico"
      ],
      popular: false,
      icon: <Coffee className="w-6 h-6" />
    },
    {
      name: "Café Premium",
      description: "Ideal para cafeterías en crecimiento",
      price: "$49.990",
      period: "/mes",
      features: [
        "Productos ilimitados",
        "Hasta 3 sucursales",
        "Menú digital avanzado",
        "Sistema de reservas de mesa",
        "Soporte prioritario 24/7",
        // "Analytics detallados",
        "Programa de lealtad",
        // "Integración con delivery",
        // "Personalización de marca",
        "Reportes semanales automáticos"
      ],
      popular: true,
      icon: <TrendingUp className="w-6 h-6" />
    },
    {
      name: "Café Enterprise",
      description: "Para cadenas de cafeterías y operaciones grandes",
      price: "$89.990",
      period: "/mes",
      features: [
        "Todo de Café Premium",
        "Sucursales ilimitadas",
        "Multi-administrador",
        "API personalizada",
        "Soporte dedicado",
        "Insights avanzados de mercado",
        // "Integración con sistemas POS",
        "Dashboard ejecutivo",
          // "Análisis predictivo de demanda",
        "Gestión de inventario automática",
        "Reportes personalizados",
        "Capacitación para equipo"
      ],
      popular: false,
      icon: <Coffee className="w-6 h-6" />
    }
  ];
  const navigate = useNavigate();

  return (
    <section id="precios" className="py-20 bg-cream-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-terracotta-500/10 px-4 py-2 rounded-full mb-4">
            <Coffee className="w-4 h-4 text-terracotta-500" />
            <span className="text-sm font-medium text-terracotta-500">Planes Diseñados para Cafeterías</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-coffee-900">
            Precios Transparentes
          </h2>
          <p className="text-xl text-coffee-600 max-w-3xl mx-auto">
            Planes flexibles que crecen contigo. Sin costos ocultos, sin sorpresas.
            Solo gestión digital perfecta para tu cafetería.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative p-8 bg-cream-50 rounded-xl border-2 animate-scale-in ${
                plan.popular
                  ? "border-primary-500 shadow-coffee-xl scale-105"
                  : "border-cream-300/50 hover:shadow-coffee-lg"
              } transition-all`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-linear-to-r from-primary-500 to-secondary-500 text-cream-50 px-4 py-1 rounded-full text-sm font-semibold">
                  Más Popular
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-terracotta-500/10 p-2 rounded-lg text-terracotta-500">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-coffee-900">{plan.name}</h3>
                </div>
                <p className="text-sm text-coffee-600">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-coffee-900">{plan.price}</span>
                  <span className="text-coffee-600">{plan.period}</span>
                </div>
                <p className="text-xs text-coffee-600 mt-1">
                  + IVA • Sin compromiso • Cancela cuando quieras
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-coffee-900">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                  plan.popular
                    ? "bg-linear-to-r from-primary-500 to-secondary-500 text-cream-50 hover:shadow-coffee-lg"
                    : "border-2 border-cream-300 text-coffee-900 hover:bg-cream-100"
                }`}
                onClick={() => navigate('/register')}
                
              >
                {plan.popular ? "Comenzar Ahora" : "Prueba Gratuita"}
              </button>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center max-w-3xl mx-auto p-8 bg-linear-to-r from-terracotta-500/10 to-secondary-500/10 rounded-2xl border-2 border-cream-300/50 animate-fade-in">
          <h3 className="text-2xl font-bold mb-3 text-coffee-900">
            ¿Necesitas un plan personalizado? ☕
          </h3>
          <p className="text-coffee-600 mb-6">
            Si tienes más de 10 sucursales o necesidades específicas, hablemos para crear
            el plan perfecto para tu negocio cafetero.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button 
            onClick={() => navigate('/contact-sales')}
            className="px-6 py-3 bg-linear-to-r from-primary-500 to-secondary-500 text-cream-50 rounded-lg hover:shadow-coffee-lg transition-all font-medium">
              Contactar Ventas
            </button>
            {/* <button className="px-6 py-3 border-2 border-cream-300 text-coffee-900 rounded-lg hover:bg-cream-100 transition-all font-medium">
              Agendar Demo Personalizada
            </button> */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
