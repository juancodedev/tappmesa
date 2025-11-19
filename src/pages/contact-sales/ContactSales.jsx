// src/pages/contact-sales/ContactSales.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  Mail,
  Phone,
  Building2,
  User,
  Coffee,
  Sparkles
} from 'lucide-react';

const ContactSales = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    mensaje: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!/^[+]?[\d\s()-]{8,}$/.test(formData.telefono)) {
      newErrors.telefono = 'Teléfono inválido';
    }

    if (!formData.empresa.trim()) {
      newErrors.empresa = 'El nombre de la empresa es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Integrar con API de envío de emails o CRM
      // Por ahora simulamos el envío
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('Formulario de contacto enviado:', formData);

      setIsSubmitted(true);

      // Resetear formulario después de 3 segundos
      setTimeout(() => {
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          empresa: '',
          mensaje: ''
        });
        setIsSubmitted(false);
      }, 3000);

    } catch (error) {
      console.error('Error al enviar formulario:', error);
      setErrors({ submit: 'Hubo un error al enviar el formulario. Por favor intenta de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-primary-50/20 to-gray-50">
      {/* Navbar Simple */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => navigate('/')}>
              <div className="relative">
                <div className="absolute inset-0 bg-linear-to-br from-primary-500 to-secondary-500 rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-linear-to-br from-primary-500 to-secondary-500 p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Coffee className="w-5 h-5 text-white" />
                </div>
              </div>
              <span className="text-2xl text-gray-700 font-bold bg-linear-to-r from-primary-600 to-secondary-600 bg-clip-text">
                TappMesa
              </span>
            </div>

            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-primary-600 hover:bg-gray-100/50 rounded-lg transition-all font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Inicio
            </button>
          </div>
        </div>
      </nav>

      {/* Decorative gradient blobs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-primary-300/20 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-secondary-300/20 rounded-full blur-3xl animate-float-delay pointer-events-none" />

      {/* Main Content */}
      <div className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* Left Column - Info */}
            <div className="lg:sticky lg:top-32">
              <div className="inline-flex items-center gap-2 bg-linear-to-r from-primary-100 to-secondary-100 px-5 py-2.5 rounded-full mb-6 border border-primary-200/50">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <span className="text-sm font-bold text-primary-700">Contacta con Ventas</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-gray-900">
                Hablemos de tu
                <span className="block bg-linear-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mt-2">
                  Transformación Digital
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Nuestro equipo de expertos está listo para ayudarte a llevar tu cafetería o restaurante al siguiente nivel.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Demo Personalizada</h3>
                    <p className="text-gray-600">Te mostraremos cómo TappMesa se adapta a tu negocio</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Consultoría Gratuita</h3>
                    <p className="text-gray-600">Analizamos tus necesidades sin compromiso</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Respuesta en 24h</h3>
                    <p className="text-gray-600">Nos pondremos en contacto contigo rápidamente</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200/50">
                <p className="text-sm text-gray-600 mb-2">Confían en nosotros</p>
                <p className="text-3xl font-bold text-gray-900">300+</p>
                <p className="text-gray-600">Cafeterías y Restaurantes</p>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="relative">
              <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100">
                {!isSubmitted ? (
                  <>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Completa tus datos
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Nombre */}
                      <div>
                        <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombre Completo *
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            id="nombre"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            className={`w-full pl-12 pr-4 py-3.5 border ${
                              errors.nombre ? 'border-red-500' : 'border-gray-300'
                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                            placeholder="Juan Pérez"
                          />
                        </div>
                        {errors.nombre && (
                          <p className="mt-1.5 text-sm text-red-600">{errors.nombre}</p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Corporativo *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={`w-full pl-12 pr-4 py-3.5 border ${
                              errors.email ? 'border-red-500' : 'border-gray-300'
                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                            placeholder="juan@empresa.com"
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      {/* Teléfono */}
                      <div>
                        <label htmlFor="telefono" className="block text-sm font-semibold text-gray-700 mb-2">
                          Teléfono *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="tel"
                            id="telefono"
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            className={`w-full pl-12 pr-4 py-3.5 border ${
                              errors.telefono ? 'border-red-500' : 'border-gray-300'
                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                            placeholder="+56 9 1234 5678"
                          />
                        </div>
                        {errors.telefono && (
                          <p className="mt-1.5 text-sm text-red-600">{errors.telefono}</p>
                        )}
                      </div>

                      {/* Empresa */}
                      <div>
                        <label htmlFor="empresa" className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombre de la Empresa *
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            id="empresa"
                            name="empresa"
                            value={formData.empresa}
                            onChange={handleChange}
                            className={`w-full pl-12 pr-4 py-3.5 border ${
                              errors.empresa ? 'border-red-500' : 'border-gray-300'
                            } rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                            placeholder="Cafetería Luna"
                          />
                        </div>
                        {errors.empresa && (
                          <p className="mt-1.5 text-sm text-red-600">{errors.empresa}</p>
                        )}
                      </div>

                      {/* Mensaje (Opcional) */}
                      <div>
                        <label htmlFor="mensaje" className="block text-sm font-semibold text-gray-700 mb-2">
                          Mensaje (Opcional)
                        </label>
                        <textarea
                          id="mensaje"
                          name="mensaje"
                          value={formData.mensaje}
                          onChange={handleChange}
                          rows="4"
                          className="w-full px-4 py-3.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                          placeholder="Cuéntanos sobre tu negocio y qué te gustaría lograr con TappMesa..."
                        />
                      </div>

                      {errors.submit && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-sm text-red-600">{errors.submit}</p>
                        </div>
                      )}

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-8 py-4 bg-linear-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:shadow-2xl hover:shadow-primary-500/30 hover:scale-105 transition-all font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Enviar Solicitud
                          </>
                        )}
                      </button>

                      <p className="text-xs text-gray-500 text-center">
                        Al enviar este formulario, aceptas que un miembro de nuestro equipo se ponga en contacto contigo.
                      </p>
                    </form>
                  </>
                ) : (
                  <div className="py-12 text-center animate-fade-in">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      ¡Mensaje Enviado!
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Gracias por contactarnos. Nos pondremos en contacto contigo pronto.
                    </p>
                    <button
                      onClick={() => navigate('/')}
                      className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-semibold"
                    >
                      Volver al Inicio
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSales;
