import { Button } from "@/components/ui/button";
import { Coffee, QrCode, Smartphone, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-cafe.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Clientes ordenando desde tablets en cafetería moderna" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-primary-foreground animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Coffee className="w-4 h-4" />
              <span className="text-sm font-medium">Revoluciona tu Cafetería</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Tus Clientes Ordenan
              <span className="block bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                Desde su Mesa
              </span>
            </h1>
            
            <p className="text-xl mb-8 text-primary-foreground/90 leading-relaxed">
              Sistema de pedidos digital que moderniza tu cafetería. Sin meseros corriendo, sin esperas largas. 
              Solo café delicioso y clientes felices.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Button variant="hero" size="lg" className="group">
                Prueba Gratis 14 Días
                <TrendingUp className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="bg-background/10 backdrop-blur-sm border-primary-foreground/30 text-primary-foreground hover:bg-background/20">
                Ver Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="animate-scale-in" style={{ animationDelay: "0.2s" }}>
                <div className="text-3xl font-bold text-accent">300+</div>
                <div className="text-sm text-primary-foreground/80">Cafeterías</div>
              </div>
              <div className="animate-scale-in" style={{ animationDelay: "0.3s" }}>
                <div className="text-3xl font-bold text-accent">50k+</div>
                <div className="text-sm text-primary-foreground/80">Pedidos/Mes</div>
              </div>
              <div className="animate-scale-in" style={{ animationDelay: "0.4s" }}>
                <div className="text-3xl font-bold text-accent">98%</div>
                <div className="text-sm text-primary-foreground/80">Satisfacción</div>
              </div>
            </div>
          </div>

          {/* Right Column - Feature Cards */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <FeatureCard 
              icon={<QrCode className="w-6 h-6" />}
              title="Escanea QR"
              description="Cliente escanea código desde su mesa"
              delay="0.4s"
            />
            <FeatureCard 
              icon={<Smartphone className="w-6 h-6" />}
              title="Ordena Fácil"
              description="Elige productos, personaliza y paga en segundos"
              delay="0.5s"
            />
            <FeatureCard 
              icon={<Coffee className="w-6 h-6" />}
              title="Recibe Directo"
              description="Pedido llega a cocina automáticamente"
              delay="0.6s"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: string;
}

const FeatureCard = ({ icon, title, description, delay = "0s" }: FeatureCardProps) => {
  return (
    <div 
      className="flex items-start gap-4 bg-card/95 backdrop-blur-sm p-6 rounded-xl shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-elevated)] transition-all hover:scale-105 animate-scale-in"
      style={{ animationDelay: delay }}
    >
      <div className="bg-primary text-primary-foreground p-3 rounded-lg flex-shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
};

export default Hero;
