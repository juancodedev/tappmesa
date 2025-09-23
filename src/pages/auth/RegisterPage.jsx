// src/pages/auth/RegisterPage.jsx - Versión con Tailwind
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

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
      description: 'Información básica de contacto'
    },
    {
      id: 2,
      title: 'Información del Negocio',
      description: 'Detalles de tu restaurante'
    },
    {
      id: 3,
      title: 'Selecciona tu Plan',
      description: 'Elige el plan que mejor se adapte'
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
      if (currentStep < steps.length) {
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

      console.log('Datos de registro:', registrationData);
      
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirigir al dashboard o mostrar éxito
      navigate('/dashboard');
      
    } catch (error) {
      console.error('Error en el registro:', error);
      setErrors({ submit: 'Hubo un error al crear tu cuenta. Inténtalo nuevamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center py-6">
          <Link to="/" className="text-gray-600 hover:text-primary-500 transition-colors">
            ← Volver al inicio
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center text-white text-xl">
              🍽️
            </div>
            <span className="text-xl font-bold text-gray-900">TappMesa</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    currentStep >= step.id 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  <div className="hidden sm:block text-center">
                    <div className="font-semibold text-gray-900">{step.title}</div>
                    <div className="text-sm text-gray-600">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 transition-colors ${
                    currentStep > step.id ? 'bg-primary-500' : 'bg-gray-200'
                  }`}></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {steps[currentStep - 1].title}
                </h1>
                <p className="text-gray-600">
                  {steps[currentStep - 1].description}
                </p>
              </div>

              {/* Step 1: Datos Personales */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => updateFormData({ firstName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ej: Juan"
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apellido *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => updateFormData({ lastName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Ej: Pérez"
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateFormData({ email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="tu@restaurante.com"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateFormData({ phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="+56 9 1234 5678"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateFormData({ password: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Mínimo 8 caracteres"
                    />
                    {errors.password && (
                      <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Contraseña *
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Repite tu contraseña"
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.acceptTerms}
                        onChange={(e) => updateFormData({ acceptTerms: e.target.checked })}
                        className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Acepto los <a href="/terms" className="text-primary-500 hover:underline">Términos de Servicio</a> y 
                        la <a href="/privacy" className="text-primary-500 hover:underline">Política de Privacidad</a> *
                      </span>
                    </label>
                    {errors.acceptTerms && (
                      <p className="text-red-500 text-sm">{errors.acceptTerms}</p>
                    )}

                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.acceptMarketing}
                        onChange={(e) => updateFormData({ acceptMarketing: e.target.checked })}
                        className="mt-1 h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        Acepto recibir emails sobre novedades y consejos de TappMesa
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Información del Negocio */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Negocio *
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => updateFormData({ businessName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ej: Café Central"
                    />
                    {errors.businessName && (
                      <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Negocio *
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { value: 'restaurant', label: 'Restaurante', icon: '🍽️' },
                        { value: 'cafe', label: 'Café', icon: '☕' },
                        { value: 'bar', label: 'Bar', icon: '🍺' },
                        { value: 'bakery', label: 'Panadería', icon: '🥖' },
                        { value: 'pizzeria', label: 'Pizzería', icon: '🍕' },
                        { value: 'other', label: 'Otro', icon: '🏪' }
                      ].map((type) => (
                        <label
                          key={type.value}
                          className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.businessType === type.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="businessType"
                            value={type.value}
                            checked={formData.businessType === type.value}
                            onChange={(e) => updateFormData({ businessType: e.target.value })}
                            className="sr-only"
                          />
                          <span className="text-2xl mb-2">{type.icon}</span>
                          <span className="text-sm font-medium text-center">{type.label}</span>
                        </label>
                      ))}
                    </div>
                    {errors.businessType && (
                      <p className="text-red-500 text-sm mt-1">{errors.businessType}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => updateFormData({ address: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ej: Av. Providencia 1234"
                    />
                    {errors.address && (
                      <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => updateFormData({ city: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Ej: Santiago"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción del Negocio
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => updateFormData({ description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Cuéntanos sobre tu negocio, especialidades, ambiente, etc."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Selección de Plan */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      {
                        id: 'starter',
                        name: 'Starter',
                        price: '$29.900',
                        features: ['Hasta 10 mesas', 'Menú digital', 'Comandas básicas']
                      },
                      {
                        id: 'professional',
                        name: 'Professional',
                        price: '$59.900',
                        features: ['Hasta 50 mesas', 'Reservas', 'Reportes avanzados'],
                        popular: true
                      },
                      {
                        id: 'enterprise',
                        name: 'Enterprise',
                        price: '$149.900',
                        features: ['Mesas ilimitadas', 'API personalizada', 'Soporte 24/7']
                      }
                    ].map((plan) => (
                      <div
                        key={plan.id}
                        className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all ${
                          formData.selectedPlan === plan.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-300'
                        }`}
                        onClick={() => updateFormData({ selectedPlan: plan.id })}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                              Más Popular
                            </span>
                          </div>
                        )}
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                          <div className="text-2xl font-bold text-primary-500 mb-4">{plan.price}</div>
                          <ul className="space-y-2 text-sm text-gray-600">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <span className="text-green-500 mr-2">✓</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errors.selectedPlan && (
                    <p className="text-red-500 text-sm">{errors.selectedPlan}</p>
                  )}
                </div>
              )}

              {/* Error Display */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex">
                    <span className="text-red-500 mr-2">⚠️</span>
                    <span className="text-red-700">{errors.submit}</span>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-between items-center pt-6">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors touch-target ${
                    currentStep === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ← Anterior
                </button>
                
                <div className="text-sm text-gray-500">
                  Paso {currentStep} de {steps.length}
                </div>
                
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 touch-target"
                >
                  {isSubmitting ? 'Creando cuenta...' : currentStep === steps.length ? 'Crear Cuenta' : 'Continuar →'}
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ¿Por qué elegir TappMesa?
              </h3>
              <div className="space-y-4">
                {[
                  { icon: '⚡', title: 'Configuración rápida', desc: 'Tu restaurante digital en 10 minutos' },
                  { icon: '📈', title: 'Aumenta ventas', desc: '35% de incremento promedio' },
                  { icon: '🎯', title: 'Soporte personalizado', desc: 'Te acompañamos en cada paso' },
                  { icon: '🔒', title: 'Datos seguros', desc: 'Encriptación y respaldos automáticos' }
                ].map((benefit, index) => (
                  <div key={index} className="flex gap-3">
                    <span className="text-xl">{benefit.icon}</span>
                    <div>
                      <div className="font-medium text-gray-900">{benefit.title}</div>
                      <div className="text-sm text-gray-600">{benefit.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Prueba gratuita de 14 días</h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>✓ Sin tarjeta de crédito</li>
                  <li>✓ Acceso completo</li>
                  <li>✓ Soporte incluido</li>
                  <li>✓ Sin compromiso</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="text-primary-500 hover:underline font-medium">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;