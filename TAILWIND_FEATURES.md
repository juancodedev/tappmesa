# Tailwind CSS - Características Implementadas

Este documento describe las nuevas características de Tailwind CSS implementadas en el proyecto TappMesa.

## Tabla de Contenidos
1. [Dark Mode](#dark-mode)
2. [Sistema de Colores con Variables CSS](#sistema-de-colores-con-variables-css)
3. [Container Responsivo](#container-responsivo)
4. [Animaciones Mejoradas](#animaciones-mejoradas)
5. [Border Radius Dinámico](#border-radius-dinámico)
6. [Variables de Sidebar](#variables-de-sidebar)

---

## Dark Mode

El proyecto ahora soporta dark mode mediante la clase `.dark`:

```jsx
// Ejemplo de uso con React
function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="bg-background text-foreground">
        {/* Contenido */}
      </div>
    </div>
  );
}
```

### Colores que cambian automáticamente:
- `bg-background` / `text-foreground`
- `bg-card` / `text-card-foreground`
- `bg-primary` / `text-primary-foreground`
- `bg-secondary` / `text-secondary-foreground`
- `bg-muted` / `text-muted-foreground`
- `bg-accent` / `text-accent-foreground`

---

## Sistema de Colores con Variables CSS

Los colores principales ahora usan variables CSS (HSL) que pueden ser modificadas dinámicamente:

### Ejemplo de uso en componentes:

```jsx
// Usar colores semánticos
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Botón Principal
</button>

<div className="bg-card text-card-foreground border border-border">
  Card con bordes
</div>

<input className="border-input ring-ring focus:ring-2" />
```

### Modificar colores dinámicamente (por tenant):

```jsx
// En TenantContext o componente de branding
useEffect(() => {
  if (tenant?.primary_color) {
    // Convertir HEX a HSL y actualizar variable CSS
    document.documentElement.style.setProperty('--primary', toHSL(tenant.primary_color));
  }
}, [tenant]);
```

---

## Container Responsivo

Contenedor centrado con padding y breakpoints predefinidos:

```jsx
<div className="container mx-auto">
  {/* Contenido con max-width de 1400px en 2xl y centrado */}
</div>
```

Configuración actual:
- `padding: 2rem` (por defecto)
- `max-width: 1400px` (en breakpoint 2xl)
- Centrado automáticamente

---

## Animaciones Mejoradas

### Animaciones de Radix UI (para componentes de UI):

```jsx
import * as Accordion from '@radix-ui/react-accordion';

<Accordion.Content className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
  Contenido del accordion
</Accordion.Content>
```

### Animaciones de entrada:

```jsx
// Fade in desde abajo
<div className="animate-fade-in">Aparece con fade</div>

// Scale in
<div className="animate-scale-in">Crece desde el centro</div>

// Slide up
<div className="animate-slide-up">Sube desde abajo</div>

// Slide desde los lados
<div className="animate-slide-in-left">Desde la izquierda</div>
<div className="animate-slide-in-right">Desde la derecha</div>
```

### Animaciones de movimiento continuo:

```jsx
// Flotación suave (perfecto para iconos decorativos)
<div className="animate-float">
  ☕
</div>

// Pulso suave (para destacar elementos)
<button className="animate-gentle-pulse">
  Nuevo
</button>
```

### Animaciones especiales de cafetería:

```jsx
// Vapor de café (elemento decorativo)
<div className="animate-steam opacity-50">
  ☁️
</div>

// Efecto de ondas concéntricas
<div className="animate-coffee-ripple">
  Ripple effect
</div>
```

---

## Border Radius Dinámico

Los border radius ahora usan la variable CSS `--radius` (0.75rem por defecto):

```jsx
// Tamaños predefinidos
<div className="rounded-lg">Radio grande</div>
<div className="rounded-md">Radio medio</div>
<div className="rounded-sm">Radio pequeño</div>
```

Para cambiar el radio globalmente:
```css
:root {
  --radius: 1rem; /* Más redondeado */
}
```

---

## Variables de Sidebar

Colores específicos para el dashboard admin con sidebar:

```jsx
// Ejemplo de sidebar
<aside className="bg-sidebar border-r border-sidebar-border">
  <nav>
    <a className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
      Dashboard
    </a>
    <a className="bg-sidebar-primary text-sidebar-primary-foreground">
      Productos (activo)
    </a>
  </nav>
</aside>
```

### Variables disponibles:
- `bg-sidebar` - Fondo del sidebar
- `text-sidebar-foreground` - Texto principal
- `bg-sidebar-primary` - Item activo
- `bg-sidebar-accent` - Hover state
- `border-sidebar-border` - Bordes

---

## Utilidades Personalizadas

El proyecto incluye utilidades CSS personalizadas:

### Efectos hover:

```jsx
// Elevación al hacer hover
<div className="hover-lift">
  Se eleva al pasar el mouse
</div>

// Escala al hacer hover
<button className="hover-scale">
  Crece sutilmente
</button>

// Brillo al hacer hover
<div className="hover-glow">
  Efecto glow
</div>

// Estilo café al hacer hover
<div className="hover-coffee">
  Estilo temático
</div>
```

### Performance:

```jsx
// Aceleración GPU para animaciones suaves
<div className="gpu-accelerated animate-float">
  Animación optimizada
</div>

// Indicar cambios futuros al navegador
<div className="will-change-transform hover-scale">
  Hover optimizado
</div>
```

### Accesibilidad:

```jsx
// Touch targets de 44x44px mínimo (iOS guidelines)
<button className="touch-target">
  Botón táctil accesible
</button>
```

### Loading:

```jsx
// Spinner personalizado
<div className="loading-spinner" />
```

### Formularios mejorados:

```jsx
<input className="form-input-enhanced"
       placeholder="Se eleva al hacer focus" />
```

### Botones CTA con efecto de brillo:

```jsx
<button className="cta-button bg-primary text-primary-foreground px-6 py-3 rounded-lg">
  Comienza Ahora
</button>
```

---

## Ejemplos Completos

### Card con animación y dark mode:

```jsx
<div className="bg-card text-card-foreground border border-border rounded-lg p-6 hover-lift animate-fade-in">
  <h3 className="text-foreground font-bold mb-2">Título</h3>
  <p className="text-muted-foreground">Descripción del contenido</p>
  <button className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90">
    Acción
  </button>
</div>
```

### Hero section con animaciones escalonadas:

```jsx
<section className="container py-20">
  <h1 className="animate-slide-up text-4xl font-bold text-foreground mb-4">
    Bienvenido a TappMesa
  </h1>
  <p className="animate-slide-up animation-delay-200 text-xl text-muted-foreground mb-8">
    Gestiona tu cafetería digitalmente
  </p>
  <button className="animate-slide-up animation-delay-400 cta-button bg-primary text-primary-foreground px-8 py-4 rounded-lg">
    Comenzar
  </button>
</section>
```

### Accordion con Radix UI:

```jsx
import * as Accordion from '@radix-ui/react-accordion';

<Accordion.Root type="single" collapsible>
  <Accordion.Item value="item-1" className="border-b border-border">
    <Accordion.Trigger className="flex justify-between w-full py-4 text-foreground hover:text-primary">
      ¿Cómo funciona?
    </Accordion.Trigger>
    <Accordion.Content className="text-muted-foreground data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
      <div className="pb-4">
        Explicación del funcionamiento...
      </div>
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

---

## Migración de Código Existente

Si tienes componentes que usan colores hardcoded, considera migrar a las variables CSS:

### Antes:
```jsx
<div className="bg-[#8B4513] text-white">
  Contenido
</div>
```

### Después:
```jsx
<div className="bg-primary text-primary-foreground">
  Contenido
</div>
```

**Ventajas:**
- ✅ Soporte para dark mode automático
- ✅ Tematización dinámica por tenant
- ✅ Consistencia de diseño
- ✅ Mejor accesibilidad (contraste calculado)

---

## Notas Importantes

1. **Dark mode no está activo por defecto** - Necesitas agregar la clase `.dark` al elemento raíz cuando el usuario lo active.

2. **Las animaciones CSS son más performantes que JavaScript** - Usa las animaciones de Tailwind siempre que sea posible.

3. **Variables CSS son compatibles con todos los navegadores modernos** - IE11 no está soportado (pero tampoco es relevante en 2025).

4. **Combina utilidades para efectos complejos:**
   ```jsx
   <div className="hover-lift gpu-accelerated animate-fade-in">
     Múltiples efectos combinados
   </div>
   ```

5. **Para animaciones personalizadas por tenant**, puedes sobrescribir las variables CSS en el contexto de tenant.
