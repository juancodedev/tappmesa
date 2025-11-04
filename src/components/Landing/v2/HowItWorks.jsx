// src/components/Landing/v2/HowItWorks.jsx
import React from 'react';
import { QrCode, BookOpen, ShoppingCart, Send, CreditCard } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: <QrCode className="w-8 h-8" />,
      title: "Escanea el QR",
      description: "El cliente escanea el código QR en la mesa con su celular",
      detail: "Sin necesidad de descargar apps. Funciona directamente en el navegador del celular."
    },
    {
      number: 2,
      icon: <BookOpen className="w-8 h-8" />,
      title: "Explora el Menú",
      description: "Navega por el menú digital con fotos, descripciones y precios",
      detail: "Menú categorizado, buscador, filtros por alérgenos y preferencias dietéticas."
    },
    {
      number: 3,
      icon: <ShoppingCart className="w-8 h-8" />,
      title: "Personaliza y Agrega",
      description: "Personaliza los productos y agrégalos al carrito",
      detail: "Modifica ingredientes, elige tamaños, agrega notas especiales para la cocina."
    },
    {
      number: 4,
      icon: <Send className="w-8 h-8" />,
      title: "Envía tu Orden",
      description: "Revisa y confirma tu pedido. Se envía directo a cocina",
      detail: "La orden llega inmediatamente a la cocina con todos los detalles necesarios."
    },
    {
      number: 5,
      icon: <CreditCard className="w-8 h-8" />,
      title: "Paga Fácil",
      description: "Elige tu método de pago preferido cuando termines",
      detail: "Pago con tarjeta, transferencia, efectivo o billeteras digitales."
    }
  ];

  return (
    <section id="como-funciona" className="py-20 bg-cream-100/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-coffee-900">
            ¿Cómo funciona TappMesa?
          </h2>
          <p className="text-xl text-coffee-600 max-w-2xl mx-auto">
            Simple, rápido y sin complicaciones para clientes y cafeterías
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative mb-8 last:mb-0 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="p-8 bg-cream-50 rounded-xl border-2 border-cream-300/50 hover:shadow-coffee-lg transition-all">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Number Badge */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-2xl font-bold text-cream-50">
                        {step.number}
                      </div>
                      {index < steps.length - 1 && (
                        <div className="hidden md:block absolute left-1/2 top-full w-0.5 h-8 bg-gradient-to-b from-primary-500/50 to-transparent -translate-x-1/2" />
                      )}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="flex-shrink-0 bg-terracotta-500/10 p-4 rounded-xl text-terracotta-500">
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2 text-coffee-900">{step.title}</h3>
                    <p className="text-lg text-coffee-900/90 mb-2">
                      {step.description}
                    </p>
                    <p className="text-sm text-coffee-600">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="text-center p-6 bg-cream-50 rounded-xl border-2 border-cream-300/50 animate-scale-in" style={{ animationDelay: "0.6s" }}>
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-2xl font-bold text-primary-500 mb-1">40%</div>
            <div className="text-sm text-coffee-600">Más Rápido</div>
          </div>
          <div className="text-center p-6 bg-cream-50 rounded-xl border-2 border-cream-300/50 animate-scale-in" style={{ animationDelay: "0.7s" }}>
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-bold text-primary-500 mb-1">0</div>
            <div className="text-sm text-coffee-600">Errores</div>
          </div>
          <div className="text-center p-6 bg-cream-50 rounded-xl border-2 border-cream-300/50 animate-scale-in" style={{ animationDelay: "0.8s" }}>
            <div className="text-3xl mb-2">📈</div>
            <div className="text-2xl font-bold text-primary-500 mb-1">+35%</div>
            <div className="text-sm text-coffee-600">Más Ventas</div>
          </div>
          <div className="text-center p-6 bg-cream-50 rounded-xl border-2 border-cream-300/50 animate-scale-in" style={{ animationDelay: "0.9s" }}>
            <div className="text-3xl mb-2">😊</div>
            <div className="text-2xl font-bold text-primary-500 mb-1">98%</div>
            <div className="text-sm text-coffee-600">Satisfacción</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
