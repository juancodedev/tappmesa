import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 bg-linear-to-br from-primary via-primary/95 to-secondary relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
      
      <div className="container mx-auto px-4 relative z-10">
        <Card className="max-w-4xl mx-auto p-12 bg-card/95 backdrop-blur-sm border-2 border-primary-foreground/10 shadow-[var(--shadow-elevated)]">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent/20 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-accent">Oferta de Lanzamiento</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Comienza Gratis Hoy
              <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-2">
                Sin Tarjeta de Crédito
              </span>
            </h2>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Prueba todas las funciones durante 14 días. Si no te encanta, cancela sin compromiso. 
              Más de 300 cafeterías ya confían en nosotros.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button variant="hero" size="lg" className="group shadow-[var(--shadow-elevated)]">
                Empezar Prueba Gratuita
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="border-2 hover:bg-muted">
                <MessageCircle className="mr-2" />
                Hablar con un Experto
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span>14 días gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span>Sin tarjeta requerida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span>Cancela cuando quieras</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CTA;
