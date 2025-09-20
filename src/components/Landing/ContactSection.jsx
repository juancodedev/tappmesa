// src/components/Landing/ContactSection.jsx
import { useState } from "react";
import { useInView } from "../../hooks/useInView";

export default function ContactSection({ onOpenRegister }) {
  const { ref, isInView } = useInView({ threshold: 0.2 });
  const [formData, setFormData] = useState({
    restaurantName: "",
    contactName: "",
    email: "",
    phone: "",
    numberOfTables: "",
    currentSolution: "",
    interests: [],
    message: "",
    preferredContact: "email",
    timeframe: "asap",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const interests = [
    { id: "menu-digital", label: "Menú Digital", icon: "📱" },
    { id: "comandas", label: "Comandas Automáticas", icon: "📋" },
    { id: "reservas", label: "Sistema de Reservas", icon: "📅" },
    { id: "pagos", label: "Pagos Integrados", icon: "💳" },
    { id: "analytics", label: "Reportes y Analytics", icon: "📊" },
    { id: "integracion", label: "Integración con POS", icon: "🔗" },
  ];

  const contactMethods = [
    { id: "email", label: "Email", icon: "📧" },
    { id: "phone", label: "Teléfono", icon: "📞" },
    { id: "whatsapp", label: "WhatsApp", icon: "💬" },
    { id: "video", label: "Video llamada", icon: "🎥" },
  ];

  const timeframes = [
    { id: "asap", label: "Lo antes posible" },
    { id: "week", label: "Esta semana" },
    { id: "month", label: "Este mes" },
    { id: "quarter", label: "Próximo trimestre" },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interestId) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter((id) => id !== interestId)
        : [...prev.interests, interestId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simular envío del formulario
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Aquí integrarías con tu API o servicio de emails
      console.log("Form submitted:", formData);

      setIsSubmitted(true);

      // Reset form after successful submission
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          restaurantName: "",
          contactName: "",
          email: "",
          phone: "",
          numberOfTables: "",
          currentSolution: "",
          interests: [],
          message: "",
          preferredContact: "email",
          timeframe: "asap",
        });
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error al enviar el formulario. Por favor intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section id="contact" className="contact-section success" ref={ref}>
        <div className="container">
          <div className="success-message">
            <div className="success-icon">🎉</div>
            <h2>¡Solicitud enviada exitosamente!</h2>
            <p>
              Nuestro equipo se pondrá en contacto contigo en las próximas 24
              horas para agendar tu demo personalizada.
            </p>

            <div className="next-steps">
              <h3>Mientras tanto:</h3>
              <ul>
                <li>📧 Revisa tu email para confirmar la solicitud</li>
                <li>📱 Síguenos en redes sociales para tips y novedades</li>
                <li>🎥 Ve nuestros casos de éxito en YouTube</li>
              </ul>
            </div>

            <div className="success-actions">
              <button onClick={onOpenRegister} className="cta-btn primary">
                Comenzar Prueba Gratis Ahora
              </button>
              <a href="#testimonials" className="btn-secondary">
                Ver Más Testimonios
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="contact-section" ref={ref}>
      <div className="container">
        <div className="section-header">
          <div className="section-badge">
            <span className="badge-icon">🚀</span>
            <span>Demo Gratuita</span>
          </div>

          <h2 className="section-title">
            ¿Listo para modernizar{" "}
            <span className="highlight">tu restaurante</span>?
          </h2>

          <p className="section-description">
            Solicita una demo personalizada y descubre cómo TappMesa puede
            transformar tu negocio en menos de 24 horas.
          </p>
        </div>

        <div className="contact-content">
          {/* Contact Form */}
          <div className="contact-form-container">
            <div className="form-header">
              <h3>Solicitar Demo Personalizada</h3>
              <div className="form-benefits">
                <div className="benefit">✅ Demo personalizada 30 min</div>
                <div className="benefit">✅ Setup gratuito incluido</div>
                <div className="benefit">✅ 2 meses de prueba gratis</div>
              </div>
            </div>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="restaurantName">
                    Nombre del Restaurante *
                  </label>
                  <input
                    type="text"
                    id="restaurantName"
                    value={formData.restaurantName}
                    onChange={(e) =>
                      handleInputChange("restaurantName", e.target.value)
                    }
                    placeholder="Ej: Restaurante La Bella Vista"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactName">Tu Nombre *</label>
                  <input
                    type="text"
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) =>
                      handleInputChange("contactName", e.target.value)
                    }
                    placeholder="Tu nombre completo"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Teléfono *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+56 9 1234 5678"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="numberOfTables">Número de Mesas</label>
                  <select
                    id="numberOfTables"
                    value={formData.numberOfTables}
                    onChange={(e) =>
                      handleInputChange("numberOfTables", e.target.value)
                    }
                  >
                    <option value="">Selecciona...</option>
                    <option value="1-5">1-5 mesas</option>
                    <option value="6-15">6-15 mesas</option>
                    <option value="16-30">16-30 mesas</option>
                    <option value="30+">Más de 30 mesas</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="currentSolution">
                    ¿Qué usas actualmente?
                  </label>
                  <select
                    id="currentSolution"
                    value={formData.currentSolution}
                    onChange={(e) =>
                      handleInputChange("currentSolution", e.target.value)
                    }
                  >
                    <option value="">Selecciona...</option>
                    <option value="nothing">Nada (menús físicos)</option>
                    <option value="basic-pos">POS básico</option>
                    <option value="advanced-pos">POS avanzado</option>
                    <option value="other-digital">Otra solución digital</option>
                    <option value="custom">Sistema personalizado</option>
                  </select>
                </div>
              </div>

              {/* Interests */}
              <div className="form-group">
                <label>¿Qué funcionalidades te interesan más?</label>
                <div className="interests-grid">
                  {interests.map((interest) => (
                    <button
                      key={interest.id}
                      type="button"
                      className={`interest-btn ${
                        formData.interests.includes(interest.id)
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => handleInterestToggle(interest.id)}
                    >
                      <span className="interest-icon">{interest.icon}</span>
                      <span className="interest-label">{interest.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Preference */}
              <div className="form-group">
                <label>¿Cómo prefieres que te contactemos?</label>
                <div className="contact-methods">
                  {contactMethods.map((method) => (
                    <label key={method.id} className="radio-label">
                      <input
                        type="radio"
                        name="preferredContact"
                        value={method.id}
                        checked={formData.preferredContact === method.id}
                        onChange={(e) =>
                          handleInputChange("preferredContact", e.target.value)
                        }
                      />
                      <span className="radio-custom"></span>
                      <span className="method-icon">{method.icon}</span>
                      <span className="method-label">{method.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Timeframe */}
              <div className="form-group">
                <label htmlFor="timeframe">
                  ¿Cuándo te gustaría implementar?
                </label>
                <select
                  id="timeframe"
                  value={formData.timeframe}
                  onChange={(e) =>
                    handleInputChange("timeframe", e.target.value)
                  }
                >
                  {timeframes.map((timeframe) => (
                    <option key={timeframe.id} value={timeframe.id}>
                      {timeframe.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div className="form-group">
                <label htmlFor="message">Mensaje adicional (opcional)</label>
                <textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  placeholder="Cuéntanos sobre tu restaurante, necesidades específicas o preguntas..."
                  rows="4"
                />
              </div>

              <div className="form-footer">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading-spinner"></span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">🚀</span>
                      Solicitar Demo Gratis
                    </>
                  )}
                </button>

                <p className="form-disclaimer">
                  Al enviar este formulario, aceptas que nos pongamos en
                  contacto contigo.
                  <a href="/privacy">Política de privacidad</a>
                </p>
              </div>
            </form>
          </div>

          {/* Contact Info */}
          <div className="contact-info">
            <div className="info-card">
              <h3>¿Prefieres hablar directamente?</h3>
              <div className="contact-methods-list">
                <div className="contact-method">
                  <div className="method-icon">💬</div>
                  <div className="method-info">
                    <strong>WhatsApp</strong>
                    <span>+56 9 8765 4321</span>
                    <small>Respuesta inmediata</small>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">📧</div>
                  <div className="method-info">
                    <strong>Email</strong>
                    <span>hola@tappmesa.com</span>
                    <small>Respuesta en 2 horas</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-card">
              <h3>Proceso de implementación</h3>
              <div className="process-steps">
                <div className="process-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <strong>Demo personalizada</strong>
                    <span>30 minutos para conocer tus necesidades</span>
                  </div>
                </div>

                <div className="process-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <strong>Setup gratuito</strong>
                    <span>Configuramos todo por ti en 24 horas</span>
                  </div>
                </div>

                <div className="process-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <strong>Capacitación</strong>
                    <span>Entrenamos a tu equipo para usar la plataforma</span>
                  </div>
                </div>

                <div className="process-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <strong>Lanzamiento</strong>
                    <span>Apoyo completo durante las primeras semanas</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-card guarantee">
              <div className="guarantee-icon">🛡️</div>
              <h3>Garantía de satisfacción</h3>
              <p>
                Si no estás completamente satisfecho con TappMesa en los
                primeros 30 días, te devolvemos el 100% de tu dinero. Sin
                preguntas.
              </p>
            </div>

            <div className="info-card">
              <h3>¿Necesitas ayuda urgente?</h3>
              <p>
                Si tienes un problema crítico o necesitas soporte inmediato:
              </p>
              <div className="urgent-contacts">
                <a href="tel:+56212345678" className="urgent-btn phone">
                  📞 Llamar ahora
                </a>
                <a
                  href="https://wa.me/56987654321"
                  className="urgent-btn whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Preview */}
        <div className="contact-faq">
          <h3>Preguntas frecuentes</h3>
          <div className="faq-grid">
            <div className="faq-item">
              <h4>¿Cuánto tiempo toma la implementación?</h4>
              <p>
                Típicamente 24-48 horas desde la contratación hasta estar
                completamente operativo. Incluye setup, capacitación y pruebas.
              </p>
            </div>

            <div className="faq-item">
              <h4>¿Necesito cambiar mi POS actual?</h4>
              <p>
                No necesariamente. TappMesa se integra con la mayoría de
                sistemas POS existentes. En la demo evaluamos tu caso
                específico.
              </p>
            </div>

            <div className="faq-item">
              <h4>¿Qué pasa si mi internet falla?</h4>
              <p>
                TappMesa funciona offline. Los pedidos se sincronizan
                automáticamente cuando se restaura la conexión. Tu operación
                nunca se detiene.
              </p>
            </div>

            <div className="faq-item">
              <h4>¿Mis clientes necesitan descargar una app?</h4>
              <p>
                No. Los clientes acceden al menú simplemente escaneando el
                código QR con la cámara de su celular. Funciona en cualquier
                dispositivo.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="emergency-contact">
          <div className="emergency-content">
            <div className="emergency-icon">🚨</div>
            <div className="emergency-text">
              <h4>¿Tu sistema actual está fallando?</h4>
              <p>
                Podemos implementar TappMesa en modo urgencia en menos de 4
                horas
              </p>
            </div>
            <a href="tel:+56212345678" className="emergency-btn">
              Llamar Emergencia
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
