import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const Benefits = () => {
  const ownerBenefits = [
    "Reduce costos operativos hasta 40%",
    "Control total de inventario en tiempo real",
    "Reportes y analytics automáticos",
    "Menos errores en pedidos",
    "Mayor rotación de mesas",
    "Personal más eficiente y productivo",
  ];

  const customerBenefits = [
    "Orden sin esperar al mesero",
    "Menú con fotos y descripciones claras",
    "Personaliza tu pedido fácilmente",
    "Ve el total antes de confirmar",
    "Paga cuando quieras",
    "Experiencia moderna y cómoda",
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Para Dueños */}
          <Card className="p-10 border-2 border-primary/20 bg-card shadow-[var(--shadow-elevated)] animate-fade-in">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                <span className="text-sm font-semibold text-primary">Para Dueños</span>
              </div>
              <h3 className="text-3xl font-bold mb-3">Optimiza tu Operación</h3>
              <p className="text-muted-foreground">
                Gestiona tu cafetería de forma inteligente y aumenta tus ganancias
              </p>
            </div>
            
            <ul className="space-y-4">
              {ownerBenefits.map((benefit, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-3 animate-scale-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CheckCircle2 className="w-6 h-6 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Para Clientes */}
          <Card className="p-10 border-2 border-secondary/20 bg-card shadow-[var(--shadow-elevated)] animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full mb-4">
                <span className="text-sm font-semibold text-secondary">Para Clientes</span>
              </div>
              <h3 className="text-3xl font-bold mb-3">Experiencia Superior</h3>
              <p className="text-muted-foreground">
                Tus clientes disfrutarán de un servicio rápido y moderno
              </p>
            </div>
            
            <ul className="space-y-4">
              {customerBenefits.map((benefit, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-3 animate-scale-in"
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  <CheckCircle2 className="w-6 h-6 text-secondary shrink-0 mt-0.5" />
                  <span className="text-foreground font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
