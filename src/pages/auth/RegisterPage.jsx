// src/pages/auth/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Logo from '../../components/common/Logo';
import RegisterForm from './components/RegisterForm';
import BusinessInfoForm from './components/BusinessInfoForm';
import PlanSelectionForm from './components/PlanSelectionForm';
import SuccessMessage from './components/SuccessMessage';
import './styles/auth.css';

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Datos del usuario
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Datos del negocio
    businessName: '',
    businessType: '',
    address: '',
    city: '',
    region: '',
    description: '',
    website: '',
    
    // Plan seleccionado
    selectedPlan: 'professional',
    billingCycle: 'monthly',
    
    // Términos y condiciones
    acceptTerms: false,
    acceptMarketing: false
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Pre-llenar datos desde URL params si existen
    const email = searchParams.get('email');
    const plan = searchParams.get('plan');
    const billing = searchParams.get('billing');
    
    if (email || plan || billing) {
      setFormData(prev => ({
        ...prev,
        ...(email && { email }),
        ...(plan && { selectedPlan: plan }),
        ...(billing && { billingCycle: billing })
      }));
    }
  }, [searchParams]);

  const steps = [
    {
      id: 1,
      title: 'Datos Personales',
      description: 'Información básica de contacto',
      component: RegisterForm
    },
    {
      id: 2,
      title: 'Información del Negocio',
      description: 'Detalles de tu restaurante',
      component: BusinessInfoForm
    },
    {
      id: 3,
      title: 'Selecciona tu Plan',
      description: 'Elige el plan que mejor se adapte',
      component: PlanSelectionForm
    },
    {
      id: 4,
      title: '¡Bienvenido!',
      description: 'Tu cuenta ha sido creada exitosamente',
      component: SuccessMessage
    }
  ];

  const updateFormData = (newData) => {
    setFormData(prev => ({
      ...prev,
      ...newData
    }));
    setErrors({});
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim()) {
          newErrors.firstName = 'El nombre es requerido';
        }
        if (!formData.lastName.trim()) {
          newErrors.lastName = 'El apellido es requerido';
        }
        if (!formData.email.trim()) {
          newErrors.email = 'El email es requerido';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'El email no es válido';
        }
        if (!formData.phone.trim()) {
          newErrors.phone = 'El teléfono es requerido';
        }
        if (!formData.password) {
          newErrors.password = 'La contraseña es requerida';
        } else if (formData.password.length < 8) {
          newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
        }
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        }
        if (!formData.acceptTerms) {
          newErrors.acceptTerms = 'Debes aceptar los términos y condiciones';
        }
        break;

      case 2:
        if (!formData.businessName.trim()) {
          newErrors.businessName = 'El nombre del negocio es requerido';
        }
        if (!formData.businessType) {
          newErrors.businessType = 'Selecciona el tipo de negocio';
        }
        if (!formData.address.trim()) {
          newErrors.address = 'La dirección es requerida';
        }
        if (!formData.city.trim()) {
          newErrors.city = 'La ciudad es requerida';
        }
        if (!formData.region) {
          newErrors.region = 'Selecciona la región';
        }
        break;

      case 3:
        if (!formData.selectedPlan) {
          newErrors.selectedPlan = 'Selecciona un plan';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Simular registro en el backend
      const registrationData = {
        user: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        },
        business: {
          name: formData.businessName,
          type: formData.businessType,
          address: formData.address,
          city: formData.city,
          region: formData.region,
          description: formData.description,
          website: formData.website
        },
        subscription: {
          plan: formData.selectedPlan,
          billingCycle: formData.billingCycle
        },
        preferences: {
          marketing: formData.acceptMarketing
        }
      };

      // Aquí harías la llamada real a tu API
      console.log('Datos de registro:', registrationData);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mover al paso de éxito
      setCurrentStep(4);
      
    } catch (error) {
      console.error('Error en el registro:', error);
      setErrors({ submit: 'Hubo un error al crear tu cuenta. Inténtalo nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;
  const currentStepData = steps[currentStep - 1];

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Header */}
        <div className="register-header">
          <Link to="/" className="back-to-home">
            ← Volver al inicio
          </Link>
          <Logo />
        </div>

        {/* Progress Steps */}
        {currentStep < 4 && (
          <div className="progress-steps">
            <div className="steps-container">
              {steps.slice(0, 3).map((step) => (
                <div 
                  key={step.id}
                  className={`step ${currentStep >= step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                >
                  <div className="step-circle">
                    {currentStep > step.id ? (
                      <span className="check">✓</span>
                    ) : (
                      <span className="step-number">{step.id}</span>
                    )}
                  </div>
                  <div className="step-info">
                    <div className="step-title">{step.title}</div>
                    <div className="step-description">{step.description}</div>
                  </div>
                  {step.id < 3 && <div className="step-connector"></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="register-content">
          <div className="form-container">
            {currentStep < 4 && (
              <div className="form-header">
                <h1>{currentStepData.title}</h1>
                <p>{currentStepData.description}</p>
              </div>
            )}

            <CurrentStepComponent
              formData={formData}
              updateFormData={updateFormData}
              errors={errors}
              onNext={handleNext}
              onPrev={handlePrev}
              isSubmitting={isSubmitting}
              currentStep={currentStep}
              totalSteps={3}
            />

            {/* Global Error */}
            {errors.submit && (
              <div className="error-message global">
                <span className="error-icon">⚠️</span>
                {errors.submit}
              </div>
            )}
          </div>

          {/* Sidebar with benefits */}
          {currentStep < 4 && (
            <div className="register-sidebar">
              <div className="benefits-card">
                <h3>¿Por qué elegir TappMesa?</h3>
                <div className="benefits-list">
                  <div className="benefit-item">
                    <span className="benefit-icon">⚡</span>
                    <div>
                      <strong>Configuración rápida</strong>
                      <p>Tu restaurante digital en menos de 10 minutos</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">📈</span>
                    <div>
                      <strong>Aumenta tus ventas</strong>
                      <p>Promedio de 35% de incremento reportado</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">🎯</span>
                    <div>
                      <strong>Soporte personalizado</strong>
                      <p>Te acompañamos en cada paso</p>
                    </div>
                  </div>
                  <div className="benefit-item">
                    <span className="benefit-icon">🔒</span>
                    <div>
                      <strong>Datos seguros</strong>
                      <p>Encriptación SSL y respaldos automáticos</p>
                    </div>
                  </div>
                </div>

                <div className="trial-info">
                  <h4>Prueba gratuita de 14 días</h4>
                  <ul>
                    <li>✓ Sin tarjeta de crédito</li>
                    <li>✓ Acceso completo</li>
                    <li>✓ Soporte incluido</li>
                    <li>✓ Sin compromiso</li>
                  </ul>
                </div>
              </div>

              <div className="help-card">
                <h4>¿Necesitas ayuda?</h4>
                <p>Nuestro equipo está listo para ayudarte</p>
                <div className="contact-options">
                  <a href="tel:+56912345678" className="contact-option">
                    <span>📞</span>
                    <div>
                      <strong>Llámanos</strong>
                      <span>+56 9 1234 5678</span>
                    </div>
                  </a>
                  <a href="mailto:soporte@tappmesa.com" className="contact-option">
                    <span>✉️</span>
                    <div>
                      <strong>Escríbenos</strong>
                      <span>soporte@tappmesa.com</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="register-footer">
          <p>
            ¿Ya tienes una cuenta? 
            <Link to="/login" className="login-link"> Inicia sesión aquí</Link>
          </p>
          <div className="footer-links">
            <Link to="/privacy">Política de Privacidad</Link>
            <Link to="/terms">Términos de Servicio</Link>
            <Link to="/help">Centro de Ayuda</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;