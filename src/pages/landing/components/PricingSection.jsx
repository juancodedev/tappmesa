// src/pages/landing/components/PricingSection.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";

const PricingSection = () => {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const navigate = useNavigate();

  const plans = [
    {
      id: "starter",
      name: "Starter",
      subtitle: "Perfecto para empezar",
      icon: "🚀",
      popular: false,
      pricing: {
        monthly: 29900,
        annually: 299000,
      },
      description: "Ideal para cafeterías y restaurantes pequeños",
      features: [
        "Hasta 10 mesas",
        "Menú digital ilimitado",
        "Carrito de compras",
        "Comandas básicas",
        "Panel de administración",
        "Soporte por email",
        "Códigos QR personalizados",
        "Estadísticas básicas",
      ],
      limitations: [
        "Sin sistema de reservas",
        "Sin personalización avanzada",
        "Sin integraciones externas",
      ],
      cta: "Comenzar Gratis",
      trialDays: 14,
    },
    {
      id: "professional",
      name: "Professional",
      subtitle: "El más popular",
      icon: "⭐",
      popular: true,
      pricing: {
        monthly: 59900,
        annually: 599000,
      },
      description: "Para restaurantes en crecimiento",
      features: [
        "Hasta 50 mesas",
        "Todo de Starter",
        "Sistema de reservas completo",
        "Personalización avanzada",
        "Múltiples métodos de pago",
        "Reportes detallados",
        "Soporte prioritario",
        "Integraciones básicas",
        "Gestión de inventario",
        "Promociones y descuentos",
      ],
      limitations: ["Sin marca blanca", "Integraciones limitadas"],
      cta: "Probar Professional",
      trialDays: 14,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      subtitle: "Solución completa",
      icon: "🏢",
      popular: false,
      pricing: {
        monthly: 149900,
        annually: 1499000,
      },
      description: "Para cadenas y restaurantes grandes",
      features: [
        "Mesas ilimitadas",
        "Todo de Professional",
        "Marca blanca completa",
        "API personalizada",
        "Integraciones ilimitadas",
        "Soporte 24/7",
        "Gerente de cuenta dedicado",
        "Análisis avanzado con IA",
        "Multi-sucursal",
        "Configuración personalizada",
        "SLA garantizado",
        "Capacitación presencial",
      ],
      limitations: [],
      cta: "Contactar Ventas",
      trialDays: 30,
    },
  ];

  const addOns = [
    {
      name: "Delivery Integration",
      description: "Integración con apps de delivery",
      price: 19900,
      icon: "🛵",
    },
    {
      name: "Advanced Analytics",
      description: "Reportes e insights avanzados",
      price: 29900,
      icon: "📊",
    },
    {
      name: "Multi-language",
      description: "Soporte para múltiples idiomas",
      price: 15900,
      icon: "🌍",
    },
    {
      name: "Custom Integrations",
      description: "Integraciones personalizadas",
      price: 79900,
      icon: "🔗",
    },
  ];

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
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
    // Aquí puedes integrar con un sistema de contacto o calendario
    window.open(
      "mailto:ventas@tappmesa.com?subject=Consulta Plan Enterprise",
      "_blank"
    );
  };

  return (
    <section className="pricing-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Planes que se adaptan a tu negocio</h2>
          <p className="section-description">
            Desde cafeterías pequeñas hasta grandes cadenas de restaurantes
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="billing-toggle">
          <div className="toggle-container">
            <button
              className={`toggle-option ${
                billingCycle === "monthly" ? "active" : ""
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Mensual
            </button>
            <button
              className={`toggle-option ${
                billingCycle === "annually" ? "active" : ""
              }`}
              onClick={() => setBillingCycle("annually")}
            >
              Anual
              <span className="savings-badge">Ahorra 2 meses</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="plans-grid">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`plan-card ${plan.popular ? "popular" : ""}`}
            >
              {plan.popular && (
                <div className="popular-badge">
                  <span>Más Popular</span>
                </div>
              )}

              <div className="plan-header">
                <div className="plan-icon">{plan.icon}</div>
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-subtitle">{plan.subtitle}</p>
              </div>

              <div className="plan-pricing">
                <div className="price-display">
                  <span className="currency">$</span>
                  <span className="amount">
                    {billingCycle === "monthly"
                      ? (plan.pricing.monthly / 1000).toFixed(0)
                      : (plan.pricing.annually / 1000).toFixed(0)}
                  </span>
                  <span className="period">
                    {billingCycle === "monthly" ? ".900/mes" : ".000/año"}
                  </span>
                </div>

                {billingCycle === "annually" && (
                  <div className="savings-info">
                    <span className="original-price">
                      {formatPrice(plan.pricing.monthly * 12)}
                    </span>
                    <span className="savings">
                      Ahorras {formatPrice(getSavings(plan.pricing.monthly))}
                    </span>
                  </div>
                )}

                <p className="plan-description">{plan.description}</p>
              </div>

              <div className="plan-features">
                <h4>Incluye:</h4>
                <ul className="features-list">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="feature-item">
                      <span className="feature-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.limitations.length > 0 && (
                  <div className="limitations">
                    <h5>No incluye:</h5>
                    <ul className="limitations-list">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="limitation-item">
                          <span className="limitation-cross">✗</span>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="plan-cta">
                {plan.id === "enterprise" ? (
                  <Button
                    onClick={handleContactSales}
                    className="btn-outline btn-block"
                  >
                    {plan.cta}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`btn-block ${
                      plan.popular ? "btn-primary" : "btn-outline"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                )}

                <p className="trial-info">
                  Prueba gratis por {plan.trialDays} días
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="addons-section">
          <h3>Complementos Disponibles</h3>
          <p>Potencia tu plan con funcionalidades adicionales</p>

          <div className="addons-grid">
            {addOns.map((addon, index) => (
              <Card key={index} className="addon-card">
                <div className="addon-icon">{addon.icon}</div>
                <h4 className="addon-name">{addon.name}</h4>
                <p className="addon-description">{addon.description}</p>
                <div className="addon-price">
                  {formatPrice(addon.price)}/mes
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="pricing-faq">
          <h3>Preguntas Frecuentes</h3>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>¿Puedo cambiar de plan en cualquier momento?</h4>
              <p>
                Sí, puedes actualizar o cambiar tu plan cuando quieras. Los
                cambios se aplican inmediatamente.
              </p>
            </div>
            <div className="faq-item">
              <h4>¿Hay costos de configuración?</h4>
              <p>
                No cobramos costos de configuración. Te ayudamos a configurar tu
                restaurante completamente gratis.
              </p>
            </div>
            <div className="faq-item">
              <h4>¿Qué incluye el período de prueba?</h4>
              <p>
                Acceso completo a todas las funcionalidades del plan
                seleccionado, sin restricciones.
              </p>
            </div>
            <div className="faq-item">
              <h4>¿Ofrecen descuentos para múltiples sucursales?</h4>
              <p>
                Sí, tenemos descuentos especiales para cadenas. Contáctanos para
                una cotización personalizada.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="trust-indicators">
          <div className="indicator">
            <span className="indicator-icon">🔒</span>
            <div>
              <h4>Pagos Seguros</h4>
              <p>Encriptación SSL y PCI compliance</p>
            </div>
          </div>
          <div className="indicator">
            <span className="indicator-icon">📞</span>
            <div>
              <h4>Soporte Local</h4>
              <p>Equipo en Chile, en tu zona horaria</p>
            </div>
          </div>
          <div className="indicator">
            <span className="indicator-icon">💾</span>
            <div>
              <h4>Respaldo de Datos</h4>
              <p>Backups automáticos diarios</p>
            </div>
          </div>
          <div className="indicator">
            <span className="indicator-icon">📱</span>
            <div>
              <h4>App Nativa</h4>
              <p>Próximamente en App Store y Google Play</p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="pricing-final-cta">
          <h3>¿Necesitas algo personalizado?</h3>
          <p>
            Trabajamos contigo para crear una solución que se adapte
            perfectamente a tu negocio
          </p>
          <div className="cta-buttons">
            <Button
              onClick={() => navigate("/register")}
              className="btn-primary"
            >
              Comenzar Prueba Gratuita
            </Button>
            <Button onClick={handleContactSales} variant="outline">
              Hablar con Ventas
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
