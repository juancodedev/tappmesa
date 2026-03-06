import React from 'react';
import { Link } from 'react-router-dom';

const ContactPage = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-2xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Contacto</h1>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">¿Tienes alguna pregunta?</h2>
          <p className="text-gray-600 mb-6">
            Estamos aquí para ayudarte. Contacta con nuestro equipo y te responderemos 
            lo antes posible.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">📧</div>
              <h3 className="font-medium text-gray-900">Email</h3>
              <p className="text-gray-600">soporte@tappmesa.com</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">📞</div>
              <h3 className="font-medium text-gray-900">Teléfono</h3>
              <p className="text-gray-600">+56 9 1234 5678</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link to="/" className="text-primary hover:text-primary/90">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  </div>
);

export default ContactPage;
