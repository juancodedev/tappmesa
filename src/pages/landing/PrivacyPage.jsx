import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>
        <div className="prose max-w-none">
          <p className="text-gray-600 mb-4">
            En TappMesa, valoramos y respetamos tu privacidad. Esta política describe 
            cómo recopilamos, usamos y protegemos tu información personal.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Información que Recopilamos</h2>
          <p className="text-gray-600 mb-4">
            Recopilamos información que nos proporcionas directamente, como cuando 
            creas una cuenta o contactas nuestro soporte.
          </p>
          <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Uso de la Información</h2>
          <p className="text-gray-600 mb-4">
            Utilizamos tu información para proporcionarte nuestros servicios, 
            mejorar la experiencia del usuario y comunicarnos contigo.
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

export default PrivacyPage;
