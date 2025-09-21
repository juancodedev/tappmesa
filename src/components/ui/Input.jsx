// src/components/ui/Input.jsx
import React, { useState, forwardRef } from 'react';

const Input = forwardRef(({ 
  label,
  type = 'text',
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = '',
  id,
  name,
  autoComplete,
  maxLength,
  minLength,
  pattern,
  ...props 
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const inputClasses = [
    'input',
    isFocused && 'input-focused',
    error && 'input-error',
    disabled && 'input-disabled',
    value && 'input-has-value',
    className
  ].filter(Boolean).join(' ');

  const containerClasses = [
    'input-container',
    isFocused && 'container-focused',
    error && 'container-error',
    disabled && 'container-disabled'
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}
      
      <div className="input-wrapper">
        <input
          ref={ref}
          id={inputId}
          name={name || inputId}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          className={inputClasses}
          {...props}
        />
        
        {/* Character counter */}
        {maxLength && value && (
          <div className="char-counter">
            <span className={value.length > maxLength * 0.9 ? 'warning' : ''}>
              {value.length}/{maxLength}
            </span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="input-error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;