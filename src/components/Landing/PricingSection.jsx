// src/components/Landing/PricingSection.jsx
import { useState } from "react";
import { useInView } from "../../hooks/useInView";

export default function PricingSection({ onOpenRegister }) {
  const { ref, isInView } = useInView({ threshold: 0.2 });
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("professional");

  const discount = billingCycle === "annual" ? 0.2 : 0; // 20% descuento anual

  const plans = [
    {
      id: "basic",
      name: "Básico",
      subtitle: "Perfecto para empezar",
      icon: "🥉",
      monthlyPrice: 29000,
      features: [
        "Menú digital QR",
        "Sistema de pedidos básico",
        "Hasta 5 mesas",
        "Soporte por email",
        "Reportes básicos",
        "Integración con POS básica",
      ],
      limitations: [
        "Sin sistema de reservas",
        "Sin pagos integrados",
        "Sin analytics avanzados",
      ],
      highlight: false,
      cta: "Comenzar gratis",
      bestFor: "Cafeterías pequeñas y food trucks",
    },
    {
      id: "professional",
      name: "Profesional",
      subtitle: "Más popular para restaurantes",
      icon: "🥈",
      monthlyPrice: 49000,
      features: [
        "Todo lo del plan Básico",
        "Sistema de reservas completo",
        "Comandas digitales avanzadas",
        "Hasta 20 mesas",
        "Pagos integrados",
        "Soporte telefónico",
        "Analytics avanzados",
        "Personalización de marca",
        "Notificaciones SMS",
        "Programa de lealtad básico",
      ],
      limitations: ["Límite de 20 mesas", "API con limitaciones"],
      highlight: true,
      cta: "Prueba gratis 14 días",
      bestFor: "Restaurantes medianos y cadenas pequeñas",
      badge: "Más Popular",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      subtitle: "Para operaciones grandes",
      icon: "🥇",
      monthlyPrice: 99000,
      features: [
        "Todo lo del plan Profesional",
        "Mesas ilimitadas",
        "Personalización completa",
        "API completa y webhooks",
        "Integración POS avanzada",
        "Soporte 24/7 prioritario",
        "Manager dedicado",
        "Capacitación presencial",
        "Reportes personalizados",
        "Multi-ubicación",
        "White-label disponible",
      ],
      limitations: [],
      highlight: false,
      cta: "Contactar ventas",
      bestFor: "Cadenas de restaurantes y franquicias",
    },
  ];

  const calculatePrice = (monthlyPrice) => {
    const price =
      billingCycle === "annual" ? monthlyPrice * (1 - discount) : monthlyPrice;
    return Math.round(price);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    if (planId === "enterprise") {
      // Scroll to contact section
      document
        .getElementById("contact")
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      onOpenRegister();
    }
  };

  return (
    <section id="pricing" className="pricing-section" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <span className="badge-icon">💰</span>
            <span>Precios</span>
          </div>

          <h2 className="section-title">
            Planes que se adaptan a{" "}
            <span className="highlight">tu restaurante</span>
          </h2>

          <p className="section-description">
            Elige el plan perfecto para el tamaño de tu negocio. Sin costos
            ocultos, sin compromisos a largo plazo.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="billing-toggle">
          <span className={billingCycle === "monthly" ? "active" : ""}>
            Mensual
          </span>
          <button
            className={`toggle-switch ${
              billingCycle === "annual" ? "annual" : ""
            }`}
            onClick={() =>
              setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")
            }
          >
            <span className="toggle-slider"></span>
          </button>
          <span className={billingCycle === "annual" ? "active" : ""}>
            Anual
            <span className="discount-badge">-20%</span>
          </span>
        </div>

        {/* Trial Banner */}
        <div className="trial-banner">
          <div className="trial-content">
            <span className="trial-icon">🎉</span>
            <div className="trial-text">
              <strong>¡Prueba gratuita de 2 meses!</strong>
              <span>
                En todos los planes. Sin tarjeta de crédito requerida.
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-grid">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.highlight ? "featured" : ""} ${
                selectedPlan === plan.id ? "selected" : ""
              } ${isInView ? "animate-in" : ""}`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.badge && <div className="plan-badge">{plan.badge}</div>}

              <div className="plan-header">
                <div className="plan-icon">{plan.icon}</div>
                <div className="plan-info">
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-subtitle">{plan.subtitle}</p>
                </div>
              </div>

              <div className="plan-pricing">
                <div className="price-container">
                  <span className="price-amount">
                    {formatPrice(calculatePrice(plan.monthlyPrice))}
                  </span>
                  <span className="price-period">
                    /{billingCycle === "monthly" ? "mes" : "mes"}
                  </span>
                </div>

                {billingCycle === "annual" && (
                  <div className="price-savings">
                    Ahorras {formatPrice(plan.monthlyPrice * 12 * discount)} al
                    año
                  </div>
                )}

                <div className="price-note">
                  Por mesa • Facturación{" "}
                  {billingCycle === "monthly" ? "mensual" : "anual"}
                </div>
              </div>

              <div className="plan-features">
                <h4 className="features-title">Todo incluido:</h4>
                <ul className="features-list">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="feature-item">
                      <span className="feature-check">✓</span>
                      <span className="feature-text">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations.length > 0 && (
                  <div className="plan-limitations">
                    <h4 className="limitations-title">Limitaciones:</h4>
                    <ul className="limitations-list">
                      {plan.limitations.map((limitation, i) => (
                        <li key={i} className="limitation-item">
                          <span className="limitation-icon">⚠️</span>
                          <span className="limitation-text">{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="plan-footer">
                <div className="best-for">
                  <strong>Ideal para:</strong> {plan.bestFor}
                </div>

                <button
                  className={`plan-cta ${
                    plan.highlight ? "primary" : "secondary"
                  }`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {plan.cta}
                  <span className="cta-arrow">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="features-comparison">
          <h3 className="comparison-title">Comparación detallada</h3>

          <div className="comparison-table">
            <div className="table-header">
              <div className="feature-column">Funcionalidad</div>
              <div className="plan-column">Básico</div>
              <div className="plan-column">Profesional</div>
              <div className="plan-column">Enterprise</div>
            </div>

            {[
              {
                feature: "Menú digital QR",
                basic: true,
                pro: true,
                enterprise: true,
              },
              {
                feature: "Sistema de pedidos",
                basic: true,
                pro: true,
                enterprise: true,
              },
              {
                feature: "Máximo de mesas",
                basic: "5",
                pro: "20",
                enterprise: "Ilimitadas",
              },
              {
                feature: "Sistema de reservas",
                basic: false,
                pro: true,
                enterprise: true,
              },
              {
                feature: "Pagos integrados",
                basic: false,
                pro: true,
                enterprise: true,
              },
              {
                feature: "Analytics avanzados",
                basic: false,
                pro: true,
                enterprise: true,
              },
              {
                feature: "API completa",
                basic: false,
                pro: "Limitada",
                enterprise: true,
              },
              {
                feature: "Soporte",
                basic: "Email",
                pro: "Teléfono",
                enterprise: "24/7",
              },
              {
                feature: "Multi-ubicación",
                basic: false,
                pro: false,
                enterprise: true,
              },
            ].map((row, index) => (
              <div key={index} className="table-row">
                <div className="feature-cell">{row.feature}</div>
                <div className="plan-cell">
                  {typeof row.basic === "boolean"
                    ? row.basic
                      ? "✓"
                      : "✗"
                    : row.basic}
                </div>
                <div className="plan-cell">
                  {typeof row.pro === "boolean"
                    ? row.pro
                      ? "✓"
                      : "✗"
                    : row.pro}
                </div>
                <div className="plan-cell">
                  {typeof row.enterprise === "boolean"
                    ? row.enterprise
                      ? "✓"
                      : "✗"
                    : row.enterprise}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="pricing-faq">
          <h3 className="faq-title">Preguntas frecuentes sobre precios</h3>

          <div className="faq-grid">
            <div className="faq-item">
              <h4 className="faq-question">
                ¿Puedo cambiar de plan en cualquier momento?
              </h4>
              <p className="faq-answer">
                Sí, puedes actualizar o reducir tu plan cuando quieras. Los
                cambios se reflejan en tu próxima facturación.
              </p>
            </div>

            <div className="faq-item">
              <h4 className="faq-question">¿Qué incluye la prueba gratuita?</h4>
              <p className="faq-answer">
                Acceso completo a todas las funcionalidades del plan Profesional
                por 2 meses, sin limitaciones ni tarjeta de crédito requerida.
              </p>
            </div>

            <div className="faq-item">
              <h4 className="faq-question">
                ¿Hay costos de setup o instalación?
              </h4>
              <p className="faq-answer">
                No, el setup es completamente gratuito e incluye configuración
                personalizada y capacitación de tu equipo.
              </p>
            </div>

            <div className="faq-item">
              <h4 className="faq-question">
                ¿Qué pasa si tengo más mesas que el límite?
              </h4>
              <p className="faq-answer">
                Puedes actualizar automáticamente al siguiente plan o
                contactarnos para una solución personalizada.
              </p>
            </div>
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="guarantee-banner">
          <div className="guarantee-content">
            <div className="guarantee-icon">🛡️</div>
            <div className="guarantee-text">
              <h4>Garantía de satisfacción 30 días</h4>
              <p>
                Si no estás completamente satisfecho, te devolvemos tu dinero.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
