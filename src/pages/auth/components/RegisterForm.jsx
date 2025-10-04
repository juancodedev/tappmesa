// src/pages/auth/components/RegisterForm.jsx
import React, { useState } from 'react';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const RegisterForm = ({ 
  formData, 
  updateFormData, 
  errors, 
  onNext, 
  currentStep, 
  totalSteps 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value });
    
    // Calcular fortaleza de contraseña
    if (field === 'password') {
      calculatePasswordStrength(value);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 0:
      case 1: return { label: 'Muy débil', color: '#ff4757' };
      case 2: return { label: 'Débil', color: '#ff6b35' };
      case 3: return { label: 'Regular', color: '#ffa500' };
      case 4: return { label: 'Fuerte', color: '#26de81' };
      case 5: return { label: 'Muy fuerte', color: '#00d2d3' };
      default: return { label: '', color: '#ddd' };
    }
  };

  const formatPhoneNumber = (value) => {
    // Remover todos los caracteres no numéricos excepto el +
    const cleaned = value.replace(/[^\d+]/g, '');
    
    // Si empieza con +56, formatear como número chileno
    if (cleaned.startsWith('+56')) {
      const number = cleaned.slice(3);
      if (number.length <= 1) return '+56 ';
      if (number.length <= 5) return `+56 ${number}`;
      return `+56 ${number.slice(0, 1)} ${number.slice(1, 5)} ${number.slice(5, 9)}`;
    }
    
    // Si empieza con 9, asumir que es chileno
    if (cleaned.startsWith('9')) {
      if (cleaned.length <= 1) return cleaned;
      if (cleaned.length <= 5) return cleaned;
      return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 5)} ${cleaned.slice(5, 9)}`;
    }
    
    return cleaned;
  };

  const handlePhoneChange = (value) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange('phone', formatted);
  };

  return (
    <div className="register-form">
      <form onSubmit={(e) => { e.preventDefault(); onNext(); }}>
        <div className="form-grid">
          {/* Nombre */}
          <div className="form-group">
            <Input
              label="Nombre *"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              error={errors.firstName}
              placeholder="Ej: Juan"
              maxLength={50}
            />
          </div>

          {/* Apellido */}
          <div className="form-group">
            <Input
              label="Apellido *"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              error={errors.lastName}
              placeholder="Ej: Pérez"
              maxLength={50}
            />
          </div>
        </div>

        {/* Email */}
        <div className="form-group">
          <Input
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            placeholder="tu@restaurante.com"
            autoComplete="email"
          />
          <div className="input-help">
            Este será tu email para acceder a TappMesa
          </div>
        </div>

        {/* Teléfono */}
        <div className="form-group">
          <Input
            label="Teléfono *"
            type="tel"
            value={formData.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            error={errors.phone}
            placeholder="+56 9 1234 5678"
            autoComplete="tel"
          />
          <div className="input-help">
            Usado para soporte y notificaciones importantes
          </div>
        </div>

        {/* Contraseña */}
        <div className="form-group">
          <div className="password-field">
            <Input
              label="Contraseña *"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          {formData.password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div 
                  className="strength-fill"
                  style={{ 
                    width: `${(passwordStrength / 5) * 100}%`,
                    backgroundColor: getPasswordStrengthLabel().color
                  }}
                />
              </div>
              <span 
                className="strength-label"
                style={{ color: getPasswordStrengthLabel().color }}
              >
                {getPasswordStrengthLabel().label}
              </span>
            </div>
          )}
          
          <div className="password-requirements">
            <div className="requirement-item">
              <span className={formData.password.length >= 8 ? 'valid' : 'invalid'}>
                {formData.password.length >= 8 ? '✓' : '○'}
              </span>
              Al menos 8 caracteres
            </div>
            <div className="requirement-item">
              <span className={/[a-z]/.test(formData.password) ? 'valid' : 'invalid'}>
                {/[a-z]/.test(formData.password) ? '✓' : '○'}
              </span>
              Una letra minúscula
            </div>
            <div className="requirement-item">
              <span className={/[A-Z]/.test(formData.password) ? 'valid' : 'invalid'}>
                {/[A-Z]/.test(formData.password) ? '✓' : '○'}
              </span>
              Una letra mayúscula
            </div>
            <div className="requirement-item">
              <span className={/[0-9]/.test(formData.password) ? 'valid' : 'invalid'}>
                {/[0-9]/.test(formData.password) ? '✓' : '○'}
              </span>
              Un número
            </div>
          </div>
        </div>

        {/* Confirmar Contraseña */}
        <div className="form-group">
          <div className="password-field">
            <Input
              label="Confirmar Contraseña *"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          {formData.confirmPassword && (
            <div className="password-match">
              {formData.password === formData.confirmPassword ? (
                <span className="match-success">✓ Las contraseñas coinciden</span>
              ) : (
                <span className="match-error">✗ Las contraseñas no coinciden</span>
              )}
            </div>
          )}
        </div>

        {/* Términos y Condiciones */}
        <div className="form-group">
          <div className="checkbox-group">
            <label className="checkbox-label" htmlFor="acceptTerms">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">
                Acepto los <a href="/terms" target="_blank">Términos de Servicio</a> y
                la <a href="/privacy" target="_blank">Política de Privacidad</a> *
              </span>
            </label>
            {errors.acceptTerms && (
              <div className="error-message">{errors.acceptTerms}</div>
            )}
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label" htmlFor="acceptMarketing">
              <input
                type="checkbox"
                id="acceptMarketing"
                name="acceptMarketing"
                checked={formData.acceptMarketing}
                onChange={(e) => handleInputChange('acceptMarketing', e.target.checked)}
                className="checkbox-input"
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">
                Acepto recibir emails sobre novedades y consejos de TappMesa
              </span>
            </label>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="form-actions">
          <div className="step-info">
            Paso {currentStep} de {totalSteps}
          </div>
          <Button type="submit" className="btn-primary btn-large">
            Continuar
            <span className="btn-arrow">→</span>
          </Button>
        </div>
      </form>

      {/* Métodos alternativos de registro */}
      <div className="alternative-signup">
        <div className="divider">
          <span>o regístrate con</span>
        </div>
        
        <div className="social-buttons">
          <button className="social-btn google">
            <span className="social-icon">🔍</span>
            Google
          </button>
          <button className="social-btn facebook">
            <span className="social-icon">📘</span>
            Facebook
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;