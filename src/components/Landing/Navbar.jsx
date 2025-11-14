import { Button } from "@/components/ui/button";
import { Coffee } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-linear-to-br from-primary to-secondary p-2 rounded-lg">
              <Coffee className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
              CaféMesa
            </span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#caracteristicas" className="text-foreground hover:text-primary transition-colors font-medium">
              Características
            </a>
            <a href="#como-funciona" className="text-foreground hover:text-primary transition-colors font-medium">
              Cómo Funciona
            </a>
            <a href="#testimonios" className="text-foreground hover:text-primary transition-colors font-medium">
              Testimonios
            </a>
            <a href="#precios" className="text-foreground hover:text-primary transition-colors font-medium">
              Precios
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="hidden sm:inline-flex">
              Iniciar Sesión
            </Button>
            <Button variant="default">
              Prueba Gratis
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
