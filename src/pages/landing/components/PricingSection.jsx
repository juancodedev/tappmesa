import { Check, Coffee, Star, Zap } from 'lucide-react';

const PricingSection = () => {
  const plans = [
    {
      name: "Café Express",
      price: "$29.990",
      period: "/mes",
      description: "Perfecto para cafeterías pequeñas y acogedoras",
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
      icon: Coffee,
      gradient: "bg-cream-200",
      textColor: "text-coffee-900"
    },
    {
      name: "Café Premium",
      price: "$49.990",
      period: "/mes",
      description: "Ideal para cafeterías en crecimiento y cadenas pequeñas",
      features: [
        "Productos ilimitados",
        "Hasta 3 sucursales",
        "Menú digital avanzado",
        "Sistema de reservas de mesa",
        "Soporte prioritario 24/7",
        "Analytics detallados de cafetería",
        "Programa de lealtad para clientes",
        "Integración con delivery",
        "Personalización de marca",
        "Reportes semanales automáticos"
      ],
      popular: true,
      icon: Star,
      gradient: "bg-primary-500",
      textColor: "text-coffee-900"
    },
    {
      name: "Café Enterprise",
      price: "$89.990",
      period: "/mes",
      description: "Para cadenas de cafeterías y operaciones grandes",
      features: [
        "Todo de Café Premium",
        "Sucursales ilimitadas",
        "Multi-administrador",
        "API personalizada",
        "Soporte dedicado",
        "Insights avanzados de mercado",
        "Integración con sistemas POS",
        "Dashboard ejecutivo",
        "Análisis predictivo de demanda",
        "Gestión de inventario automática",
        "Reportes personalizados",
        "Capacitación para equipo"
      ],
      popular: false,
      icon: Zap,
      gradient: "bg-coffee-dark",
      textColor: "text-coffee-900"
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-linear-to-br from-cream-200 via-white to-cream-100">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Coffee className="text-primary-500 h-8 w-8" />
            <span className="text-coffee-600 font-medium">Planes Diseñados para Cafeterías</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-coffee-900 mb-6">
            Precios <span className="text-primary-500">Transparentes</span>
          </h2>
          <p className="text-xl text-coffee-600 max-w-3xl mx-auto leading-relaxed">
            Planes flexibles que crecen contigo, desde tu primera taza hasta tu cadena de cafeterías. 
            Sin costos ocultos, sin sorpresas. Solo café digital perfecto.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105 ${
                plan.popular 
                  ? 'shadow-2xl shadow-primary-500/20 border-2 border-primary-500' 
                  : 'shadow-lg hover:shadow-xl bg-white border border-cream-200'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-coffee-900 text-coffee-900 px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                    <Star className="h-4 w-4 fill-current" />
                    Más Popular
                  </div>
                </div>
              )}

              {/* Card Content */}
              <div className={`p-8 ${plan.popular ? plan.gradient : ''}`}>
                {/* Icon & Title */}
                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 rounded-full mb-4 ${
                    plan.popular ? 'bg-white/20' : 'bg-primary-500/10'
                  }`}>
                    <plan.icon className={`h-8 w-8 ${plan.popular ? 'text-coffee-900' : 'text-primary-500'}`} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? plan.textColor : 'text-coffee-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.popular ? 'text-coffee-900' : 'text-coffee-600'}`}>
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center">
                    <span className={`text-4xl font-bold ${plan.popular ? plan.textColor : 'text-coffee-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-lg ml-1 ${plan.popular ? 'text-coffee-900' : 'text-coffee-600'}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={`text-sm mt-2 ${plan.popular ? 'text-coffee-900' : 'text-coffee-600'}`}>
                    + IVA • Sin compromiso • Cancela cuando quieras
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3">
                      <Check className={`h-5 w-5 mt-0.5 shrink-0 ${
                        plan.popular ? 'text-coffee-900' : 'text-primary-500'
                      }`} />
                      <span className={`text-sm ${plan.popular ? 'text-coffee-900' : 'text-coffee-700'}`}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-all duration-300 ${
                  plan.popular
                    ? 'bg-white text-primary-500 hover:bg-cream-100 shadow-lg hover:shadow-xl'
                    : 'bg-primary-500 text-coffee-900 hover:bg-primary-600 shadow-md hover:shadow-lg'
                }`}>
                  {plan.popular ? 'Comenzar Ahora - Más Popular' : 'Comenzar Prueba Gratuita'}
                </button>

                {plan.popular && (
                  <p className="text-center text-gray-900 text-xs mt-3">
                    ⭐ Elegido por el 73% de nuestras cafeterías
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto border border-cream-200">
            <h3 className="text-2xl font-bold text-coffee-900 mb-4">
              ¿Necesitas un plan personalizado? ☕
            </h3>
            <p className="text-coffee-600 mb-6 max-w-2xl mx-auto">
              Si tienes más de 10 sucursales o necesidades específicas, 
              hablemos para crear el plan perfecto para tu imperio cafetero.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary-500 text-coffee-900 px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors">
                Contactar Ventas
              </button>
              <button className="border-2 border-coffee-300 text-coffee-700 px-6 py-3 rounded-lg font-semibold hover:border-primary-500 hover:text-primary-500 transition-colors">
                Agendar Demo Personalizada
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 text-6xl opacity-10 animate-float">☕</div>
        <div className="absolute bottom-40 right-20 text-4xl opacity-10 animate-float-delay">🥐</div>
        <div className="absolute top-60 right-10 text-5xl opacity-10 animate-float">🍰</div>
      </div>
    </section>
  );
};

export default PricingSection;