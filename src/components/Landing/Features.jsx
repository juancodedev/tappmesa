import { Card } from "@/components/ui/card";
import { ClipboardList, Users, TrendingUp, Zap, Clock, Wallet } from "lucide-react";

const features = [
  {
    icon: <ClipboardList className="w-8 h-8" />,
    title: "Menú Digital Completo",
    description: "Carta digital con fotos, descripciones y precios actualizados en tiempo real. Personalización de productos al instante.",
    color: "from-primary to-primary/80",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Pedidos Instantáneos",
    description: "Los pedidos llegan directo a la cocina y al barista. Cero errores de comunicación, máxima eficiencia.",
    color: "from-secondary to-accent",
  },
  {
    icon: <Clock className="w-8 h-8" />,
    title: "Ahorra Tiempo",
    description: "Reduce hasta 60% el tiempo de atención. Tus meseros se enfocan en servicio premium, no en tomar pedidos.",
    color: "from-accent to-secondary",
  },
  {
    icon: <Wallet className="w-8 h-8" />,
    title: "Pago Integrado",
    description: "Múltiples métodos de pago. Los clientes pagan cuando quieran, directamente desde su mesa.",
    color: "from-primary to-secondary",
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: "Aumenta Ventas",
    description: "Recomendaciones inteligentes y upselling automático aumentan el ticket promedio hasta un 35%.",
    color: "from-secondary to-primary",
  },
  {
    icon: <Users className="w-8 h-8" />,
    title: "Clientes Felices",
    description: "Experiencia moderna y sin esperas. Tus clientes ordenan a su ritmo y vuelven más seguido.",
    color: "from-accent to-primary",
  },
];

const Features = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            Todo lo que tu Cafetería
            <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Necesita para Crecer
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Moderniza tu operación y ofrece una experiencia que tus clientes amarán
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="p-8 hover:shadow-[var(--shadow-elevated)] transition-all duration-300 hover:scale-105 border-2 border-border/50 animate-scale-in group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-4 rounded-xl bg-linear-to-br ${feature.color} text-primary-foreground mb-6 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
