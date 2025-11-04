import { Card } from "@/components/ui/card";
import { Star, TrendingUp, Clock, Users } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      name: "María González",
      role: "Dueña de Café Central",
      location: "Las Condes, Santiago",
      specialty: "Especialidad en Latte Art",
      image: "☕",
      quote: "CaféMesa transformó completamente nuestra cafetería. Ahora nuestros clientes pueden personalizar sus bebidas desde la mesa y el flujo es mucho más eficiente. ¡Las ventas subieron un 35%!",
      stats: [
        { label: "Ventas", value: "+35%", icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Eficiencia", value: "60% más rápido", icon: <Clock className="w-4 h-4" /> },
        { label: "Satisfacción", value: "4.9/5.0", icon: <Star className="w-4 h-4" /> }
      ],
      badge: "Cafetería del Mes"
    },
    {
      name: "Carlos Mendoza",
      role: "Gerente General",
      location: "Cadena 'Granos & Más' (5 sucursales)",
      specialty: "Cadena Exitosa",
      image: "☕",
      quote: "Gestionar 5 cafeterías era un caos hasta que llegó CaféMesa. El sistema nos permite monitorear todas las sucursales desde un solo lugar. Los reportes automáticos son oro puro.",
      stats: [
        { label: "Sucursales", value: "5", icon: <Users className="w-4 h-4" /> },
        { label: "Órdenes", value: "2.5k mensuales", icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Admin", value: "70% menos", icon: <Clock className="w-4 h-4" /> }
      ],
      badge: "Cliente Enterprise"
    },
    {
      name: "Andrea Silva",
      role: "Propietaria de Rincón del Café",
      location: "Valparaíso",
      specialty: "Ambiente Acogedor",
      image: "☕",
      quote: "Soy una cafetería pequeña y familiar. CaféMesa se adaptó perfecto a nosotros. Mis clientes aman poder reservar 'su mesa favorita junto a la ventana'. Es como tener un asistente digital 24/7.",
      stats: [
        { label: "Reservas", value: "+80%", icon: <TrendingUp className="w-4 h-4" /> },
        { label: "Google", value: "5.0★", icon: <Star className="w-4 h-4" /> },
        { label: "Recurrentes", value: "40%", icon: <Users className="w-4 h-4" /> }
      ],
      badge: "Favorita Local"
    }
  ];

  return (
    <section id="testimonios" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Historias de Éxito Reales
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Desde pequeñas cafeterías familiares hasta cadenas exitosas, descubre cómo 
            CaféMesa está transformando el mundo del café.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="p-4 bg-card rounded-xl border">
              <div className="text-3xl font-bold text-primary mb-1">250+</div>
              <div className="text-sm text-muted-foreground">Cafeterías Activas</div>
            </div>
            <div className="p-4 bg-card rounded-xl border">
              <div className="text-3xl font-bold text-primary mb-1">45k+</div>
              <div className="text-sm text-muted-foreground">Cafés Servidos/Mes</div>
            </div>
            <div className="p-4 bg-card rounded-xl border">
              <div className="text-3xl font-bold text-primary mb-1">4.9★</div>
              <div className="text-sm text-muted-foreground">Satisfacción Promedio</div>
            </div>
            <div className="p-4 bg-card rounded-xl border">
              <div className="text-3xl font-bold text-primary mb-1">+40%</div>
              <div className="text-sm text-muted-foreground">Aumento Ventas</div>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={testimonial.name}
              className="p-8 hover:shadow-[var(--shadow-elevated)] transition-all animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-accent/10 px-3 py-1 rounded-full mb-6">
                <span className="text-2xl">{testimonial.image}</span>
                <span className="text-xs font-semibold text-accent">{testimonial.badge}</span>
              </div>

              {/* Quote */}
              <blockquote className="text-foreground/90 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                {testimonial.stats.map((stat, idx) => (
                  <div key={idx} className="text-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-center mb-1 text-primary">
                      {stat.icon}
                    </div>
                    <div className="font-bold text-sm mb-0.5">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Author Info */}
              <div className="pt-6 border-t">
                <div className="font-bold text-lg mb-1">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground mb-1">{testimonial.role}</div>
                <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                <div className="text-xs text-accent mt-2">{testimonial.specialty}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 animate-fade-in">
          <p className="text-lg text-muted-foreground mb-4">
            Amado por Dueños de Cafeterías en Todo Chile
          </p>
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 fill-accent text-accent" />
            ))}
            <span className="ml-2 text-lg font-semibold">4.9 / 5.0</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
