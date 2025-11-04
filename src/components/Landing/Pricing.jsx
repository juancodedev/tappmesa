import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Coffee, TrendingUp } from "lucide-react";

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
        "Analytics detallados",
        "Programa de lealtad",
        "Integración con delivery",
        "Personalización de marca",
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
        "Integración con sistemas POS",
        "Dashboard ejecutivo",
        "Análisis predictivo de demanda",
        "Gestión de inventario automática",
        "Reportes personalizados",
        "Capacitación para equipo"
      ],
      popular: false,
      icon: <Coffee className="w-6 h-6" />
    }
  ];

  return (
    <section id="precios" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full mb-4">
            <Coffee className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Planes Diseñados para Cafeterías</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Precios Transparentes
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Planes flexibles que crecen contigo. Sin costos ocultos, sin sorpresas. 
            Solo gestión digital perfecta para tu cafetería.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-12">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative p-8 animate-scale-in ${
                plan.popular 
                  ? "border-primary shadow-[var(--shadow-elevated)] scale-105" 
                  : "hover:shadow-[var(--shadow-elevated)]"
              } transition-all`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-secondary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Más Popular
                </div>
              )}

              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-accent/10 p-2 rounded-lg text-accent">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  + IVA • Sin compromiso • Cancela cuando quieras
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                className="w-full"
              >
                {plan.popular ? "Comenzar Ahora" : "Prueba Gratuita"}
              </Button>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center max-w-3xl mx-auto p-8 bg-gradient-to-r from-accent/10 to-secondary/10 rounded-2xl border animate-fade-in">
          <h3 className="text-2xl font-bold mb-3">
            ¿Necesitas un plan personalizado? ☕
          </h3>
          <p className="text-muted-foreground mb-6">
            Si tienes más de 10 sucursales o necesidades específicas, hablemos para crear 
            el plan perfecto para tu negocio cafetero.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="default" size="lg">
              Contactar Ventas
            </Button>
            <Button variant="outline" size="lg">
              Agendar Demo Personalizada
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
