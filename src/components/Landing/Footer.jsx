import { Coffee, Facebook, Instagram, Twitter, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-accent p-2 rounded-lg">
                <Coffee className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold">CaféMesa</span>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              Moderniza tu cafetería con tecnología de pedidos digitales. Más eficiencia, más ventas, clientes más felices.
            </p>
          </div>

          {/* Producto */}
          <div>
            <h4 className="font-semibold mb-4">Producto</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-accent transition-colors">Características</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Precios</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Demo</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Integraciones</a></li>
            </ul>
          </div>

          {/* Recursos */}
          <div>
            <h4 className="font-semibold mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li><a href="#" className="hover:text-accent transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Guías</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">Soporte</a></li>
              <li><a href="#" className="hover:text-accent transition-colors">API Docs</a></li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/80">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:hola@cafemesa.com" className="hover:text-accent transition-colors">
                  hola@cafemesa.com
                </a>
              </li>
              <li className="flex gap-3 mt-4">
                <a href="#" className="hover:text-accent transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-accent transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="hover:text-accent transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
          <p>© 2025 CaféMesa. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-accent transition-colors">Privacidad</a>
            <a href="#" className="hover:text-accent transition-colors">Términos</a>
            <a href="#" className="hover:text-accent transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
