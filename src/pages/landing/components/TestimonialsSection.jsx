import { Star, Quote, Coffee, MapPin, TrendingUp } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "María González",
      role: "Dueña de Café Central",
      location: "Las Condes, Santiago",
      image: "/api/placeholder/80/80",
      rating: 5,
      quote: "TappMesa transformó completamente nuestra cafetería. Ahora nuestros clientes pueden personalizar sus bebidas desde la mesa y el flujo es mucho más eficiente. ¡Las ventas subieron un 35%!",
      metrics: {
        sales: "+35%",
        efficiency: "60% más rápido",
        satisfaction: "4.9/5.0"
      },
      badge: "Cafetería del Mes",
      specialty: "Especialidad en Latte Art"
    },
    {
      name: "Carlos Mendoza",
      role: "Gerente General",
      location: "Cadena 'Granos & Más' (5 sucursales)",
      image: "/api/placeholder/80/80",
      rating: 5,
      quote: "Gestionar 5 cafeterías era un caos hasta que llegó TappMesa. El sistema multitenant nos permite monitorear todas las sucursales desde un solo lugar. Los reportes automáticos son oro puro.",
      metrics: {
        branches: "5 Sucursales",
        orders: "2.5k mensuales",
        time: "70% menos admin"
      },
      badge: "Cliente Enterprise",
      specialty: "Cadena Exitosa"
    },
    {
      name: "Andrea Silva",
      role: "Propietaria de Rincón del Café",
      location: "Valparaíso",
      image: "/api/placeholder/80/80",
      rating: 5,
      quote: "Soy una cafetería pequeña y familiar. TappMesa se adaptó perfecto a nosotros. Mis clientes aman poder reservar 'su mesa favorita junto a la ventana'. Es como tener un asistente digital 24/7.",
      metrics: {
        reservations: "+80%",
        reviews: "5.0★ Google",
        loyalty: "40% clientes recurrentes"
      },
      badge: "Favorita Local",
      specialty: "Ambiente Acogedor"
    },
    {
      name: "Roberto Fuentes",
      role: "Dueño de Coffee Hub",
      location: "Providencia, Santiago",
      image: "/api/placeholder/80/80",
      rating: 5,
      quote: "El sistema de órdenes directas al barista es genial. Los clientes piden desde la mesa y nosotros preparamos sin errores. Además, el análisis de horarios pico nos ayudó a optimizar el personal.",
      metrics: {
        errors: "90% menos errores",
        peak: "Horarios optimizados",
        staff: "30% más productivo"
      },
      badge: "Barista Pro",
      specialty: "Café de Especialidad"
    },
    {
      name: "Javiera López",
      role: "Emprendedora Digital",
      location: "Startup Café Co-working",
      image: "/api/placeholder/80/80",
      rating: 5,
      quote: "Abrimos nuestra cafetería-coworking hace 6 meses y TappMesa fue clave desde el día 1. La integración con nuestro concepto digital es perfecta. ¡Los nómadas digitales lo aman!",
      metrics: {
        growth: "200% crecimiento",
        digital: "95% órdenes digitales",
        retention: "85% retención"
      },
      badge: "Innovadora del Año",
      specialty: "Café + Coworking"
    },
    {
      name: "Diego Ramírez",
      role: "Franquiciado Café Express",
      location: "Múltiples ubicaciones",
      image: "/api/placeholder/80/80",
      rating: 5,
      quote: "Como franquicia, la consistencia es todo. TappMesa nos da los mismos estándares en todas las ubicaciones, y el programa de lealtad funciona entre todas las sucursales. ¡Brillante!",
      metrics: {
        locations: "12 Ubicaciones",
        consistency: "100% estándares",
        loyalty: "500+ miembros activos"
      },
      badge: "Franquicia Exitosa",
      specialty: "Modelo Escalable"
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-linear-to-br from-white via-cream-100 to-cream-200">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Quote className="text-primary-500 h-8 w-8" />
            <span className="text-coffee-600 font-medium">Historias de Éxito Reales</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-coffee-900 mb-6">
            Cafeterías que <span className="text-primary-500">Brillan</span> con TappMesa
          </h2>
          <p className="text-xl text-coffee-600 max-w-3xl mx-auto leading-relaxed">
            Desde pequeñas cafeterías familiares hasta cadenas exitosas, 
            descubre cómo TappMesa está transformando el mundo del café en Chile.
          </p>
        </div>

        {/* Stats Banner */}
        <div className="bg-white rounded-2xl p-8 mb-16 shadow-lg border border-cream-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-500 mb-2">250+</div>
              <div className="text-coffee-600">Cafeterías Activas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-500 mb-2">45k+</div>
              <div className="text-coffee-600">Cafés Servidos/Mes</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-500 mb-2">4.9★</div>
              <div className="text-coffee-600">Satisfacción Promedio</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-500 mb-2">+40%</div>
              <div className="text-coffee-600">Aumento Ventas Promedio</div>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-cream-200 relative overflow-hidden"
            >
              {/* Background Decoration */}
              <div className="absolute top-4 right-4 text-6xl opacity-5">☕</div>
              
              {/* Badge */}
              <div className="absolute top-4 left-4">
                <span className="bg-primary-500/10 text-primary-600 px-3 py-1 rounded-full text-xs font-medium">
                  {testimonial.badge}
                </span>
              </div>

              <div className="pt-8">
                {/* Quote */}
                <div className="mb-6">
                  <Quote className="text-primary-500 h-8 w-8 mb-4 opacity-50" />
                  <p className="text-coffee-700 leading-relaxed text-lg">
                    "{testimonial.quote}"
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-cream-100 rounded-lg">
                  {Object.entries(testimonial.metrics).map(([key, value], metricIndex) => (
                    <div key={metricIndex} className="text-center">
                      <div className="font-bold text-primary-500 text-sm">{value}</div>
                      <div className="text-coffee-600 text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                    </div>
                  ))}
                </div>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full border-2 border-primary-500/20"
                    />
                    <div>
                      <h4 className="font-semibold text-coffee-900">{testimonial.name}</h4>
                      <p className="text-coffee-600 text-sm">{testimonial.role}</p>
                      <div className="flex items-center gap-1 text-coffee-500 text-xs">
                        <MapPin className="h-3 w-3" />
                        {testimonial.location}
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-coffee-600 text-xs">{testimonial.specialty}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Success Story Highlight */}
        <div className="bg-coffee-dark rounded-2xl p-8 text-center text-coffee-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-coffee-900 via-primary-500/20 to-coffee-900 opacity-50"></div>
          <div className="relative z-10">
            <div className="flex justify-center items-center gap-2 mb-4">
              <TrendingUp className="h-8 w-8 text-primary-300" />
              <span className="text-primary-300 font-medium">Historia de Éxito Destacada</span>
            </div>
            <h3 className="text-3xl font-bold mb-4">
              "De 1 a 12 cafeterías en 18 meses"
            </h3>
            <p className="text-coffee-900/90 max-w-3xl mx-auto text-lg leading-relaxed mb-6">
              Diego Ramírez comenzó con una sola cafetería en 2023. Con TappMesa logró 
              estandarizar procesos, optimizar operaciones y escalar a 12 ubicaciones exitosas. 
              Su historia demuestra el poder de la digitalización inteligente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-primary-500 text-coffee-900 px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors">
                Leer Historia Completa
              </button>
              <button className="border-2 border-white/30 text-coffee-900 px-6 py-3 rounded-lg font-semibold hover:border-primary-300 hover:text-primary-300 transition-colors">
                Comenzar Mi Historia
              </button>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-4 left-8 text-4xl opacity-20">☕</div>
          <div className="absolute bottom-4 right-8 text-3xl opacity-20">🏆</div>
          <div className="absolute top-1/2 left-4 text-2xl opacity-20">⭐</div>
        </div>

        {/* Floating Decorations */}
        <div className="absolute top-40 left-10 text-5xl opacity-10 animate-float">☕</div>
        <div className="absolute bottom-60 right-20 text-4xl opacity-10 animate-float-delay">🥐</div>
        <div className="absolute top-80 right-10 text-3xl opacity-10 animate-float">⭐</div>
      </div>
    </section>
  );
};

export default TestimonialsSection;