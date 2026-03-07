// src/pages/auth/components/SuccessMessage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';

const SuccessMessage = ({ formData }) => {
  const [countdown, setCountdown] = useState(10);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  const handleGoToDashboard = useCallback(() => {
    if (showOnboarding) {
      navigate('/dashboard/onboarding/welcome');
    } else {
      navigate('/dashboard');
    }
  }, [navigate, showOnboarding]);

  useEffect(() => {
    // Countdown para redirección automática
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!showOnboarding) {
            handleGoToDashboard();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showOnboarding, handleGoToDashboard]);

  const handleStartOnboarding = () => {
    setShowOnboarding(true);
    navigate('/dashboard/onboarding/welcome');
  };

  const nextSteps = [
    {
      icon: '🎨',
      title: 'Personaliza tu menú',
      description: 'Agrega tus platillos, precios y fotos',
      action: 'Configurar menú',
      link: '/dashboard/menu'
    },
    {
      icon: '🪑',
      title: 'Configura tus mesas',
      description: 'Define la distribución y genera códigos QR',
      action: 'Configurar mesas',
      link: '/dashboard/tables'
    },
    {
      icon: '📱',
      title: 'Prueba tu menú digital',
      description: 'Ve cómo se verá para tus clientes',
      action: 'Ver preview',
      link: `/menu/${formData.businessSlug || 'preview'}`
    }
  ];

  const benefits = [
    'Menú digital siempre actualizado',
    'Órdenes directas desde la mesa',
    'Reducción de errores en pedidos',
    'Análisis de ventas en tiempo real',
    'Mayor satisfacción del cliente'
  ];

  return (
    <div className="success-message">
      <div className="success-content">
        {/* Success Animation */}
        <div className="success-animation">
          <div className="success-circle">
            <div className="success-checkmark">
              <div className="checkmark-stem"></div>
              <div className="checkmark-kick"></div>
            </div>
          </div>
        </div>

        {/* Main Success Message */}
        <div className="success-header">
          <h1 className="success-title">¡Bienvenido a TappMesa! 🎉</h1>
          <p className="success-subtitle">
            Tu cuenta ha sido creada exitosamente. Tu restaurante digital está listo para empezar.
          </p>
        </div>

        {/* Account Summary */}
        <Card className="account-summary">
          <div className="summary-header">
            <div className="business-logo">
              {formData.businessLogo ? (
                <img src={URL.createObjectURL(formData.businessLogo)} alt="Logo" />
              ) : (
                <span className="default-logo">🏪</span>
              )}
            </div>
            <div className="business-info">
              <h3>{formData.businessName}</h3>
              <p>{formData.businessType}</p>
              <div className="business-url">
                <strong>https://{formData.businessSlug}.tappmesa.com</strong>
              </div>
            </div>
          </div>
          
          <div className="summary-details">
            <div className="detail-item">
              <span className="detail-label">Plan seleccionado:</span>
              <span className="detail-value">{formData.selectedPlan} ({formData.billingCycle})</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Ubicación:</span>
              <span className="detail-value">{formData.city}, {formData.region}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{formData.email}</span>
            </div>
          </div>
        </Card>

        {/* What Happens Next */}
        <div className="next-steps-section">
          <h2>¿Qué sigue ahora?</h2>
          <p>Te ayudamos a configurar todo paso a paso:</p>
          
          <div className="next-steps-grid">
            {nextSteps.map((step, index) => (
              <Card key={index} className="next-step-card" hover>
                <div className="step-number">{index + 1}</div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                <Button
                  variant="outline"
                  size="small"
                  onClick={() => navigate(step.link)}
                >
                  {step.action}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits Reminder */}
        <div className="benefits-section">
          <h3>Con TappMesa ya puedes:</h3>
          <div className="benefits-list">
            {benefits.map((benefit, index) => (
              <div key={index} className="benefit-item">
                <span className="benefit-check">✓</span>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="success-actions">
          <div className="primary-actions">
            <Button
              onClick={handleStartOnboarding}
              className="btn-primary btn-large"
            >
              Comenzar configuración guiada
              <span className="btn-arrow">→</span>
            </Button>
            
            <Button
              onClick={handleGoToDashboard}
              variant="outline"
              className="btn-large"
            >
              Ir directo al dashboard
            </Button>
          </div>

          <div className="secondary-actions">
            <button
              onClick={() => navigate(`/menu/${formData.businessSlug}`)}
              className="preview-link"
            >
              👀 Ver cómo se ve mi menú digital
            </button>
          </div>
        </div>

        {/* Auto-redirect Notice */}
        {!showOnboarding && countdown > 0 && (
          <div className="auto-redirect-notice">
            <span className="countdown-icon">⏱️</span>
            <span>
              Te llevaremos al dashboard automáticamente en {countdown} segundos
            </span>
            <button
              onClick={() => setCountdown(0)}
              className="cancel-countdown"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Welcome Email Notice */}
        <div className="email-notice">
          <div className="notice-content">
            <span className="notice-icon">📧</span>
            <div>
              <strong>¡Revisa tu email!</strong>
              <p>Te hemos enviado información importante sobre tu cuenta y próximos pasos a <strong>{formData.email}</strong></p>
            </div>
          </div>
        </div>

        {/* Support Information */}
        <div className="support-section">
          <h3>¿Necesitas ayuda?</h3>
          <div className="support-options">
            <div className="support-option">
              <span className="support-icon">📞</span>
              <div>
                <strong>Llamada de bienvenida</strong>
                <p>Agenda una llamada gratuita para configurar todo juntos</p>
                <Button size="small" variant="outline">
                  Agendar llamada
                </Button>
              </div>
            </div>
            
            <div className="support-option">
              <span className="support-icon">💬</span>
              <div>
                <strong>Chat en vivo</strong>
                <p>Resuelve dudas al instante con nuestro equipo</p>
                <Button size="small" variant="outline">
                  Abrir chat
                </Button>
              </div>
            </div>
            
            <div className="support-option">
              <span className="support-icon">📚</span>
              <div>
                <strong>Centro de ayuda</strong>
                <p>Guías paso a paso y preguntas frecuentes</p>
                <Button size="small" variant="outline">
                  Ver guías
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="social-proof">
          <h4>Únete a cientos de restaurantes exitosos</h4>
          <div className="proof-stats">
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Restaurantes activos</span>
            </div>
            <div className="stat">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Órdenes procesadas</span>
            </div>
            <div className="stat">
              <span className="stat-number">98%</span>
              <span className="stat-label">Satisfacción</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <h4>Enlaces útiles:</h4>
          <div className="links-grid">
            <a href="/help" target="_blank" rel="noopener noreferrer">
              📖 Guía de inicio rápido
            </a>
            <a href="/help/video-tutorials" target="_blank" rel="noopener noreferrer">
              🎥 Video tutoriales
            </a>
            <a href="/help/best-practices" target="_blank" rel="noopener noreferrer">
              💡 Mejores prácticas
            </a>
            <a href="/contact" target="_blank" rel="noopener noreferrer">
              📞 Contactar soporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessMessage;