// src/components/Landing/v2/CTA.jsx
import React from 'react';
import { ArrowRight, MessageCircle, Sparkles } from 'lucide-react';

const CTA = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary-500 via-primary-500/95 to-secondary-500 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto p-12 bg-cream-50/95 backdrop-blur-sm rounded-2xl border-2 border-cream-50/10 shadow-coffee-2xl">
          <div className="text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-terracotta-500/20 px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-terracotta-500" />
              <span className="text-sm font-semibold text-terracotta-500">Oferta de Lanzamiento</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-coffee-900">
              Comienza Gratis Hoy
              <span className="block bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent mt-2">
                Sin Tarjeta de Crédito
              </span>
            </h2>

            <p className="text-xl text-coffee-600 mb-10 max-w-2xl mx-auto">
              Prueba todas las funciones durante 14 días. Si no te encanta, cancela sin compromiso.
              Más de 300 cafeterías ya confían en nosotros.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button className="group px-8 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-cream-50 rounded-lg hover:shadow-glow-coffee-lg transition-all font-medium text-base flex items-center gap-2">
                Empezar Prueba Gratuita
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-3 border-2 border-coffee-300 text-coffee-900 rounded-lg hover:bg-cream-100 transition-all font-medium text-base flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Hablar con un Experto
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-coffee-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-terracotta-500 rounded-full" />
                <span>14 días gratis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-terracotta-500 rounded-full" />
                <span>Sin tarjeta requerida</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-terracotta-500 rounded-full" />
                <span>Cancela cuando quieras</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-terracotta-500 rounded-full" />
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
