// src/pages/landing/components/PricingSection.jsx - Versión con Tailwind
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const navigate = useNavigate();

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'Perfecto para empezar',
      icon: '🚀',
      popular: false,
      pricing: {
        monthly: 29900,
        annually: 299000
      },
      description: 'Ideal para cafeterías y restaurantes pequeños',
      features: [
        'Hasta 10 mesas',
        'Menú digital ilimitado',
        'Carrito de compras',
        'Comandas básicas',
        'Panel de administración',
        'Soporte por email',
        'Códigos QR personalizados',
        'Estadísticas básicas'
      ],
      limitations: [
        'Sin sistema de reservas',
        'Sin personalización avanzada',
        'Sin integraciones externas'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      subtitle: 'El más popular',
      icon: '⭐',
      popular: true,
      pricing: {
        monthly: 59900,
        annually: 599000
      },
      description: 'Para restaurantes en crecimiento',
      features: [
        'Hasta 50 mesas',
        'Todo de Starter',
        'Sistema de reservas completo',
        'Personalización avanzada',
        'Múltiples métodos de pago',
        'Reportes detallados',
        'Soporte prioritario',
        'Integraciones básicas',
        'Gestión de inventario',
        'Promociones y descuentos'
      ],
      limitations: [
        'Sin marca blanca',
        'Integraciones limitadas'
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      subtitle: 'Solución completa',
      icon: '🏢',
      popular: false,
      pricing: {
        monthly: 149900,
        annually: 1499000
      },
      description: 'Para cadenas y restaurantes grandes',
      features: [
        'Mesas ilimitadas',
        'Todo de Professional',
        'Marca blanca completa',
        'API personalizada',
        'Integraciones ilimitadas',
        'Soporte 24/7',
        'Gerente de cuenta dedicado',
        'Análisis avanzado con IA',
        'Multi-sucursal',
        'Configuración personalizada',
        'SLA garantizado',
        'Capacitación presencial'
      ],
      limitations: []
    }
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getDiscountedPrice = (monthlyPrice) => {
    return monthlyPrice * 10; // 2 meses gratis en plan anual
  };

  const getSavings = (monthlyPrice) => {
    const yearlyTotal = monthlyPrice * 12;
    const discountedYearly = getDiscountedPrice(monthlyPrice);
    return yearlyTotal - discountedYearly;
  };

  const handleSelectPlan = (planId) => {
    navigate(`/register?plan=${planId}&billing=${billingCycle}`);
  };

  const handleContactSales = () => {
    window.open('mailto:ventas@tappmesa.com?subject=Consulta Plan Enterprise', '_blank');
  };

  return (
    <section id="pricing" className="py-16 lg:py-24 bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Planes que se adaptan a tu negocio
          </h2>
          <p className="text-xl text-gray-600">
            Desde cafeterías pequeñas hasta grandes cadenas de restaurantes
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-200">
            <div className="flex">
              <button
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  billingCycle === 'monthly' 
                    ? 'bg-primary-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-primary-500'
                }`}
                onClick={() => setBillingCycle('monthly')}
              >
                Mensual
              </button>
              <button
                className={`relative px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  billingCycle === 'annually' 
                    ? 'bg-primary-500 text-white shadow-md' 
                    : 'text-gray-600 hover:text-primary-500'
                }`}
                onClick={() => setBillingCycle('annually')}
              >
                Anual
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                  Ahorra 2 meses
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-3xl shadow-xl border-2 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
                plan.popular ? 'border-primary-500' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="bg-primary-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    Más Popular
                  </span>
                </div>
              )}
              
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">{plan.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.subtitle}</p>
                </div>

                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-sm text-gray-600">$</span>
                    <span className="text-4xl font-bold text-gray-900">
                      {billingCycle === 'monthly' 
                        ? (plan.pricing.monthly / 1000).toFixed(0)
                        : (plan.pricing.annually / 1000).toFixed(0)
                      }
                    </span>
                    <span className="text-sm text-gray-600 ml-1">
                      {billingCycle === 'monthly' ? '.900/mes' : '.000/año'}
                    </span>
                  </div>
                  
                  {billingCycle === 'annually' && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(plan.pricing.monthly * 12)}
                      </span>
                      <div className="text-sm text-green-600 font-semibold">
                        Ahorras {formatPrice(getSavings(plan.pricing.monthly))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-gray-600 mt-4">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <h4 className="font-semibold text-gray-900 mb-4">Incluye:</h4>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <span className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">
                          ✓
                        </span>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.limitations.length > 0 && (
                    <div className="mt-6">
                      <h5 className="font-semibold text-gray-900 mb-3">No incluye:</h5>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-center gap-3">
                            <span className="w-5 h-5 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold">
                              ✗
                            </span>
                            <span className="text-gray-500 text-sm">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {plan.id === 'enterprise' ? (
                    <button
                      onClick={handleContactSales}
                      className="w-full border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white py-4 rounded-lg font-semibold transition-all duration-300 touch-target"
                    >
                      Contactar Ventas
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSelectPlan(plan.id)}
                      className={`w-full py-4 rounded-lg font-semibold transition-all duration-300 touch-target ${
                        plan.popular
                          ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg'
                          : 'border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white'
                      }`}
                    >
                      Comenzar Gratis
                    </button>
                  )}
                  
                  <p className="text-center text-sm text-gray-500">
                    Prueba gratis por 14 días
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-12">Preguntas Frecuentes</h3>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                question: '¿Puedo cambiar de plan en cualquier momento?',
                answer: 'Sí, puedes actualizar o cambiar tu plan cuando quieras. Los cambios se aplican inmediatamente.'
              },
              {
                question: '¿Hay costos de configuración?',
                answer: 'No cobramos costos de configuración. Te ayudamos a configurar tu restaurante completamente gratis.'
              },
              {
                question: '¿Qué incluye el período de prueba?',
                answer: 'Acceso completo a todas las funcionalidades del plan seleccionado, sin restricciones.'
              },
              {
                question: '¿Ofrecen descuentos para múltiples sucursales?',
                answer: 'Sí, tenemos descuentos especiales para cadenas. Contáctanos para una cotización personalizada.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">{faq.question}</h4>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {[
            { icon: '🔒', title: 'Pagos Seguros', desc: 'Encriptación SSL y PCI compliance' },
            { icon: '📞', title: 'Soporte Local', desc: 'Equipo en Chile, en tu zona horaria' },
            { icon: '💾', title: 'Respaldo de Datos', desc: 'Backups automáticos diarios' },
            { icon: '📱', title: 'App Nativa', desc: 'Próximamente en App Store y Google Play' }
          ].map((indicator, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 text-center shadow-lg border border-gray-200">
              <div className="text-3xl mb-3">{indicator.icon}</div>
              <h4 className="font-semibold text-gray-900 mb-2">{indicator.title}</h4>
              <p className="text-sm text-gray-600">{indicator.desc}</p>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-200 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Necesitas algo personalizado?
            </h3>
            <p className="text-gray-600 mb-8">
              Trabajamos contigo para crear una solución que se adapte perfectamente a tu negocio
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/register')}
                className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 touch-target"
              >
                Comenzar Prueba Gratuita
              </button>
              <button 
                onClick={handleContactSales}
                className="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 touch-target"
              >
                Hablar con Ventas
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;