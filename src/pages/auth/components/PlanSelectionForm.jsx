// src/pages/auth/components/PlanSelectionForm.jsx
import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const PlanSelectionForm = ({ 
  formData, 
  updateFormData, 
  errors, 
  onNext, 
  onPrev,
  isSubmitting,
  currentStep, 
  totalSteps 
}) => {
  const [billingCycle, setBillingCycle] = useState(formData.billingCycle || 'monthly');
  const [showComparison, setShowComparison] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      subtitle: 'Perfecto para empezar',
      icon: '🚀',
      popular: false,
      recommendedFor: ['1-10 mesas', 'Cafés pequeños', 'Nuevos negocios'],
      pricing: {
        monthly: 29900,
        annually: 299000
      },
      features: [
        'Hasta 10 mesas',
        'Menú digital completo',
        'Carrito de compras',
        'Comandas básicas',
        'Panel de administración',
        'Códigos QR personalizados',
        'Soporte por email',
        'Estadísticas básicas'
      ],
      limitations: [
        'Sin sistema de reservas',
        'Sin personalización avanzada',
        'Sin integraciones'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      subtitle: 'El más elegido',
      icon: '⭐',
      popular: true,
      recommendedFor: ['11-50 mesas', 'Restaurantes medianos', 'En crecimiento'],
      pricing: {
        monthly: 59900,
        annually: 599000
      },
      features: [
        'Hasta 50 mesas',
        'Todo de Starter +',
        'Sistema de reservas completo',
        'Personalización avanzada',
        'Múltiples métodos de pago',
        'Reportes detallados',
        'Soporte prioritario',
        'Integraciones básicas',
        'Gestión de inventario',
        'Promociones y descuentos',
        'Análisis de clientes',
        'Notificaciones WhatsApp'
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
      recommendedFor: ['50+ mesas', 'Cadenas', 'Multi-sucursal'],
      pricing: {
        monthly: 149900,
        annually: 1499000
      },
      features: [
        'Mesas ilimitadas',
        'Todo de Professional +',
        'Marca blanca completa',
        'API personalizada',
        'Integraciones ilimitadas',
        'Soporte 24/7',
        'Gerente de cuenta dedicado',
        'Análisis avanzado con IA',
        'Multi-sucursal',
        'Configuración personalizada',
        'SLA garantizado',
        'Capacitación presencial',
        'Integración POS',
        'Facturación avanzada'
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

  const getYearlySavings = (monthlyPrice) => {
    const yearlyTotal = monthlyPrice * 12;
    const discountedYearly = monthlyPrice * 10; // 2 meses gratis
    return yearlyTotal - discountedYearly;
  };

  const handlePlanSelect = (planId) => {
    updateFormData({ 
      selectedPlan: planId,
      billingCycle: billingCycle
    });
  };

  const handleBillingChange = (cycle) => {
    setBillingCycle(cycle);
    updateFormData({ billingCycle: cycle });
  };

  const getRecommendedPlan = () => {
    const tableCount = formData.tableCount;
    if (tableCount === '1-5') return 'starter';
    if (tableCount === '6-15' || tableCount === '16-30') return 'professional';
    return 'enterprise';
  };

  const recommendedPlan = getRecommendedPlan();

  return (
    <div className="plan-selection-form">
      <div className="plan-header">
        <h2>Elige el plan perfecto para tu negocio</h2>
        <p>Puedes cambiar de plan en cualquier momento. Todos incluyen 14 días de prueba gratuita.</p>
      </div>

      {/* Billing Toggle */}
      <div className="billing-toggle">
        <div className="toggle-container">
          <button
            type="button"
            className={`toggle-option ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => handleBillingChange('monthly')}
          >
            Mensual
          </button>
          <button
            type="button"
            className={`toggle-option ${billingCycle === 'annually' ? 'active' : ''}`}
            onClick={() => handleBillingChange('annually')}
          >
            Anual
            <span className="savings-badge">Ahorra 2 meses</span>
          </button>
        </div>
      </div>

      {/* Plan Recommendation */}
      {recommendedPlan && (
        <div className="plan-recommendation">
          <div className="recommendation-content">
            <span className="recommendation-icon">💡</span>
            <div>
              <strong>Recomendación:</strong> Basado en tu información ({formData.tableCount} mesas), 
              el plan <strong>{plans.find(p => p.id === recommendedPlan)?.name}</strong> sería ideal para ti.
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`plan-card ${plan.popular ? 'popular' : ''} ${formData.selectedPlan === plan.id ? 'selected' : ''} ${plan.id === recommendedPlan ? 'recommended' : ''}`}
            onClick={() => handlePlanSelect(plan.id)}
            hover={true}
          >
            {plan.popular && (
              <div className="popular-badge">
                <span>Más Popular</span>
              </div>
            )}
            
            {plan.id === recommendedPlan && (
              <div className="recommended-badge">
                <span>Recomendado</span>
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
                  {billingCycle === 'monthly' 
                    ? (plan.pricing.monthly / 1000).toFixed(0)
                    : (plan.pricing.annually / 1000).toFixed(0)
                  }
                </span>
                <span className="period">
                  {billingCycle === 'monthly' ? '.900/mes' : '.000/año'}
                </span>
              </div>
              
              {billingCycle === 'annually' && (
                <div className="savings-info">
                  <span className="original-price">
                    {formatPrice(plan.pricing.monthly * 12)}
                  </span>
                  <span className="savings">
                    Ahorras {formatPrice(getYearlySavings(plan.pricing.monthly))}
                  </span>
                </div>
              )}
            </div>

            <div className="plan-recommended-for">
              <h4>Ideal para:</h4>
              <ul>
                {plan.recommendedFor.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="plan-features">
              <h4>Incluye:</h4>
              <ul className="features-list">
                {plan.features.slice(0, 6).map((feature, index) => (
                  <li key={index} className="feature-item">
                    <span className="feature-check">✓</span>
                    {feature}
                  </li>
                ))}
                {plan.features.length > 6 && (
                  <li className="feature-more">
                    + {plan.features.length - 6} características más
                  </li>
                )}
              </ul>
            </div>

            <div className="plan-cta">
              <div className={`select-indicator ${formData.selectedPlan === plan.id ? 'selected' : ''}`}>
                {formData.selectedPlan === plan.id ? (
                  <span className="selected-text">✓ Seleccionado</span>
                ) : (
                  <span className="select-text">Seleccionar Plan</span>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Plan Comparison */}
      <div className="plan-comparison-toggle">
        <button
          type="button"
          onClick={() => setShowComparison(!showComparison)}
          className="comparison-toggle-btn"
        >
          {showComparison ? 'Ocultar' : 'Ver'} comparación detallada
          <span className={`toggle-arrow ${showComparison ? 'open' : ''}`}>▼</span>
        </button>
      </div>

      {showComparison && (
        <div className="plan-comparison">
          <div className="comparison-table">
            <div className="comparison-header">
              <div className="comparison-feature">Características</div>
              {plans.map(plan => (
                <div key={plan.id} className="comparison-plan">
                  <div className="plan-icon">{plan.icon}</div>
                  <div className="plan-name">{plan.name}</div>
                </div>
              ))}
            </div>
            
            {/* Aquí irían todas las características comparadas */}
            <div className="comparison-row">
              <div className="feature-name">Número de mesas</div>
              <div className="feature-value">Hasta 10</div>
              <div className="feature-value">Hasta 50</div>
              <div className="feature-value">Ilimitadas</div>
            </div>
            
            <div className="comparison-row">
              <div className="feature-name">Sistema de reservas</div>
              <div className="feature-value">✗</div>
              <div className="feature-value">✓</div>
              <div className="feature-value">✓</div>
            </div>
            
            <div className="comparison-row">
              <div className="feature-name">Soporte</div>
              <div className="feature-value">Email</div>
              <div className="feature-value">Prioritario</div>
              <div className="feature-value">24/7</div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Plan Summary */}
      {formData.selectedPlan && (
        <div className="selected-plan-summary">
          <div className="summary-content">
            <h3>Resumen de tu selección:</h3>
            <div className="summary-details">
              <div className="summary-plan">
                <span className="plan-icon">
                  {plans.find(p => p.id === formData.selectedPlan)?.icon}
                </span>
                <div>
                  <strong>{plans.find(p => p.id === formData.selectedPlan)?.name}</strong>
                  <span> - {billingCycle === 'monthly' ? 'Facturación mensual' : 'Facturación anual'}</span>
                </div>
              </div>
              <div className="summary-price">
                {formatPrice(
                  billingCycle === 'monthly' 
                    ? plans.find(p => p.id === formData.selectedPlan)?.pricing.monthly
                    : plans.find(p => p.id === formData.selectedPlan)?.pricing.annually
                )}
                <span className="price-period">
                  /{billingCycle === 'monthly' ? 'mes' : 'año'}
                </span>
              </div>
            </div>
            <div className="trial-notice">
              <span className="trial-icon">🎯</span>
              <strong>14 días de prueba gratuita</strong> - Sin tarjeta de crédito requerida
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {errors.selectedPlan && (
        <div className="error-message global">
          <span className="error-icon">⚠️</span>
          {errors.selectedPlan}
        </div>
      )}

      {/* Form Actions */}
      <div className="form-actions">
        <Button
          type="button"
          onClick={onPrev}
          variant="outline"
          className="btn-large"
          disabled={isSubmitting}
        >
          ← Anterior
        </Button>
        
        <div className="step-info">
          Paso {currentStep} de {totalSteps}
        </div>
        
        <Button 
          type="button"
          onClick={onNext}
          className="btn-primary btn-large"
          disabled={!formData.selectedPlan || isSubmitting}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Creando cuenta...' : 'Crear mi cuenta'}
          <span className="btn-arrow">→</span>
        </Button>
      </div>

      {/* Additional Info */}
      <div className="plan-additional-info">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-icon">🔒</span>
            <div>
              <strong>Datos seguros</strong>
              <p>Encriptación SSL y respaldos automáticos</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">🔄</span>
            <div>
              <strong>Cambia cuando quieras</strong>
              <p>Actualiza o cambia tu plan en cualquier momento</p>
            </div>
          </div>
          <div className="info-item">
            <span className="info-icon">📞</span>
            <div>
              <strong>Soporte incluido</strong>
              <p>Te ayudamos a configurar todo</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanSelectionForm;