import React from 'react';
import { Link } from 'react-router-dom';

const HelpPage = () => (
  <div className="min-h-screen bg-gray-50 py-12">
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Centro de Ayuda</h1>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Preguntas Frecuentes</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">¿Cómo empiezo a usar TappMesa?</h3>
                <p className="text-gray-600 text-sm mt-1">
                  Simplemente regístrate, configura tu restaurante y comenzarás 
                  a recibir órdenes digitales.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">¿Necesito hardware especial?</h3>
                <p className="text-gray-600 text-sm mt-1">
                  No, TappMesa funciona en cualquier dispositivo con internet.
                </p>
              </div>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contacto</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span>📧</span>
                <span className="text-gray-600">soporte@tappmesa.com</span>
              </div>
              <div className="flex items-center gap-3">
                <span>📞</span>
                <span className="text-gray-600">+56 9 1234 5678</span>
              </div>
              <div className="flex items-center gap-3">
                <span>🕐</span>
                <span className="text-gray-600">Lun-Vie 9:00-18:00</span>
              </div>
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

export default HelpPage;
