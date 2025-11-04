/**
 * Ejemplos Prácticos - Nuevas Características de Tailwind CSS
 *
 * Este archivo contiene ejemplos funcionales de cómo usar las nuevas
 * características implementadas en Tailwind CSS para TappMesa.
 */

import { useState } from 'react';

// ============================================================================
// EJEMPLO 1: Dark Mode Toggle
// ============================================================================

export function DarkModeExample() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Dark Mode Demo</h1>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card con colores semánticos */}
            <div className="bg-card text-card-foreground border border-border rounded-lg p-6">
              <h3 className="font-bold mb-2">Card</h3>
              <p className="text-muted-foreground">Cambia automáticamente con el tema</p>
            </div>

            <div className="bg-muted text-muted-foreground rounded-lg p-6">
              <h3 className="font-bold mb-2">Muted</h3>
              <p>Para contenido secundario</p>
            </div>

            <div className="bg-accent text-accent-foreground rounded-lg p-6">
              <h3 className="font-bold mb-2">Accent</h3>
              <p>Para destacar elementos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO 2: Animaciones de Entrada
// ============================================================================

export function AnimationsExample() {
  const [show, setShow] = useState(false);

  return (
    <div className="container py-8">
      <button
        onClick={() => setShow(!show)}
        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg mb-8"
      >
        {show ? 'Ocultar' : 'Mostrar'} Animaciones
      </button>

      {show && (
        <div className="space-y-6">
          {/* Fade in */}
          <div className="bg-card p-6 rounded-lg animate-fade-in">
            <h3 className="font-bold mb-2">Fade In</h3>
            <p className="text-muted-foreground">Aparece con fade desde abajo</p>
          </div>

          {/* Scale in */}
          <div className="bg-card p-6 rounded-lg animate-scale-in">
            <h3 className="font-bold mb-2">Scale In</h3>
            <p className="text-muted-foreground">Crece desde el centro</p>
          </div>

          {/* Slide from left */}
          <div className="bg-card p-6 rounded-lg animate-slide-in-left">
            <h3 className="font-bold mb-2">Slide Left</h3>
            <p className="text-muted-foreground">Desliza desde la izquierda</p>
          </div>

          {/* Slide from right */}
          <div className="bg-card p-6 rounded-lg animate-slide-in-right">
            <h3 className="font-bold mb-2">Slide Right</h3>
            <p className="text-muted-foreground">Desliza desde la derecha</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EJEMPLO 3: Animaciones Continuas (Temática Cafetería)
// ============================================================================

export function CoffeeAnimationsExample() {
  return (
    <div className="container py-8">
      <h2 className="text-2xl font-bold mb-8">Animaciones de Cafetería</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Float */}
        <div className="bg-card p-6 rounded-lg text-center">
          <div className="text-6xl mb-4 animate-float">☕</div>
          <h3 className="font-bold mb-2">Float</h3>
          <p className="text-sm text-muted-foreground">Flotación suave</p>
        </div>

        {/* Gentle Pulse */}
        <div className="bg-card p-6 rounded-lg text-center">
          <div className="text-6xl mb-4 animate-gentle-pulse">🧋</div>
          <h3 className="font-bold mb-2">Gentle Pulse</h3>
          <p className="text-sm text-muted-foreground">Pulso suave</p>
        </div>

        {/* Steam */}
        <div className="bg-card p-6 rounded-lg text-center relative overflow-hidden">
          <div className="text-6xl mb-4">☕</div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-2xl opacity-50 animate-steam">
            ☁️
          </div>
          <h3 className="font-bold mb-2">Steam</h3>
          <p className="text-sm text-muted-foreground">Vapor de café</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO 4: Utilidades Hover
// ============================================================================

export function HoverUtilitiesExample() {
  return (
    <div className="container py-8">
      <h2 className="text-2xl font-bold mb-8">Efectos Hover</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hover Lift */}
        <div className="bg-card border border-border rounded-lg p-6 hover-lift cursor-pointer">
          <h3 className="font-bold mb-2">Hover Lift</h3>
          <p className="text-muted-foreground">Se eleva al pasar el mouse</p>
        </div>

        {/* Hover Scale */}
        <div className="bg-card border border-border rounded-lg p-6 hover-scale cursor-pointer">
          <h3 className="font-bold mb-2">Hover Scale</h3>
          <p className="text-muted-foreground">Crece sutilmente</p>
        </div>

        {/* Hover Glow */}
        <div className="bg-card border border-border rounded-lg p-6 hover-glow cursor-pointer">
          <h3 className="font-bold mb-2">Hover Glow</h3>
          <p className="text-muted-foreground">Efecto de brillo</p>
        </div>

        {/* Hover Coffee */}
        <div className="bg-card border border-border rounded-lg p-6 hover-coffee cursor-pointer">
          <h3 className="font-bold mb-2">Hover Coffee</h3>
          <p className="text-muted-foreground">Estilo temático de cafetería</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO 5: Formularios Mejorados
// ============================================================================

export function FormExample() {
  return (
    <div className="container max-w-md py-8">
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-2xl font-bold mb-6">Formulario de Contacto</h2>

        <form className="space-y-4">
          {/* Input con efecto enhanced */}
          <div>
            <label className="block text-sm font-medium mb-2">Nombre</label>
            <input
              type="text"
              placeholder="Tu nombre"
              className="form-input-enhanced w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              placeholder="tu@email.com"
              className="form-input-enhanced w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Mensaje</label>
            <textarea
              rows={4}
              placeholder="Tu mensaje..."
              className="form-input-enhanced w-full px-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* CTA Button con efecto brillo */}
          <button
            type="submit"
            className="cta-button w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium touch-target"
          >
            Enviar Mensaje
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO 6: Sidebar Admin Dashboard
// ============================================================================

export function SidebarExample() {
  const [activeItem, setActiveItem] = useState('dashboard');

  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
    { id: 'products', icon: '☕', label: 'Productos' },
    { id: 'orders', icon: '🛒', label: 'Pedidos' },
    { id: 'customers', icon: '👥', label: 'Clientes' },
    { id: 'analytics', icon: '📈', label: 'Analíticas' },
    { id: 'settings', icon: '⚙️', label: 'Configuración' },
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border">
        <div className="p-6">
          <h1 className="text-xl font-bold text-sidebar-foreground mb-8">
            TappMesa Admin
          </h1>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors touch-target
                  ${
                    activeItem === item.id
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }
                `}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background p-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          {menuItems.find(item => item.id === activeItem)?.label}
        </h2>
        <p className="text-muted-foreground">
          Contenido de {menuItems.find(item => item.id === activeItem)?.label.toLowerCase()}
        </p>
      </main>
    </div>
  );
}

// ============================================================================
// EJEMPLO 7: Loading States
// ============================================================================

export function LoadingExample() {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="container py-8">
      <h2 className="text-2xl font-bold mb-8">Estados de Carga</h2>

      <div className="space-y-6">
        {/* Loading spinner */}
        <div className="bg-card p-6 rounded-lg">
          <h3 className="font-bold mb-4">Loading Spinner</h3>
          <div className="flex items-center gap-4">
            <div className="loading-spinner" />
            <span className="text-muted-foreground">Cargando...</span>
          </div>
        </div>

        {/* Button con loading */}
        <div className="bg-card p-6 rounded-lg">
          <h3 className="font-bold mb-4">Botón con Loading</h3>
          <button
            onClick={handleClick}
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            {loading && <div className="loading-spinner" />}
            {loading ? 'Procesando...' : 'Hacer Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO 8: Card de Producto (Uso Real)
// ============================================================================

export function ProductCardExample() {
  const product = {
    name: 'Café Latte',
    description: 'Espresso con leche vaporizada y espuma',
    price: 3500,
    image: '☕',
    category: 'Cafés',
  };

  return (
    <div className="container max-w-sm py-8">
      <div className="bg-card border border-border rounded-lg overflow-hidden hover-lift animate-fade-in">
        {/* Image */}
        <div className="bg-muted h-48 flex items-center justify-center text-6xl">
          <div className="animate-float">{product.image}</div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
            <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm">
              {product.category}
            </span>
          </div>

          <p className="text-muted-foreground mb-4">{product.description}</p>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              ${product.price.toLocaleString('es-CL')}
            </span>

            <button className="cta-button bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 touch-target">
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EJEMPLO 9: Hero Section Landing
// ============================================================================

export function HeroSectionExample() {
  return (
    <section className="min-h-screen bg-background flex items-center">
      <div className="container">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 animate-slide-up">
            Gestiona tu Cafetería
            <span className="block text-primary mt-2">Digitalmente</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 animate-fade-in">
            Sistema completo para menús digitales, pedidos en línea y gestión de mesas
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-scale-in">
            <button className="cta-button bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-medium touch-target">
              Comenzar Gratis
            </button>
            <button className="bg-secondary text-secondary-foreground px-8 py-4 rounded-lg text-lg font-medium hover:bg-secondary/90 touch-target">
              Ver Demo
            </button>
          </div>

          {/* Elementos decorativos flotantes */}
          <div className="mt-16 flex justify-center gap-8 text-4xl">
            <div className="animate-float">☕</div>
            <div className="animate-gentle-pulse">🧋</div>
            <div className="animate-float" style={{ animationDelay: '1s' }}>🍰</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// EJEMPLO 10: Toast/Notification
// ============================================================================

export function ToastExample() {
  const [show, setShow] = useState(false);

  return (
    <div className="container py-8">
      <button
        onClick={() => setShow(true)}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-lg"
      >
        Mostrar Notificación
      </button>

      {show && (
        <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg p-4 shadow-lg max-w-sm animate-slide-in-right">
          <div className="flex items-start gap-3">
            <div className="text-2xl animate-gentle-pulse">✅</div>
            <div className="flex-1">
              <h4 className="font-bold text-foreground mb-1">Pedido Confirmado</h4>
              <p className="text-sm text-muted-foreground">
                Tu pedido ha sido recibido y está siendo preparado
              </p>
            </div>
            <button
              onClick={() => setShow(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL DE DEMO
// ============================================================================

export default function TailwindFeaturesDemo() {
  const [currentExample, setCurrentExample] = useState('dark-mode');

  const examples = {
    'dark-mode': { component: DarkModeExample, title: 'Dark Mode' },
    'animations': { component: AnimationsExample, title: 'Animaciones de Entrada' },
    'coffee-animations': { component: CoffeeAnimationsExample, title: 'Animaciones Cafetería' },
    'hover': { component: HoverUtilitiesExample, title: 'Efectos Hover' },
    'forms': { component: FormExample, title: 'Formularios' },
    'sidebar': { component: SidebarExample, title: 'Sidebar Admin' },
    'loading': { component: LoadingExample, title: 'Loading States' },
    'product-card': { component: ProductCardExample, title: 'Card de Producto' },
    'hero': { component: HeroSectionExample, title: 'Hero Section' },
    'toast': { component: ToastExample, title: 'Notificaciones' },
  };

  const CurrentComponent = examples[currentExample].component;

  return (
    <div className="min-h-screen bg-background">
      {/* Selector de ejemplos */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container py-4">
          <h1 className="text-2xl font-bold mb-4">Tailwind Features - Ejemplos</h1>
          <div className="flex flex-wrap gap-2">
            {Object.entries(examples).map(([key, { title }]) => (
              <button
                key={key}
                onClick={() => setCurrentExample(key)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    currentExample === key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                {title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <CurrentComponent />
    </div>
  );
}
