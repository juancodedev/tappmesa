import { useState, useEffect } from 'react';
import { 
  Coffee, 
  ArrowRight, 
  Star, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Smartphone,
  BarChart3,
  Zap,
  Heart,
  Gift
} from 'lucide-react';

const CTASection = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30
  });

  const [stats, setStats] = useState({
    cafesActive: 250,
    ordersToday: 1247,
    revenue: 4850000
  });

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 23, minutes: 59, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Real-time stats simulation
  useEffect(() => {
    const statsTimer = setInterval(() => {
      setStats(prev => ({
        cafesActive: prev.cafesActive + (Math.random() > 0.8 ? 1 : 0),
        ordersToday: prev.ordersToday + Math.floor(Math.random() * 3),
        revenue: prev.revenue + Math.floor(Math.random() * 15000)
      }));
    }, 4000);

    return () => clearInterval(statsTimer);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const benefits = [
    {
      icon: TrendingUp,
      title: 'Aumenta tus Ventas 40%',
      desc: 'Promedio de crecimiento en 3 meses',
      color: 'text-green-500'
    },
    {
      icon: Clock,
      title: 'Ahorra 15 Horas/Semana',
      desc: 'Automatización de procesos',
      color: 'text-blue-500'
    },
    {
      icon: Users,
      title: 'Clientes Más Felices',
      desc: '4.9★ satisfacción promedio',
      color: 'text-yellow-500'
    },
    {
      icon: BarChart3,
      title: 'Decisiones Inteligentes',
      desc: 'Analytics en tiempo real',
      color: 'text-purple-500'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-coffee-900 via-coffee-800 to-primary-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-coffee-900/90 via-primary-500/20 to-coffee-900/90"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-20 left-10 text-8xl opacity-5 text-white animate-float">☕</div>
        <div className="absolute bottom-20 right-20 text-6xl opacity-5 text-white animate-float-delay">🚀</div>
        <div className="absolute top-40 right-10 text-5xl opacity-5 text-white animate-float">⭐</div>
        <div className="absolute bottom-40 left-20 text-7xl opacity-5 text-white animate-float-delay">📱</div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Live Stats Banner */}
        <div className="text-center mb-12">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/80 font-medium">Estadísticas en Vivo</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stats.cafesActive}</div>
                <div className="text-white/70 text-sm">Cafeterías Activas Ahora</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stats.ordersToday.toLocaleString()}</div>
                <div className="text-white/70 text-sm">Órdenes Procesadas Hoy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{formatPrice(stats.revenue)}</div>
                <div className="text-white/70 text-sm">Ingresos Generados Hoy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main CTA */}
        <div className="text-center mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Tu Cafetería Digital
            <br />
            <span className="text-primary-300">Comienza Hoy</span>
          </h2>
          
          <p className="text-xl text-white/90 max-w-3xl mx-auto leading-relaxed mb-8">
            Únete a las cafeterías más exitosas de Chile. Configuración en 15 minutos, 
            soporte en español, sin compromisos a largo plazo.
          </p>

          {/* Limited Time Offer */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-400 rounded-2xl p-6 max-w-2xl mx-auto mb-8 border border-primary-300">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gift className="h-6 w-6 text-white" />
              <span className="text-white font-bold text-lg">Oferta de Lanzamiento</span>
            </div>
            
            <div className="text-white mb-4">
              <div className="text-3xl font-bold mb-1">50% OFF</div>
              <div className="text-primary-100">Primer mes de cualquier plan</div>
            </div>

            {/* Countdown */}
            <div className="flex justify-center gap-4 mb-4">
              <div className="bg-white/20 rounded-lg p-3 min-w-[60px]">
                <div className="text-2xl font-bold text-white">{timeLeft.hours.toString().padStart(2, '0')}</div>
                <div className="text-primary-100 text-xs">Horas</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 min-w-[60px]">
                <div className="text-2xl font-bold text-white">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                <div className="text-primary-100 text-xs">Minutos</div>
              </div>
              <div className="bg-white/20 rounded-lg p-3 min-w-[60px]">
                <div className="text-2xl font-bold text-white">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                <div className="text-primary-100 text-xs">Segundos</div>
              </div>
            </div>

            <div className="text-primary-100 text-sm">
              ⏰ Válido solo para las primeras 100 cafeterías que se registren
            </div>
          </div>

          {/* Primary CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <button className="bg-white text-coffee-900 px-10 py-5 rounded-2xl text-xl font-bold hover:bg-cream-100 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 flex items-center justify-center gap-3">
              <Coffee className="h-6 w-6" />
              Registrar Mi Cafetería GRATIS
              <ArrowRight className="h-6 w-6" />
            </button>
            
            <button className="border-3 border-white/50 text-white px-10 py-5 rounded-2xl text-xl font-bold hover:border-white hover:bg-white/10 transition-all duration-300 flex items-center justify-center gap-3">
              <Smartphone className="h-6 w-6" />
              Ver Demo Interactiva
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-white/70 text-sm mb-12">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Sin Tarjeta de Crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Configuración en 15 Minutos</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Soporte 24/7 en Español</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Cancela Cuando Quieras</span>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center hover:bg-white/15 transition-all duration-300">
              <div className={`inline-flex p-3 rounded-full bg-white/20 mb-4`}>
                <benefit.icon className={`h-8 w-8 ${benefit.color}`} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{benefit.title}</h3>
              <p className="text-white/70 text-sm">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* Social Proof */}
        <div className="text-center mb-16">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Heart className="h-6 w-6 text-red-400" />
              <span className="text-white font-semibold text-lg">Amado por Dueños de Cafeterías</span>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-white/90 italic mb-3">
                  "TappMesa transformó mi cafetería. Mis clientes están encantados y mis ventas subieron 35%."
                </blockquote>
                <cite className="text-white/70 text-sm">- María González, Café Central</cite>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-white/90 italic mb-3">
                  "Gestionar 5 sucursales ahora es súper fácil. Los reportes automáticos son oro puro."
                </blockquote>
                <cite className="text-white/70 text-sm">- Carlos Mendoza, Granos & Más</cite>
              </div>

              <div className="text-center">
                <div className="flex justify-center mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-white/90 italic mb-3">
                  "La configuración fue súper rápida. En 20 minutos ya estaba sirviendo órdenes digitales."
                </blockquote>
                <cite className="text-white/70 text-sm">- Andrea Silva, Rincón del Café</cite>
              </div>
            </div>
          </div>
        </div>

        {/* Final Push */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-3xl p-8 border border-primary-400 max-w-3xl mx-auto shadow-2xl">
            <h3 className="text-3xl font-bold text-white mb-4">
              ¿Qué Esperas para Digitalizar tu Cafetería?
            </h3>
            
            <p className="text-primary-100 text-lg mb-6 leading-relaxed">
              Cada día que pasa sin TappMesa es dinero que dejas de ganar. 
              Tus competidores ya están digitalizados. <strong>Es tu momento.</strong>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button className="bg-white text-primary-600 px-8 py-4 rounded-xl text-lg font-bold hover:bg-cream-100 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3">
                <Zap className="h-5 w-5" />
                Empezar Ahora - 50% OFF
              </button>
              
              <button className="border-2 border-white/50 text-white px-8 py-4 rounded-xl text-lg font-bold hover:border-white hover:bg-white/10 transition-all duration-300">
                Hablar con un Especialista
              </button>
            </div>

            <div className="text-primary-200 text-sm">
              💡 <strong>Tip:</strong> Las cafeterías que se digitalizan primero en su zona capturan más mercado
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-12 text-center">
            <div className="text-white/60 text-sm mb-4">
              ¿Preguntas? Estamos aquí para ayudarte
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-white/80">
              <a href="mailto:hola@tappmesa.cl" className="hover:text-primary-300 transition-colors">
                📧 hola@tappmesa.cl
              </a>
              <a href="tel:+56900000000" className="hover:text-primary-300 transition-colors">
                📞 +56 9 0000 0000
              </a>
              <a href="#" className="hover:text-primary-300 transition-colors">
                💬 Chat en Vivo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;