// src/components/Auth/RegistrationForm.jsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export default function RegistrationForm({ onSuccess }) {
  const { register, loading, error, registrationStep, setRegistrationStep } = useAuth();
  const [formData, setFormData] = useState({
    // Datos del restaurante
    restaurantName: '',
    restaurantType: '',
    address: '',
    city: '',
    phone: '',
    numberOfTables: '',
    
    // Datos del usuario
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    
    // Términos
    acceptTerms: false,
    acceptMarketing: false
  });

  const [validationErrors, setValidationErrors] = useState({});

  const validateStep = (step) => {
    const errors = {};

    if (step === 1) {
      if (!formData.restaurantName.trim()) errors.restaurantName = 'Nombre del restaurante requerido';
      if (!formData.restaurantType) errors.restaurantType = 'Tipo de restaurante requerido';
      if (!formData.address.trim()) errors.address = 'Dirección requerida';
      if (!formData.city.trim()) errors.city = 'Ciudad requerida';
      if (!formData.phone.trim()) errors.phone = 'Teléfono requerido';
      if (!formData.numberOfTables || formData.numberOfTables < 1) errors.numberOfTables = 'Número de mesas requerido';
    }

    if (step === 2) {
      if (!formData.ownerName.trim()) errors.ownerName = 'Nombre del propietario requerido';
      if (!formData.email.trim()) errors.email = 'Email requerido';
      if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email inválido';
      if (!formData.password || formData.password.length < 6) errors.password = 'Contraseña debe tener al menos 6 caracteres';
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (step === 3) {
      if (!formData.acceptTerms) errors.acceptTerms = 'Debe aceptar los términos y condiciones';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(registrationStep)) {
      setRegistrationStep(registrationStep + 1);
    }
  };

  const handleBack = () => {
    setRegistrationStep(registrationStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;

    const result = await register(formData);
    
    if (result.success) {
      onSuccess && onSuccess(result.user);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const renderStep1 = () => (
    <div className="registration-step">
      <h3>Información del Restaurante</h3>
      
      <div className="form-group">
        <label htmlFor="restaurantName">Nombre del Restaurante *</label>
        <input
          type="text"
          id="restaurantName"
          value={formData.restaurantName}
          onChange={(e) => updateFormData('restaurantName', e.target.value)}
          className={validationErrors.restaurantName ? 'error' : ''}
          placeholder="Ej: Restaurante La Bella Vista"
        />
        {validationErrors.restaurantName && <span className="error-text">{validationErrors.restaurantName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="restaurantType">Tipo de Restaurante *</label>
        <select
          id="restaurantType"
          value={formData.restaurantType}
          onChange={(e) => updateFormData('restaurantType', e.target.value)}
          className={validationErrors.restaurantType ? 'error' : ''}
        >
          <option value="">Selecciona...</option>
          <option value="casual-dining">Casual Dining</option>
          <option value="fast-food">Comida Rápida</option>
          <option value="fine-dining">Alta Cocina</option>
          <option value="cafe">Café/Bistro</option>
          <option value="bar">Bar/Pub</option>
          <option value="pizzeria">Pizzería</option>
          <option value="other">Otro</option>
        </select>
        {validationErrors.restaurantType && <span className="error-text">{validationErrors.restaurantType}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="address">Dirección *</label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={(e) => updateFormData('address', e.target.value)}
            className={validationErrors.address ? 'error' : ''}
            placeholder="Calle y número"
          />
          {validationErrors.address && <span className="error-text">{validationErrors.address}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="city">Ciudad *</label>
          <input
            type="text"
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData('city', e.target.value)}
            className={validationErrors.city ? 'error' : ''}
            placeholder="Ciudad"
          />
          {validationErrors.city && <span className="error-text">{validationErrors.city}</span>}
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="phone">Teléfono *</label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData('phone', e.target.value)}
            className={validationErrors.phone ? 'error' : ''}
            placeholder="+56 9 1234 5678"
          />
          {validationErrors.phone && <span className="error-text">{validationErrors.phone}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="numberOfTables">Número de Mesas *</label>
          <input
            type="number"
            id="numberOfTables"
            min="1"
            value={formData.numberOfTables}
            onChange={(e) => updateFormData('numberOfTables', parseInt(e.target.value))}
            className={validationErrors.numberOfTables ? 'error' : ''}
            placeholder="10"
          />
          {validationErrors.numberOfTables && <span className="error-text">{validationErrors.numberOfTables}</span>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="registration-step">
      <h3>Datos del Propietario</h3>
      
      <div className="form-group">
        <label htmlFor="ownerName">Nombre Completo *</label>
        <input
          type="text"
          id="ownerName"
          value={formData.ownerName}
          onChange={(e) => updateFormData('ownerName', e.target.value)}
          className={validationErrors.ownerName ? 'error' : ''}
          placeholder="Tu nombre completo"
        />
        {validationErrors.ownerName && <span className="error-text">{validationErrors.ownerName}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          className={validationErrors.email ? 'error' : ''}
          placeholder="tu@email.com"
        />
        {validationErrors.email && <span className="error-text">{validationErrors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Contraseña *</label>
        <input
          type="password"
          id="password"
          value={formData.password}
          onChange={(e) => updateFormData('password', e.target.value)}
          className={validationErrors.password ? 'error' : ''}
          placeholder="Mínimo 6 caracteres"
        />
        {validationErrors.password && <span className="error-text">{validationErrors.password}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
        <input
          type="password"
          id="confirmPassword"
          value={formData.confirmPassword}
          onChange={(e) => updateFormData('confirmPassword', e.target.value)}
          className={validationErrors.confirmPassword ? 'error' : ''}
          placeholder="Repetir contraseña"
        />
        {validationErrors.confirmPassword && <span className="error-text">{validationErrors.confirmPassword}</span>}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="registration-step">
      <h3>Confirmación y Términos</h3>
      
      <div className="trial-info">
        <div className="trial-badge">
          <span className="trial-icon">🎉</span>
          <div>
            <h4>¡Prueba Gratuita de 2 Meses!</h4>
            <p>Disfruta de todas las funcionalidades premium sin costo por 60 días.</p>
          </div>
        </div>

        <div className="included-features">
          <h4>Lo que incluye tu prueba:</h4>
          <ul>
            <li>✅ Menús digitales ilimitados</li>
            <li>✅ Sistema de comandas automático</li>
            <li>✅ Reservas online</li>
            <li>✅ Dashboard analítico</li>
            <li>✅ Soporte técnico</li>
            <li>✅ Hasta {formData.numberOfTables} mesas</li>
          </ul>
        </div>
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.acceptTerms}
            onChange={(e) => updateFormData('acceptTerms', e.target.checked)}
          />
          <span className="checkmark"></span>
          Acepto los <a href="/terms" target="_blank">términos y condiciones</a> y la <a href="/privacy" target="_blank">política de privacidad</a> *
        </label>
        {validationErrors.acceptTerms && <span className="error-text">{validationErrors.acceptTerms}</span>}
      </div>

      <div className="form-group checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.acceptMarketing}
            onChange={(e) => updateFormData('acceptMarketing', e.target.checked)}
          />
          <span className="checkmark"></span>
          Quiero recibir noticias y actualizaciones de TappMesa
        </label>
      </div>
    </div>
  );

  return (
    <div className="registration-form">
      <div className="form-header">
        <div className="step-indicator">
          <div className={`step ${registrationStep >= 1 ? 'active' : ''}`}>1</div>
          <div className={`step ${registrationStep >= 2 ? 'active' : ''}`}>2</div>
          <div className={`step ${registrationStep >= 3 ? 'active' : ''}`}>3</div>
        </div>
        <p>Paso {registrationStep} de 3</p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {registrationStep === 1 && renderStep1()}
        {registrationStep === 2 && renderStep2()}
        {registrationStep === 3 && renderStep3()}

        <div className="form-actions">
          {registrationStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary"
              disabled={loading}
            >
              Anterior
            </button>
          )}
          
          {registrationStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
              disabled={loading}
            >
              Siguiente
            </button>
          ) : (
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta Gratis'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}