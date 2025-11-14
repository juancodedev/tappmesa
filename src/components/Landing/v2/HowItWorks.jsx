// src/components/Landing/v2/HowItWorks.jsx
import React from 'react';
import { QrCode, BookOpen, ShoppingCart, Send, CreditCard, Zap, CheckCircle, TrendingUp, Smile } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: <QrCode className="w-7 h-7" />,
      title: "Escanea el QR",
      description: "El cliente escanea el código QR en la mesa con su celular",
      detail: "Sin necesidad de descargar apps. Funciona directamente en el navegador del celular.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      number: 2,
      icon: <BookOpen className="w-7 h-7" />,
      title: "Explora el Menú",
      description: "Navega por el menú digital con fotos, descripciones y precios",
      detail: "Menú categorizado, buscador, filtros por alérgenos y preferencias dietéticas.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      number: 3,
      icon: <ShoppingCart className="w-7 h-7" />,
      title: "Personaliza y Agrega",
      description: "Personaliza los productos y agrégalos al carrito",
      detail: "Modifica ingredientes, elige tamaños, agrega notas especiales para la cocina.",
      gradient: "from-orange-500 to-red-500"
    },
    {
      number: 4,
      icon: <Send className="w-7 h-7" />,
      title: "Envía tu Orden",
      description: "Revisa y confirma tu pedido. Se envía directo a cocina",
      detail: "La orden llega inmediatamente a la cocina con todos los detalles necesarios.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      number: 5,
      icon: <CreditCard className="w-7 h-7" />,
      title: "Paga Fácil",
      description: "Elige tu método de pago preferido cuando termines",
      detail: "Pago con tarjeta, transferencia, efectivo o billeteras digitales.",
      gradient: "from-primary-500 to-secondary-500"
    }
  ];

  const stats = [
    {
      icon: <Zap className="w-6 h-6" />,
      value: "40%",
      label: "Más Rápido",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      value: "0",
      label: "Errores",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      value: "+35%",
      label: "Más Ventas",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Smile className="w-6 h-6" />,
      value: "98%",
      label: "Satisfacción",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <section id="como-funciona" className="py-24 lg:py-32 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20 animate-fade-in">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
            ¿Cómo funciona
            <span className="block bg-linear-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mt-2">
              TappMesa?
            </span>
          </h2>
          <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto">
            Simple, rápido y sin complicaciones para clientes y cafeterías
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto mb-20">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative mb-6 last:mb-0 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="group relative bg-white p-6 lg:p-8 rounded-2xl border border-gray-200/50 hover:border-gray-300 shadow-lg hover:shadow-2xl transition-all">
                {/* Gradient glow effect on hover */}
                <div className={`absolute inset-0 bg-linear-to-r ${step.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />

                <div className="relative flex flex-col sm:flex-row gap-6 items-start">
                  {/* Number Badge */}
                  <div className="shrink-0">
                    <div className="relative">
                      <div className={`w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-linear-to-br ${step.gradient} flex items-center justify-center text-xl lg:text-2xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform`}>
                        {step.number}
                      </div>
                      {index < steps.length - 1 && (
                        <div className="hidden sm:block absolute left-1/2 top-full w-0.5 h-6 bg-gradient-to-b from-gray-300 to-transparent -translate-x-1/2" />
                      )}
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`shrink-0 p-4 rounded-xl bg-linear-to-br ${step.gradient} text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2 text-gray-900">{step.title}</h3>
                    <p className="text-lg text-gray-700 mb-2 font-medium">
                      {step.description}
                    </p>
                    <p className="text-gray-600">
                      {step.detail}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="group relative bg-white p-6 lg:p-8 rounded-2xl border border-gray-200/50 hover:border-gray-300 shadow-lg hover:shadow-2xl transition-all animate-scale-in"
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              {/* Gradient glow effect on hover */}
              <div className={`absolute inset-0 bg-linear-to-r ${stat.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`} />

              <div className="relative text-center">
                <div className={`inline-flex p-3 rounded-xl bg-linear-to-br ${stat.gradient} text-white shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold bg-linear-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-gray-600">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
