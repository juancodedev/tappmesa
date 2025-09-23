// src/pages/landing/components/DemoSection.jsx - Versión con Tailwind
import React, { useState } from 'react';

const DemoSection = () => {
  const [activeDemo, setActiveDemo] = useState('menu');
  const [selectedCategory, setSelectedCategory] = useState('principales');
  const [cartItems, setCartItems] = useState([]);

  const demoTabs = [
    { id: 'menu', label: 'Menú Digital', icon: '📱' },
    { id: 'cart', label: 'Carrito', icon: '🛒' },
    { id: 'orders', label: 'Comandas', icon: '📋' },
    { id: 'reservations', label: 'Reservas', icon: '🗓️' }
  ];

  const menuCategories = [
    { id: 'principales', name: 'Platos Principales', icon: '🍽️' },
    { id: 'bebidas', name: 'Bebidas', icon: '🥤' },
    { id: 'postres', name: 'Postres', icon: '🍰' }
  ];

  const menuItems = {
    principales: [
      {
        id: 1,
        name: 'Pizza Margherita',
        description: 'Base de tomate, mozzarella fresca, albahaca y aceite de oliva',
        price: 18900,
        image: '🍕',
        category: 'principales'
      },
      {
        id: 2,
        name: 'Hamburguesa Clásica',
        description: 'Carne de res, lechuga, tomate, cebolla, queso cheddar',
        price: 15500,
        image: '🍔',
        category: 'principales'
      },
      {
        id: 3,
        name: 'Ensalada César',
        description: 'Lechuga romana, crutones, parmesano, aderezo césar',
        price: 12900,
        image: '🥗',
        category: 'principales'
      }
    ],
    bebidas: [
      {
        id: 4,
        name: 'Café Americano',
        description: 'Café espresso con agua caliente',
        price: 3500,
        image: '☕',
        category: 'bebidas'
      },
      {
        id: 5,
        name: 'Jugo Natural',
        description: 'Naranja, manzana o piña',
        price: 4200,
        image: '🧃',
        category: 'bebidas'
      }
    ],
    postres: [
      {
        id: 6,
        name: 'Tiramisu',
        description: 'Postre italiano con café, mascarpone y cacao',
        price: 8500,
        image: '🍰',
        category: 'postres'
      }
    ]
  };

  const orders = [
    {
      id: 'ORD-001',
      table: 5,
      items: ['Pizza Margherita', 'Café Americano'],
      status: 'preparando',
      time: '5 min',
      total: 22400,
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'ORD-002',
      table: 8,
      items: ['Hamburguesa Clásica', 'Jugo Natural'],
      status: 'listo',
      time: '12 min',
      total: 19700,
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'ORD-003',
      table: 3,
      items: ['Ensalada César', 'Tiramisu'],
      status: 'nuevo',
      time: '0 min',
      total: 21400,
      statusColor: 'bg-red-100 text-red-800'
    }
  ];

  const reservations = [
    {
      id: 'RES-001',
      customerName: 'Juan Pérez',
      date: '2025-09-20',
      time: '20:00',
      guests: 4,
      table: 'Mesa 12',
      status: 'confirmada',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'RES-002',
      customerName: 'María García',
      date: '2025-09-20',
      time: '21:30',
      guests: 2,
      table: 'Mesa 6',
      status: 'pendiente',
      statusColor: 'bg-yellow-100 text-yellow-800'
    }
  ];

  const addToCart = (item) => {
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCartItems(cartItems.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(itemId);
    } else {
      setCartItems(cartItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const renderMenuDemo = () => (
    <div className="p-6">
      <div className="text-center mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">Restaurante Demo</h3>
        <p className="text-gray-600">Mesa #5 - Bienvenido</p>
      </div>
      
      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {menuCategories.map(category => (
          <button
            key={category.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-primary-100'
            }`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span>{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {menuItems[selectedCategory]?.map(item => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                {item.image}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{item.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-primary-500">{formatPrice(item.price)}</span>
                  <button 
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-colors touch-target"
                    onClick={() => addToCart(item)}
                  >
                    Agregar +
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCartDemo = () => (
    <div className="p-6">
      <div className="text-center mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">Tu Pedido</h3>
        <p className="text-gray-600">Mesa #5</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-600 mb-6">Tu carrito está vacío</p>
          <button 
            onClick={() => setActiveDemo('menu')}
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors touch-target"
          >
            Ver Menú
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-6">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-2xl">{item.image}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{item.name}</h4>
                  <p className="text-primary-500 font-medium">{formatPrice(item.price)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="font-semibold w-8 text-center">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
                <button 
                  className="text-red-500 hover:text-red-700 p-2 transition-colors"
                  onClick={() => removeFromCart(item.id)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-primary-500">{formatPrice(getCartTotal())}</span>
            </div>
            <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-lg font-semibold text-lg transition-colors touch-target">
              Enviar a Cocina
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderOrdersDemo = () => (
    <div className="p-6">
      <div className="text-center mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">Panel de Cocina</h3>
        <p className="text-gray-600">Órdenes en tiempo real</p>
      </div>
      
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-4">
                <span className="font-bold text-gray-900">{order.id}</span>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  Mesa {order.table}
                </span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.statusColor}`}>
                {order.status}
              </span>
            </div>
            <div className="mb-4">
              {order.items.map((item, idx) => (
                <span key={idx} className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm mr-2 mb-2">
                  {item}
                </span>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tiempo: {order.time}</span>
              <span className="font-bold text-primary-500">{formatPrice(order.total)}</span>
            </div>
            <div className="mt-4 flex gap-2">
              {order.status === 'nuevo' && (
                <button className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Aceptar
                </button>
              )}
              {order.status === 'preparando' && (
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Marcar Listo
                </button>
              )}
              {order.status === 'listo' && (
                <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Entregar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderReservationsDemo = () => (
    <div className="p-6">
      <div className="text-center mb-6 pb-4 border-b border-gray-200">
        <h3 className="text-xl font-bold text-gray-900">Gestión de Reservas</h3>
        <p className="text-gray-600">Hoy - 20 de Septiembre</p>
      </div>
      
      <div className="space-y-4 mb-8">
        {reservations.map(reservation => (
          <div key={reservation.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-gray-900 text-lg">{reservation.customerName}</h4>
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    📅 {reservation.date}
                  </span>
                  <span className="flex items-center gap-1">
                    🕐 {reservation.time}
                  </span>
                  <span className="flex items-center gap-1">
                    👥 {reservation.guests} personas
                  </span>
                  <span className="flex items-center gap-1">
                    🪑 {reservation.table}
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${reservation.statusColor}`}>
                {reservation.status}
              </span>
            </div>
            <div className="flex gap-2">
              {reservation.status === 'pendiente' && (
                <>
                  <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Confirmar
                  </button>
                  <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Rechazar
                  </button>
                </>
              )}
              {reservation.status === 'confirmada' && (
                <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Check-in
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-4">Disponibilidad del Día</h4>
        <div className="grid grid-cols-4 gap-2">
          {['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].map(time => (
            <div 
              key={time} 
              className={`p-3 text-center rounded-lg text-sm font-medium ${
                time === '20:00' || time === '21:30' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {time}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDemo = () => {
    switch (activeDemo) {
      case 'menu': return renderMenuDemo();
      case 'cart': return renderCartDemo();
      case 'orders': return renderOrdersDemo();
      case 'reservations': return renderReservationsDemo();
      default: return renderMenuDemo();
    }
  };

  return (
    <section id="demo-section" className="py-16 lg:py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Prueba TappMesa en Vivo
          </h2>
          <p className="text-xl text-gray-600">
            Explora todas las funcionalidades en nuestra demostración interactiva
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Demo Tabs */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
            <div className="flex flex-wrap justify-center gap-2">
              {demoTabs.map(tab => (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 relative ${
                    activeDemo === tab.id 
                      ? 'bg-primary-500 text-white shadow-lg' 
                      : 'bg-white text-gray-600 hover:text-primary-500 hover:bg-primary-50 border border-gray-200'
                  }`}
                  onClick={() => setActiveDemo(tab.id)}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === 'cart' && cartItems.length > 0 && (
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {cartItems.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Demo Content */}
          <div className="min-h-[600px] bg-gradient-to-br from-orange-50 to-red-50">
            {renderDemo()}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-3xl p-8 lg:p-12 shadow-xl border border-gray-200 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Impresionado con lo que viste?
            </h3>
            <p className="text-gray-600 mb-8">
              Configura tu restaurante en menos de 10 minutos
            </p>
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl touch-target">
              Crear Mi Restaurante Gratis
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;