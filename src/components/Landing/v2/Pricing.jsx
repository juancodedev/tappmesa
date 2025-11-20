// src/components/Landing/v2/Pricing.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Check, TrendingUp, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const Pricing = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;

      // Transform database plans to component format
      const transformedPlans = (data || []).map((plan, index) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || 'Plan completo para tu negocio',
        price: formatCurrency(plan.price),
        rawPrice: plan.price,
        period: '/mes',
        features: buildFeatures(plan),
        popular: index === Math.floor(data.length / 2), // Mark middle plan as popular
        icon: index === Math.floor(data.length / 2) ? <TrendingUp className="w-6 h-6" /> : <Coffee className="w-6 h-6" />
      }));

      setPlans(transformedPlans);

      // Set initial index to middle (popular plan)
      const popularIndex = transformedPlans.findIndex(p => p.popular);
      setCurrentIndex(popularIndex >= 0 ? popularIndex : 0);

      // Scroll to popular plan after render
      setTimeout(() => {
        scrollToIndex(popularIndex >= 0 ? popularIndex : 0);
      }, 100);
    } catch (error) {
      console.error('Error loading plans:', error);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const buildFeatures = (plan) => {
    const features = [];

    // Add limits
    if (plan.max_products) {
      features.push(`Hasta ${plan.max_products} productos en menú`);
    }
    if (plan.max_tables) {
      features.push(`Hasta ${plan.max_tables} mesas`);
    }
    if (plan.max_people_per_table) {
      features.push(`${plan.max_people_per_table} personas por mesa`);
    }

    // Add features based on booleans
    if (plan.has_paper_prebill) {
      features.push('Pre-cuentas en papel');
    }
    if (plan.has_paper_command) {
      features.push('Comandas en papel');
    }
    if (plan.has_surveys) {
      features.push('Sistema de encuestas');
    }
    if (plan.has_analytics) {
      features.push('Analíticas avanzadas');
    }

    // Add standard features
    features.push('Menú digital personalizado');
    features.push('Códigos QR para mesas');
    features.push('Dashboard de gestión');
    features.push('Soporte técnico');

    return features;
  };

  const scrollToIndex = (index) => {
    if (carouselRef.current && plans.length > 0) {
      const container = carouselRef.current;
      const cardWidth = container.scrollWidth / plans.length;
      const scrollPosition = cardWidth * index;

      container.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      setCurrentIndex(index);
    }
  };

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : plans.length - 1;
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const newIndex = currentIndex < plans.length - 1 ? currentIndex + 1 : 0;
    scrollToIndex(newIndex);
  };

  const handleScroll = () => {
    if (carouselRef.current && plans.length > 0) {
      const container = carouselRef.current;
      const cardWidth = container.scrollWidth / plans.length;
      const newIndex = Math.round(container.scrollLeft / cardWidth);
      setCurrentIndex(newIndex);
    }
  };

  return (
    <section id="precios" className="py-20 bg-cream-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-terracotta-500/10 px-4 py-2 rounded-full mb-4">
            <Coffee className="w-4 h-4 text-terracotta-500" />
            <span className="text-sm font-medium text-terracotta-500">Planes Diseñados para Cafeterías</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-coffee-900">
            Precios Transparentes
          </h2>
          <p className="text-xl text-coffee-600 max-w-3xl mx-auto">
            Planes flexibles que crecen contigo. Sin costos ocultos, sin sorpresas.
            Solo gestión digital perfecta para tu cafetería.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-500 mx-auto mb-4"></div>
              <p className="text-coffee-600">Cargando planes...</p>
            </div>
          </div>
        )}

        {/* No Plans Message */}
        {!loading && plans.length === 0 && (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-coffee-400 mx-auto mb-4" />
            <p className="text-coffee-600">No hay planes disponibles en este momento.</p>
          </div>
        )}

        {/* Pricing Carousel */}
        {!loading && plans.length > 0 && (
          <div className="relative max-w-7xl mx-auto mb-12">
            {/* Navigation Buttons */}
            {plans.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 border border-cream-300"
                  aria-label="Plan anterior"
                >
                  <ChevronLeft className="w-6 h-6 text-coffee-900" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white transition-all hover:scale-110 border border-cream-300"
                  aria-label="Plan siguiente"
                >
                  <ChevronRight className="w-6 h-6 text-coffee-900" />
                </button>
              </>
            )}

            {/* Carousel Container */}
            <div
              ref={carouselRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-6 px-12 md:px-16 py-4"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {plans.map((plan, index) => (
                <div
                  key={plan.id}
                  className={`flex-shrink-0 w-[85vw] md:w-[400px] snap-center transition-all duration-300 ${
                    index === currentIndex ? 'scale-100 opacity-100' : 'scale-95 opacity-60'
                  }`}
                >
                  <div
                    className={`relative h-full p-8 bg-cream-50 rounded-xl border-2 ${
                      plan.popular
                        ? "border-primary-500 shadow-coffee-xl"
                        : "border-cream-300/50 shadow-coffee-lg"
                    } transition-all`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary-500 to-secondary-500 text-cream-50 px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                        Más Popular
                      </div>
                    )}

                    {/* Header */}
                    <div className="mb-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-terracotta-500/10 p-2 rounded-lg text-terracotta-500">
                          {plan.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-coffee-900">{plan.name}</h3>
                      </div>
                      <p className="text-sm text-coffee-600">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-coffee-900">{plan.price}</span>
                        <span className="text-coffee-600">{plan.period}</span>
                      </div>
                      <p className="text-xs text-coffee-600 mt-1">
                        + IVA • Sin compromiso • Cancela cuando quieras
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {plan.features.slice(0, 8).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                          <span className="text-sm text-coffee-900">{feature}</span>
                        </li>
                      ))}
                      {plan.features.length > 8 && (
                        <li className="text-sm text-coffee-600 font-medium">
                          + {plan.features.length - 8} características más
                        </li>
                      )}
                    </ul>

                    {/* CTA Button */}
                    <button
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-all ${
                        plan.popular
                          ? "bg-gradient-to-r from-primary-500 to-secondary-500 text-cream-50 hover:shadow-coffee-lg hover:scale-105"
                          : "border-2 border-cream-300 text-coffee-900 hover:bg-cream-100"
                      }`}
                      onClick={() => navigate('/register')}
                    >
                      {plan.popular ? "Comenzar Ahora" : "Prueba Gratuita"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Dots Indicator */}
            {plans.length > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {plans.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-primary-500'
                        : 'w-2 bg-cream-300 hover:bg-cream-400'
                    }`}
                    aria-label={`Ir al plan ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom CTA */}
        {!loading && (
          <div className="text-center max-w-3xl mx-auto p-8 bg-gradient-to-r from-terracotta-500/10 to-secondary-500/10 rounded-2xl border-2 border-cream-300/50 animate-fade-in">
            <h3 className="text-2xl font-bold mb-3 text-coffee-900">
              ¿Necesitas un plan personalizado? ☕
            </h3>
            <p className="text-coffee-600 mb-6">
              Si tienes más de 10 sucursales o necesidades específicas, hablemos para crear
              el plan perfecto para tu negocio cafetero.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button
                onClick={() => navigate('/contact-sales')}
                className="px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-cream-50 rounded-lg hover:shadow-coffee-lg transition-all font-medium">
                Contactar Ventas
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom CSS to hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default Pricing;
