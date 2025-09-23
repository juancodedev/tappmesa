// src/pages/landing/components/DemoSection.jsx
import React, { useState } from 'react';
import Card from '../../../components/ui/Card';

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
        image: '/images/demo/pizza-margherita.jpg',
        category: 'principales'
      },
      {
        id: 2,
        name: 'Hamburguesa Clásica',
        description: 'Carne de res, lechuga, tomate, cebolla, queso cheddar',
        price: 15500,
        image: '/images/demo/hamburguesa.jpg',
        category: 'principales'
      },
      {
        id: 3,
        name: 'Ensalada César',
        description: 'Lechuga romana, crutones, parmesano, aderezo césar',
        price: 12900,
        image: '/images/demo/ensalada-cesar.jpg',
        category: 'principales'
      }
    ],
    bebidas: [
      {
        id: 4,
        name: 'Café Americano',
        description: 'Café espresso con agua caliente',
        price: 3500,
        image: '/images/demo/cafe-americano.jpg',
        category: 'bebidas'
      },
      {
        id: 5,
        name: 'Jugo Natural',
        description: 'Naranja, manzana o piña',
        price: 4200,
        image: '/images/demo/jugo-natural.jpg',
        category: 'bebidas'
      }
    ],
    postres: [
      {
        id: 6,
        name: 'Tiramisu',
        description: 'Postre italiano con café, mascarpone y cacao',
        price: 8500,
        image: '/images/demo/tiramisu.jpg',
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
      total: 22400
    },
    {
      id: 'ORD-002',
      table: 8,
      items: ['Hamburguesa Clásica', 'Jugo Natural'],
      status: 'listo',
      time: '12 min',
      total: 19700
    },
    {
      id: 'ORD-003',
      table: 3,
      items: ['Ensalada César', 'Tiramisu'],
      status: 'nuevo',
      time: '0 min',
      total: 21400
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
      status: 'confirmada'
    },
    {
      id: 'RES-002',
      customerName: 'María García',
      date: '2025-09-20',
      time: '21:30',
      guests: 2,
      table: 'Mesa 6',
      status: 'pendiente'
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'nuevo': return '#ff6b35';
      case 'preparando': return '#ffa500';
      case 'listo': return '#28a745';
      case 'entregado': return '#6c757d';
      default: return '#333';
    }
  };

  const renderMenuDemo = () => (
    <div className="demo-content menu-demo">
      <div className="demo-header">
        <h3>Restaurante Demo</h3>
        <p>Mesa #5 - Bienvenido</p>
      </div>
      
      <div className="menu-categories">
        {menuCategories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            <span>{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      <div className="menu-items">
        {menuItems[selectedCategory]?.map(item => (
          <Card key={item.id} className="menu-item-card">
            <div className="item-image">
              <div className="image-placeholder">🍽️</div>
            </div>
            <div className="item-info">
              <h4>{item.name}</h4>
              <p>{item.description}</p>
              <div className="item-footer">
                <span className="price">{formatPrice(item.price)}</span>
                <button 
                  className="add-btn"
                  onClick={() => addToCart(item)}
                >
                  Agregar +
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderCartDemo = () => (
    <div className="demo-content cart-demo">
      <div className="demo-header">
        <h3>Tu Pedido</h3>
        <p>Mesa #5</p>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <span className="empty-icon">🛒</span>
          <p>Tu carrito está vacío</p>
          <button 
            onClick={() => setActiveDemo('menu')}
            className="btn btn-primary"
          >
            Ver Menú
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cartItems.map(item => (
              <div key={item.id} className="cart-item">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p className="item-price">{formatPrice(item.price)}</p>
                </div>
                <div className="quantity-controls">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <button 
                  className="remove-btn"
                  onClick={() => removeFromCart(item.id)}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
          
          <div className="cart-summary">
            <div className="total">
              <strong>Total: {formatPrice(getCartTotal())}</strong>
            </div>
            <button className="btn btn-primary btn-block">
              Enviar a Cocina
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderOrdersDemo = () => (
    <div className="demo-content orders-demo">
      <div className="demo-header">
        <h3>Panel de Cocina</h3>
        <p>Órdenes en tiempo real</p>
      </div>
      
      <div className="orders-list">
        {orders.map(order => (
          <Card key={order.id} className="order-card">
            <div className="order-header">
              <span className="order-id">{order.id}</span>
              <span className="table-number">Mesa {order.table}</span>
              <span 
                className="order-status"
                style={{ backgroundColor: getStatusColor(order.status) }}
              >
                {order.status}
              </span>
            </div>
            <div className="order-items">
              {order.items.map((item, idx) => (
                <span key={idx} className="order-item">{item}</span>
              ))}
            </div>
            <div className="order-footer">
              <span className="order-time">Tiempo: {order.time}</span>
              <span className="order-total">{formatPrice(order.total)}</span>
            </div>
            <div className="order-actions">
              {order.status === 'nuevo' && (
                <button className="btn btn-primary btn-sm">Aceptar</button>
              )}
              {order.status === 'preparando' && (
                <button className="btn btn-success btn-sm">Marcar Listo</button>
              )}
              {order.status === 'listo' && (
                <button className="btn btn-outline btn-sm">Entregar</button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderReservationsDemo = () => (
    <div className="demo-content reservations-demo">
      <div className="demo-header">
        <h3>Gestión de Reservas</h3>
        <p>Hoy - 20 de Septiembre</p>
      </div>
      
      <div className="reservations-list">
        {reservations.map(reservation => (
          <Card key={reservation.id} className="reservation-card">
            <div className="reservation-info">
              <h4>{reservation.customerName}</h4>
              <div className="reservation-details">
                <span>📅 {reservation.date}</span>
                <span>🕐 {reservation.time}</span>
                <span>👥 {reservation.guests} personas</span>
                <span>🪑 {reservation.table}</span>
              </div>
            </div>
            <div className="reservation-status">
              <span className={`status ${reservation.status}`}>
                {reservation.status}
              </span>
            </div>
            <div className="reservation-actions">
              {reservation.status === 'pendiente' && (
                <>
                  <button className="btn btn-success btn-sm">Confirmar</button>
                  <button className="btn btn-danger btn-sm">Rechazar</button>
                </>
              )}
              {reservation.status === 'confirmada' && (
                <button className="btn btn-outline btn-sm">Check-in</button>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      <div className="reservation-calendar">
        <h4>Disponibilidad del Día</h4>
        <div className="time-slots">
          {['18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'].map(time => (
            <div key={time} className={`time-slot ${time === '20:00' || time === '21:30' ? 'reserved' : 'available'}`}>
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
    <section id="demo-section" className="demo-section">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">Prueba TappMesa en Vivo</h2>
          <p className="section-description">
            Explora todas las funcionalidades en nuestra demostración interactiva
          </p>
        </div>

        <div className="demo-container">
          <div className="demo-tabs">
            {demoTabs.map(tab => (
              <button
                key={tab.id}
                className={`demo-tab ${activeDemo === tab.id ? 'active' : ''}`}
                onClick={() => setActiveDemo(tab.id)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                {tab.id === 'cart' && cartItems.length > 0 && (
                  <span className="cart-badge">{cartItems.length}</span>
                )}
              </button>
            ))}
          </div>

          <div className="demo-window">
            {renderDemo()}
          </div>
        </div>

        <div className="demo-cta">
          <h3>¿Impresionado con lo que viste?</h3>
          <p>Configura tu restaurante en menos de 10 minutos</p>
          <button className="btn btn-primary btn-large">
            Crear Mi Restaurante Gratis
          </button>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;