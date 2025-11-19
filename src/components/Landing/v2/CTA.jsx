// src/components/Landing/v2/CTA.jsx
import React from 'react';
import { ArrowRight, MessageCircle, Sparkles, CheckCircle2, Zap } from 'lucide-react';

const CTA = () => {
  return (
    <section className="py-24 lg:py-32 bg-linear-to-br from-gray-50 via-primary-50/20 to-gray-50 relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary-300/20 rounded-full blur-3xl animate-float-delay" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Main CTA Card */}
          <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-linear-to-r from-primary-600 via-secondary-600 to-primary-600 opacity-10" />

            <div className="relative p-8 lg:p-16">
              <div className="text-center animate-fade-in">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-linear-to-r from-primary-100 to-secondary-100 px-5 py-2.5 rounded-full mb-8 border border-primary-200/50">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-bold text-primary-700">Oferta Especial de Lanzamiento</span>
                </div>

                {/* Heading */}
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
                  Comienza Gratis Hoy
                  <span className="block bg-linear-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mt-3">
                    Sin Tarjeta de Crédito
                  </span>
                </h2>

                {/* Description */}
                <p className="text-xl lg:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                  Prueba todas las funciones durante 14 días. Si no te encanta, cancela sin compromiso.
                  <span className="block mt-2 font-semibold text-gray-700">Más de 300 cafeterías ya confían en nosotros.</span>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                  <button className="group w-full sm:w-auto px-10 py-5 bg-linear-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:shadow-2xl hover:shadow-primary-500/30 hover:scale-105 transition-all font-bold text-lg flex items-center justify-center gap-3">
                    <Zap className="w-5 h-5" />
                    Empezar Prueba Gratuita
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button className="w-full sm:w-auto px-10 py-5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-bold text-lg flex items-center justify-center gap-3">
                    <MessageCircle className="w-5 h-5" />
                    Hablar con un Experto
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-6 lg:gap-10">
                  <div className="flex items-center gap-2.5 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <span className="font-semibold">14 días gratis</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <span className="font-semibold">Sin tarjeta requerida</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <span className="font-semibold">Cancela cuando quieras</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                    <span className="font-semibold">Soporte 24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Bar */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Únete a cientos de cafeterías que ya están transformando su negocio con TappMesa
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
