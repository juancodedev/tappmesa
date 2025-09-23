// src/pages/landing/components/CTASection.jsx - Versión con Tailwind
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleQuickStart = () => {
    navigate('/register');
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envío de email
    setTimeout(() => {
      setIsSubmitting(false);
      navigate(`/register?email=${encodeURIComponent(email)}`);
    }, 1000);
  };

  const benefits = [
    {
      icon: '⚡',
      title: 'Configuración en 10 minutos',
      description: 'Tu restaurante digital listo en menos de 10 minutos'
    },
    {
      icon: '🎯',
      title: 'Soporte personalizado',
      description: 'Te acompañamos en cada paso de la configuración'
    },
    {
      icon: '📈',
      title: 'Resultados inmediatos',
      description: 'Comienza a ver mejoras desde el primer día'
    },
    {
      icon: '🔄',
      title: 'Sin compromiso',
      description: 'Cancela cuando quieras, sin penalizaciones'
    }
  ];

  const urgencyFactors = [
    'Únete a 500+ restaurantes que ya digitalizaron su operación',
    'Más de 50,000 órdenes procesadas exitosamente',
    'Promedio de 35% de aumento en ventas reportado',
    '98% de clientes satisfechos con el servicio'
  ];

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-primary-500 to-primary-600">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main CTA */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="text-white">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              ¿Listo para revolucionar tu restaurante?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Únete a cientos de restaurantes que ya transformaron su negocio con TappMesa. 
              Comienza tu prueba gratuita hoy mismo.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-3">
                  <div className="text-2xl">{benefit.icon}</div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{benefit.title}</h4>
                    <p className="text-primary-100 text-sm">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button 
                onClick={handleQuickStart}
                className="bg-white text-primary-500 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg touch-target"
              >
                Comenzar Prueba Gratuita
              </button>
              
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@restaurante.com"
                  className="flex-1 px-4 py-4 rounded-lg border border-primary-300 focus:ring-2 focus:ring-white focus:border-transparent"
                  required
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-primary-700 hover:bg-primary-800 text-white px-6 py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 touch-target"
                >
                  {isSubmitting ? 'Enviando...' : 'Recibir Info'}
                </button>
              </form>
            </div>

            <p className="text-primary-100 text-sm">
              ✓ 14 días gratis • ✓ Sin tarjeta de crédito • ✓ Configuración incluida
            </p>
          </div>

          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <div className="flex items-center justify-center mb-6">
                <div className="text-6xl">🏪</div>
                <div className="text-4xl mx-4">→</div>
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <div className="space-y-2">
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                      📈 +35% ventas
                    </div>
                    <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                      ⚡ +40% eficiencia
                    </div>
                    <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-semibold">
                      😊 98% satisfacción
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof / Urgency */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-16">
          <h3 className="text-xl font-bold text-white text-center mb-6">¿Por qué elegir TappMesa ahora?</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {urgencyFactors.map((factor, index) => (
              <div key={index} className="flex items-center gap-3 text-white">
                <span className="text-green-400 font-bold">✓</span>
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-2xl max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              No te quedes atrás de la competencia
            </h3>
            <p className="text-gray-600 mb-8">
              Cada día que esperas es una oportunidad perdida de mejorar la experiencia 
              de tus clientes y aumentar tus ventas.
            </p>
            
            <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <span className="font-bold text-gray-900">Oferta Especial</span>
                  <div className="text-sm text-gray-600">Configuración gratuita por tiempo limitado</div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleQuickStart}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-lg font-semibold text-lg mb-6 transition-all duration-300 transform hover:scale-105 touch-target"
            >
              Sí, quiero digitalizar mi restaurante
            </button>
            
            <div className="text-center text-gray-600">
              <p className="mb-2">¿Prefieres hablar con alguien?</p>
              <a href="tel:+56912345678" className="text-primary-500 hover:text-primary-600 font-semibold">
                📞 +56 9 1234 5678
              </a>
              <div className="text-sm text-gray-500 mt-1">Lun-Vie 9:00-18:00</div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {[
                { icon: '🔒', text: 'Datos Seguros' },
                { icon: '🇨🇱', text: 'Empresa Chilena' },
                { icon: '💳', text: 'Sin Tarjeta' },
                { icon: '📞', text: 'Soporte 24/7' }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Reversal */}
        <div className="text-center mt-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 max-w-xl mx-auto">
            <h4 className="text-lg font-bold text-white mb-3">Garantía de satisfacción 100%</h4>
            <p className="text-primary-100 mb-4">
              Si en los primeros 30 días no estás completamente satisfecho, 
              te devolvemos tu dinero sin preguntas.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm text-primary-100">
              <span>✓ Soporte técnico incluido</span>
              <span>✓ Capacitación personalizada</span>
              <span>✓ Migración de datos gratuita</span>
              <span>✓ Sin costos ocultos</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;