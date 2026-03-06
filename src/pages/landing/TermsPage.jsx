import React from 'react';
import { Link } from 'react-router-dom';

const TermsPage = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos de Servicio</h1>
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-4">
            Bienvenido a TappMesa. Estos términos de servicio describen las reglas 
            y regulaciones para el uso de nuestros servicios.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Aceptación de Términos</h2>
          <p className="text-gray-600 mb-4">
            Al acceder y usar TappMesa, aceptas estar sujeto a estos términos de servicio.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Uso del Servicio</h2>
          <p className="text-gray-600 mb-4">
            Puedes usar nuestro servicio para gestionar tu restaurante de acuerdo 
            con estos términos y todas las leyes aplicables.
          </p>
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

export default TermsPage;
