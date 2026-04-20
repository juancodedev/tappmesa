// src/components/common/Logo.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const logoClasses = {
  size: {
    small: 'logo-small',
    medium: 'logo-medium',
    large: 'logo-large'
  },
  variant: {
    default: 'logo-default',
    white: 'logo-white',
    dark: 'logo-dark'
  }
};

const LogoContent = ({ variant, size }) => (
  <div className={`logo ${logoClasses.size[size]} ${logoClasses.variant[variant]}`}>
    <div className="logo-icon">
      <span className="logo-emoji">🍽️</span>
    </div>
    <div className="logo-text">
      <span className="logo-name">TappMesa</span>
      {size !== 'small' && (
        <span className="logo-tagline">Digital Restaurant</span>
      )}
    </div>
  </div>
);

const Logo = ({ variant = 'default', size = 'medium', linkTo = '/' }) => {
  const content = <LogoContent variant={variant} size={size} />;
  if (linkTo) {
    return (
      <Link to={linkTo} className="logo-link">
        {content}
      </Link>
    );
  }
  return content;
};

export default Logo;