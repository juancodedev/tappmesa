// src/pages/auth/components/BusinessInfoForm.jsx
import React, { useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const BusinessInfoForm = ({
  formData,
  updateFormData,
  errors,
  onNext,
  onPrev,
  currentStep,
  totalSteps,
}) => {
  const [logoPreview, setLogoPreview] = useState(null);

  const businessTypes = [
    { value: "restaurant", label: "Restaurante", icon: "🍽️" },
    { value: "cafe", label: "Café/Cafetería", icon: "☕" },
    { value: "bar", label: "Bar/Pub", icon: "🍺" },
    { value: "bakery", label: "Panadería", icon: "🥖" },
    { value: "pizzeria", label: "Pizzería", icon: "🍕" },
    { value: "fastfood", label: "Comida Rápida", icon: "🍔" },
    { value: "food_truck", label: "Food Truck", icon: "🚚" },
    { value: "ice_cream", label: "Heladería", icon: "🍦" },
    { value: "other", label: "Otro", icon: "🏪" },
  ];

  const regions = [
    "Arica y Parinacota",
    "Tarapacá",
    "Antofagasta",
    "Atacama",
    "Coquimbo",
    "Valparaíso",
    "Metropolitana de Santiago",
    "O'Higgins",
    "Maule",
    "Ñuble",
    "Biobío",
    "La Araucanía",
    "Los Ríos",
    "Los Lagos",
    "Aysén",
    "Magallanes y Antártica Chilena",
  ];

  const handleInputChange = (field, value) => {
    updateFormData({ [field]: value });
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona un archivo de imagen válido");
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo debe ser menor a 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
        updateFormData({ businessLogo: file });
      };
      reader.readAsDataURL(file);
    }
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[áàäâ]/g, "a")
      .replace(/[éèëê]/g, "e")
      .replace(/[íìïî]/g, "i")
      .replace(/[óòöô]/g, "o")
      .replace(/[úùüû]/g, "u")
      .replace(/[ñ]/g, "n")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  };

  const handleBusinessNameChange = (value) => {
    handleInputChange("businessName", value);
    // Auto-generar slug si no ha sido modificado manualmente
    if (!formData.customSlug) {
      const slug = generateSlug(value);
      handleInputChange("businessSlug", slug);
    }
  };

  return (
    <div className="business-info-form">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onNext();
        }}
      >
        {/* Logo del Negocio */}
        <div className="form-group">
          <label className="form-label">Logo del Negocio</label>
          <div className="logo-upload">
            <div className="logo-preview">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="logo-image"
                />
              ) : (
                <div className="logo-placeholder">
                  <span className="logo-icon">🏪</span>
                  <span className="logo-text">Logo</span>
                </div>
              )}
            </div>
            <div className="logo-upload-controls">
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden-input"
              />
              <label htmlFor="logo-upload" className="upload-button">
                Subir Logo
              </label>
              <div className="upload-help">JPG, PNG o SVG. Máximo 5MB.</div>
            </div>
          </div>
        </div>

        {/* Nombre del Negocio */}
        <div className="form-group">
          <Input
            label="Nombre del Negocio *"
            type="text"
            value={formData.businessName}
            onChange={(e) => handleBusinessNameChange(e.target.value)}
            error={errors.businessName}
            placeholder="Ej: Café Central"
            maxLength={50}
          />
        </div>

        {/* URL del Negocio */}
        <div className="form-group">
          <label className="form-label">URL de tu TappMesa *</label>
          <div className="url-input-group">
            <div className="url-prefix">https://</div>
            <input
              type="text"
              value={formData.businessSlug}
              onChange={(e) => {
                const slug = generateSlug(e.target.value);
                handleInputChange("businessSlug", slug);
                handleInputChange("customSlug", true);
              }}
              placeholder="mi-restaurante"
              className="url-input"
              maxLength={30}
            />
            <div className="url-suffix">.tappmesa.com</div>
          </div>
          <div className="url-preview">
            Tu menú digital estará en:{" "}
            <strong>
              https://{formData.businessSlug || "mi-restaurante"}.tappmesa.com
            </strong>
          </div>
          {errors.businessSlug && (
            <div className="error-message">{errors.businessSlug}</div>
          )}
        </div>

        {/* Tipo de Negocio */}
        <div className="form-group">
          <label className="form-label">Tipo de Negocio *</label>
          <div className="business-types-grid">
            {businessTypes.map((type) => (
              <label
                key={type.value}
                className={`business-type-option ${
                  formData.businessType === type.value ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="businessType"
                  value={type.value}
                  checked={formData.businessType === type.value}
                  onChange={(e) =>
                    handleInputChange("businessType", e.target.value)
                  }
                  className="hidden-radio"
                />
                <div className="business-type-content">
                  <span className="business-type-icon">{type.icon}</span>
                  <span className="business-type-label">{type.label}</span>
                </div>
              </label>
            ))}
          </div>
          {errors.businessType && (
            <div className="error-message">{errors.businessType}</div>
          )}
        </div>

        {/* Dirección */}
        <div className="form-group">
          <Input
            label="Dirección *"
            type="text"
            value={formData.address}
            onChange={(e) => handleInputChange("address", e.target.value)}
            error={errors.address}
            placeholder="Ej: Av. Providencia 1234"
            maxLength={100}
          />
        </div>

        {/* Ciudad y Región */}
        <div className="form-grid">
          <div className="form-group">
            <Input
              label="Ciudad *"
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange("city", e.target.value)}
              error={errors.city}
              placeholder="Ej: Santiago"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Región *</label>
            <select
              value={formData.region}
              onChange={(e) => handleInputChange("region", e.target.value)}
              className={`form-select ${errors.region ? "error" : ""}`}
            >
              <option value="">Selecciona una región</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
            {errors.region && (
              <div className="error-message">{errors.region}</div>
            )}
          </div>
        </div>

        {/* Descripción */}
        <div className="form-group">
          <label className="form-label">Descripción del Negocio</label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Cuéntanos sobre tu negocio, especialidades, ambiente, etc."
            className="form-textarea"
            rows={4}
            maxLength={500}
          />
          <div className="char-counter">
            {formData.description?.length || 0}/500
          </div>
        </div>

        {/* Sitio Web */}
        <div className="form-group">
          <Input
            label="Sitio Web"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange("website", e.target.value)}
            error={errors.website}
            placeholder="https://mi-restaurante.com"
          />
          <div className="input-help">
            Si tienes un sitio web, agrega el enlace aquí
          </div>
        </div>

        {/* Número de Mesas */}
        <div className="form-group">
          <label className="form-label">
            ¿Cuántas mesas tienes aproximadamente?
          </label>
          <div className="table-count-options">
            {[
              { value: "1-5", label: "1-5 mesas", icon: "🪑" },
              { value: "6-15", label: "6-15 mesas", icon: "🍽️" },
              { value: "16-30", label: "16-30 mesas", icon: "🏪" },
              { value: "31+", label: "Más de 30", icon: "🏢" },
            ].map((option) => (
              <label
                key={option.value}
                className={`table-count-option ${
                  formData.tableCount === option.value ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="tableCount"
                  value={option.value}
                  checked={formData.tableCount === option.value}
                  onChange={(e) =>
                    handleInputChange("tableCount", e.target.value)
                  }
                  className="hidden-radio"
                />
                <div className="table-count-content">
                  <span className="table-count-icon">{option.icon}</span>
                  <span className="table-count-label">{option.label}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="form-actions">
          <Button
            type="button"
            onClick={onPrev}
            variant="outline"
            className="btn-large"
          >
            ← Anterior
          </Button>

          <div className="step-info">
            Paso {currentStep} de {totalSteps}
          </div>

          <Button type="submit" className="btn-primary btn-large">
            Continuar
            <span className="btn-arrow">→</span>
          </Button>
        </div>
      </form>

      {/* Preview Card */}
      <div className="business-preview">
        <h3>Vista Previa</h3>
        <div className="preview-card">
          <div className="preview-header">
            <div className="preview-logo">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" />
              ) : (
                <span>🏪</span>
              )}
            </div>
            <div className="preview-info">
              <h4>{formData.businessName || "Nombre del Negocio"}</h4>
              <p>
                {formData.businessType
                  ? businessTypes.find((t) => t.value === formData.businessType)
                      ?.label
                  : "Tipo de negocio"}
              </p>
            </div>
          </div>
          <div className="preview-content">
            <p>
              {formData.description ||
                "Descripción del negocio aparecerá aquí..."}
            </p>
            <div className="preview-location">
              📍 {formData.address || "Dirección"}, {formData.city || "Ciudad"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessInfoForm;
