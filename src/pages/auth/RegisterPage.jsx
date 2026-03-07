import { useState, useCallback, useMemo } from 'react'
import {
  Coffee,
  User,
  Mail,
  Phone,
  MapPin,
  Store,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Zap,
  Shield,
  Smartphone,
  ArrowLeft
} from 'lucide-react';

const RegisterPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Paso 1: Información personal + credenciales
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    
    // Paso 2: Información de la cafetería
    cafeName: '',
    address: '',
    city: '',
    cafeType: '',
    seatingCapacity: '',
    
    // Paso 3: Configuración inicial
    menuSize: '',
    currentSystem: '',
    priority: '',
    
    // Paso 4: Plan seleccionado
    selectedPlan: 'premium'
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const steps = [
    { number: 1, title: 'Tu Información', icon: User, desc: 'Datos del propietario' },
    { number: 2, title: 'Tu Cafetería', icon: Store, desc: 'Información del negocio' },
    { number: 3, title: 'Configuración', icon: Zap, desc: 'Personalización inicial' },
    { number: 4, title: 'Plan & Listo', icon: CheckCircle, desc: 'Selección final' }
  ];

  const cafeTypes = [
    { id: 'traditional', name: 'Cafetería Tradicional', desc: 'Ambiente clásico y acogedor', icon: '☕' },
    { id: 'specialty', name: 'Café de Especialidad', desc: 'Enfoque en calidad y origen', icon: '🌟' },
    { id: 'coworking', name: 'Café + Coworking', desc: 'Espacio de trabajo', icon: '💻' },
    { id: 'bakery', name: 'Café + Panadería', desc: 'Con productos horneados', icon: '🥐' },
    { id: 'chain', name: 'Cadena/Franquicia', desc: 'Múltiples ubicaciones', icon: '🏢' },
    { id: 'other', name: 'Otro Concepto', desc: 'Modelo personalizado', icon: '🎯' }
  ];

  const plans = [
    {
      id: 'express',
      name: 'Café Express',
      price: '$29.990',
      period: '/mes',
      recommended: false,
      features: ['Hasta 50 productos', '1 cafetería', 'Menú digital básico', 'Soporte email'],
      color: 'border-gray-300',
      textColor: 'text-gray-700'
    },
    {
      id: 'premium',
      name: 'Café Premium',
      price: '$49.990',
      period: '/mes',
      recommended: true,
      features: ['Productos ilimitados', 'Hasta 3 sucursales', 'Analytics avanzados', 'Soporte 24/7'],
      color: 'border-primary-500 bg-primary-50',
      textColor: 'text-primary-700'
    },
    {
      id: 'enterprise',
      name: 'Café Enterprise',
      price: '$89.990',
      period: '/mes',
      recommended: false,
      features: ['Todo ilimitado', 'Multi-administrador', 'API personalizada', 'Soporte dedicado'],
      color: 'border-coffee-400',
      textColor: 'text-coffee-700'
    }
  ];

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simular registro
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  const goToLogin = () => {
    // Navegar a login (implementar según tu router)
    window.location.href = '/login';
  };

  const StepIndicator = useMemo(() => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center">
          <div className={`flex flex-col items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              currentStep >= step.number
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'border-gray-300 text-gray-400'
            }`}>
              {currentStep > step.number ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <step.icon className="h-6 w-6" />
              )}
            </div>
            <div className="mt-2 text-center">
              <div className={`text-sm font-semibold ${
                currentStep >= step.number ? 'text-primary-600' : 'text-gray-400'
              }`}>
                {step.title}
              </div>
              <div className="text-xs text-gray-500">{step.desc}</div>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 ${
              currentStep > step.number ? 'bg-primary-500' : 'bg-gray-300'
            }`}></div>
          )}
        </div>
      ))}
    </div>
  ), [currentStep, steps]);

  const Step1 = useMemo(() => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-coffee-900 mb-2">¡Hola! Cuéntanos sobre ti</h3>
        <p className="text-coffee-600">Información básica para configurar tu cuenta</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-coffee-900 mb-2">
            <User className="inline h-4 w-4 mr-2" />
            Nombre Completo *
          </label>
          <input
            type="text"
            value={formData.ownerName}
            onChange={(e) => handleInputChange('ownerName', e.target.value)}
            placeholder="Tu nombre y apellido"
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors form-input-enhanced"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-900 mb-2">
            <Phone className="inline h-4 w-4 mr-2" />
            Teléfono *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+56 9 xxxx xxxx"
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors form-input-enhanced"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-coffee-900 mb-2">
            <Mail className="inline h-4 w-4 mr-2" />
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="tu@email.com"
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors form-input-enhanced"
          />
          <p className="text-xs text-coffee-500 mt-1">
            Este será tu usuario para acceder a TappMesa
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-900 mb-2">
            🔒 Contraseña *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors form-input-enhanced"
          />
          <div className="text-xs text-coffee-500 mt-1">
            Debe contener al menos 8 caracteres, una mayúscula y un número
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-900 mb-2">
            🔒 Confirmar Contraseña *
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            placeholder="Repite tu contraseña"
            className={`w-full p-3 border rounded-lg focus:ring-2 transition-colors form-input-enhanced ${
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'
            }`}
          />
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
          )}
        </div>
      </div>

      <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary-500 mt-0.5" />
          <div>
            <h4 className="font-semibold text-primary-700 mb-1">Tu seguridad es importante</h4>
            <p className="text-primary-600 text-sm">
              Usamos cifrado de grado bancario. Tu contraseña se almacena de forma segura con Supabase Auth.
              Nunca compartiremos tu información personal.
            </p>
          </div>
        </div>
      </div>
    </div>
  ), [formData, handleInputChange]);

  const Step2 = useMemo(() => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-coffee-900 mb-2">Cuéntanos sobre tu cafetería</h3>
        <p className="text-coffee-600">Información para personalizar tu experiencia</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-coffee-900 mb-2">
            <Store className="inline h-4 w-4 mr-2" />
            Nombre de la Cafetería *
          </label>
          <input
            type="text"
            value={formData.cafeName}
            onChange={(e) => handleInputChange('cafeName', e.target.value)}
            placeholder="Ej: Café Central, Granos & Más, etc."
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors form-input-enhanced"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-900 mb-2">
            <MapPin className="inline h-4 w-4 mr-2" />
            Dirección *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="Dirección completa"
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors form-input-enhanced"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-900 mb-2">
            Ciudad *
          </label>
          <select
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors form-input-enhanced"
          >
            <option value="">Selecciona tu ciudad</option>
            <option value="santiago">Santiago</option>
            <option value="valparaiso">Valparaíso</option>
            <option value="concepcion">Concepción</option>
            <option value="la-serena">La Serena</option>
            <option value="antofagasta">Antofagasta</option>
            <option value="temuco">Temuco</option>
            <option value="rancagua">Rancagua</option>
            <option value="other">Otra ciudad</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-900 mb-2">
            <Users className="inline h-4 w-4 mr-2" />
            Capacidad de Asientos
          </label>
          <select
            value={formData.seatingCapacity}
            onChange={(e) => handleInputChange('seatingCapacity', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors form-input-enhanced"
          >
            <option value="">Selecciona capacidad</option>
            <option value="1-20">1-20 personas</option>
            <option value="21-50">21-50 personas</option>
            <option value="51-100">51-100 personas</option>
            <option value="100+">Más de 100 personas</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-coffee-900 mb-4">
          Tipo de Cafetería *
        </label>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cafeTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => handleInputChange('cafeType', type.id)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 hover:shadow-md hover-coffee ${
                formData.cafeType === type.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-primary-300'
              }`}
            >
              <div className="text-center">
                <div className="text-3xl mb-2">{type.icon}</div>
                <h4 className="font-semibold text-coffee-900 text-sm mb-1">{type.name}</h4>
                <p className="text-coffee-600 text-xs">{type.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ), [formData, handleInputChange, cafeTypes]);

  const Step3 = useMemo(() => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-coffee-900 mb-2">Configuración inicial</h3>
        <p className="text-coffee-600">Esto nos ayuda a preparar TappMesa perfectamente para ti</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-coffee-900 mb-4">
            ¿Cuántos productos tienes aproximadamente en tu menú?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: '1-25', label: '1-25 productos', desc: 'Menú básico' },
              { value: '26-50', label: '26-50 productos', desc: 'Menú mediano' },
              { value: '51-100', label: '51-100 productos', desc: 'Menú amplio' },
              { value: '100+', label: '100+ productos', desc: 'Menú extenso' }
            ].map((option) => (
              <div
                key={option.value}
                onClick={() => handleInputChange('menuSize', option.value)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 text-center hover-coffee ${
                  formData.menuSize === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="font-semibold text-coffee-900 text-sm mb-1">{option.label}</div>
                <div className="text-coffee-600 text-xs">{option.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-900 mb-4">
            ¿Qué sistema usas actualmente para tomar pedidos?
          </label>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { value: 'paper', label: '📝 Papel y lápiz', desc: 'Método tradicional' },
              { value: 'pos', label: '💻 Sistema POS', desc: 'Terminal punto de venta' },
              { value: 'app', label: '📱 App básica', desc: 'Aplicación simple' },
              { value: 'none', label: '🆕 Nada específico', desc: 'Primera digitalización' }
            ].map((option) => (
              <div
                key={option.value}
                onClick={() => handleInputChange('currentSystem', option.value)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 hover-coffee ${
                  formData.currentSystem === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-coffee-900">{option.label}</div>
                </div>
                <div className="text-coffee-600 text-sm mt-1">{option.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-coffee-900 mb-4">
            ¿Cuál es tu prioridad principal?
          </label>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              { value: 'efficiency', label: '⚡ Eficiencia en pedidos', desc: 'Reducir tiempos de espera' },
              { value: 'sales', label: '📈 Aumentar ventas', desc: 'Crecer ingresos' },
              { value: 'customer', label: '😊 Experiencia del cliente', desc: 'Mejorar satisfacción' },
              { value: 'analytics', label: '📊 Insights de negocio', desc: 'Datos para decisiones' }
            ].map((option) => (
              <div
                key={option.value}
                onClick={() => handleInputChange('priority', option.value)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 hover-coffee ${
                  formData.priority === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-primary-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="font-semibold text-coffee-900">{option.label}</div>
                </div>
                <div className="text-coffee-600 text-sm mt-1">{option.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ), [formData, handleInputChange]);

  const Step4 = useMemo(() => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-coffee-900 mb-2">Selecciona tu plan</h3>
        <p className="text-coffee-600">Puedes cambiar o cancelar en cualquier momento</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => handleInputChange('selectedPlan', plan.id)}
            className={`p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 relative hover-lift ${
              formData.selectedPlan === plan.id ? plan.color : 'border-gray-200 hover:border-primary-300'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Recomendado
                </span>
              </div>
            )}

            <div className="text-center">
              <h4 className={`text-xl font-bold mb-2 ${plan.textColor}`}>{plan.name}</h4>
              <div className="mb-4">
                <span className={`text-3xl font-bold ${plan.textColor}`}>{plan.price}</span>
                <span className="text-coffee-600">{plan.period}</span>
              </div>
              
              <div className="space-y-2 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-coffee-700">{feature}</span>
                  </div>
                ))}
              </div>

              {formData.selectedPlan === plan.id && (
                <div className="bg-primary-100 p-3 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-primary-500 mx-auto mb-2" />
                  <span className="text-primary-700 font-medium">Plan Seleccionado</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-cream-100 p-6 rounded-lg border border-cream-200">
        <h4 className="font-bold text-coffee-900 mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-500" />
          ¿Qué pasa después del registro?
        </h4>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
            <div>
              <div className="font-semibold text-coffee-900">Configuración Automática</div>
              <div className="text-coffee-600">TappMesa se configura según tus respuestas (5 min)</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
            <div>
              <div className="font-semibold text-coffee-900">Llamada de Bienvenida</div>
              <div className="text-coffee-600">Un especialista te ayuda a optimizar todo (15 min)</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
            <div>
              <div className="font-semibold text-coffee-900">¡Listo para Servir!</div>
              <div className="text-coffee-600">Tu cafetería digital funcionando perfectamente</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ), [formData, handleInputChange, plans]);

  if (success) {
    return (
      <div className="min-h-screen bg-linear-to-br from-cream-200 via-white to-cream-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 shadow-2xl border text-center max-w-2xl w-full">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h3 className="text-3xl font-bold text-coffee-900 mb-4">
            ¡Bienvenido a TappMesa! ☕
          </h3>
          <p className="text-coffee-600 mb-6 text-lg">
            <strong>{formData.cafeName}</strong> está siendo configurado con amor. 
            Recibirás un email con los próximos pasos en menos de 5 minutos.
          </p>
          
          <div className="bg-primary-50 p-4 rounded-lg mb-6 border border-primary-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Smartphone className="h-5 w-5 text-primary-500" />
              <span className="font-semibold text-primary-700">Tu cafetería digital:</span>
            </div>
            <div className="text-primary-600">
              <strong>{formData.cafeName.toLowerCase().replace(/\s+/g, '')}.tappmesa.cl</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors cta-button">
              Ir al Dashboard
            </button>
            {/* <button className="border-2 border-coffee-300 text-coffee-700 px-6 py-3 rounded-lg font-semibold hover:border-primary-500 hover:text-primary-500 transition-colors">
              Descargar App Móvil
            </button> */}
          </div>

          <p className="text-coffee-500 text-sm mt-4">
            Un especialista de TappMesa te contactará en las próximas 2 horas para ayudarte con la configuración inicial.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-cream-200 via-white to-cream-100 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-20 left-10 text-6xl opacity-10 animate-float">☕</div>
      <div className="absolute bottom-40 right-20 text-4xl opacity-10 animate-float-delay">🚀</div>
      <div className="absolute top-60 right-10 text-5xl opacity-10 animate-float">⭐</div>
      
      <div className="container mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-8">
            <button 
              onClick={goToLogin}
              className="flex items-center gap-2 text-coffee-600 hover:text-primary-500 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Inicio
            </button>
            
            <div className="flex items-center gap-2">
              <Coffee className="text-primary-500 h-8 w-8" />
              <span className="text-2xl font-bold text-coffee-900">TappMesa</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-coffee-900 mb-6">
            Registra tu <span className="text-primary-500">Cafetería</span>
          </h1>
          <p className="text-xl text-coffee-600 max-w-3xl mx-auto leading-relaxed">
            Configuración personalizada en 4 pasos simples. Sin tarjeta de crédito, 
            soporte en español, listo en 15 minutos.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-cream-200 overflow-hidden">
            <div className="p-8">
              {StepIndicator}

              {currentStep === 1 && Step1}
              {currentStep === 2 && Step2}
              {currentStep === 3 && Step3}
              {currentStep === 4 && Step4}
              
              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                    currentStep === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-coffee-600 hover:text-primary-500 hover:bg-primary-50'
                  }`}
                >
                  ← Anterior
                </button>

                <div className="text-center">
                  <div className="text-sm text-coffee-600 mb-1">
                    Paso {currentStep} de {steps.length}
                  </div>
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / steps.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    disabled={
                      (currentStep === 1 && (!formData.ownerName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword)) ||
                      (currentStep === 2 && (!formData.cafeName || !formData.address || !formData.city || !formData.cafeType)) ||
                      (currentStep === 3 && (!formData.menuSize || !formData.currentSystem || !formData.priority))
                    }
                    className={`px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 cta-button ${
                      ((currentStep === 1 && (!formData.ownerName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword)) ||
                       (currentStep === 2 && (!formData.cafeName || !formData.address || !formData.city || !formData.cafeType)) ||
                       (currentStep === 3 && (!formData.menuSize || !formData.currentSystem || !formData.priority)))
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    Continuar <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`px-8 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 cta-button ${
                      loading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Configurando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Crear Mi Cafetería Digital
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-white p-4 rounded-lg shadow-md border border-cream-200 hover-lift">
              <div className="text-2xl font-bold text-primary-500 mb-1">15 min</div>
              <div className="text-coffee-600 text-sm">Configuración Total</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border border-cream-200 hover-lift">
              <div className="text-2xl font-bold text-primary-500 mb-1">250+</div>
              <div className="text-coffee-600 text-sm">Cafeterías Activas</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border border-cream-200 hover-lift">
              <div className="text-2xl font-bold text-primary-500 mb-1">4.9★</div>
              <div className="text-coffee-600 text-sm">Satisfacción</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border border-cream-200 hover-lift">
              <div className="text-2xl font-bold text-primary-500 mb-1">24/7</div>
              <div className="text-coffee-600 text-sm">Soporte Técnico</div>
            </div>
          </div>

          {/* Security & Trust */}
          <div className="mt-8 text-center">
            <div className="flex justify-center items-center gap-6 text-sm text-coffee-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>Datos Encriptados SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cumple Ley Protección Datos</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                <span>Cancela Cuando Quieras</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
