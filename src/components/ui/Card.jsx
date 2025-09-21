// src/components/ui/Card.jsx
import React from "react";

const Card = ({
  children,
  className = "",
  variant = "default",
  padding = "medium",
  shadow = "sm",
  border = true,
  hover = false,
  onClick,
  ...props
}) => {
  const baseClasses = "card";

  const variantClasses = {
    default: "card-default",
    elevated: "card-elevated",
    outlined: "card-outlined",
    filled: "card-filled",
  };

  const paddingClasses = {
    none: "card-padding-none",
    small: "card-padding-sm",
    medium: "card-padding-md",
    large: "card-padding-lg",
  };

  const shadowClasses = {
    none: "card-shadow-none",
    sm: "card-shadow-sm",
    md: "card-shadow-md",
    lg: "card-shadow-lg",
    xl: "card-shadow-xl",
  };

  const classes = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    shadowClasses[shadow],
    border && "card-bordered",
    hover && "card-hover",
    onClick && "card-clickable",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const Component = onClick ? "button" : "div";

  return (
    <Component className={classes} onClick={onClick} {...props}>
      {children}
    </Component>
  );
};

export default Card;
