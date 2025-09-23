/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Paleta de colores específica para cafeterías
      colors: {
        // Colores principales de café
        primary: {
          50: '#fef7ed',
          100: '#fdecd1',
          200: '#fad5a2',
          300: '#f7b969',
          400: '#f59e42',
          500: '#b8956a', // Color principal café dorado
          600: '#a67c52',
          700: '#8b6340',
          800: '#725139',
          900: '#5e4232',
        },
        
        // Tonos de café naturales
        coffee: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e', // Café medio
          700: '#44403c',
          800: '#292524',
          900: '#1c1917', // Café muy oscuro
        },
        
        // Tonos crema y beige
        cream: {
          50: '#fffdf7',
          100: '#fffaed',
          200: '#fef3c7', // Crema principal
          300: '#fde68a',
          400: '#fcd34d',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      },

      // Animaciones personalizadas
      animation: {
        // Animaciones de flotación
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float-delay 6s ease-in-out infinite 2s',
        
        // Animaciones de vapor de café
        'steam': 'steam 3s ease-out infinite',
        'steam-delay': 'steam 3s ease-out infinite 1s',
        
        // Efectos de café
        'coffee-ripple': 'coffee-ripple 2s ease-out infinite',
        'gentle-pulse': 'gentle-pulse 3s ease-in-out infinite',
        
        // Animaciones de entrada
        'slide-up': 'slide-up 0.8s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.8s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.8s ease-out forwards',
        'zoom-in': 'zoom-in 0.6s ease-out forwards',
        
        // Efectos especiales
        'gentle-rotate': 'gentle-rotate 20s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'gentle-shake': 'gentle-shake 0.5s ease-in-out',
        
        // Efectos de loading
        'wave': 'wave 1.5s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        
        // Contadores y estadísticas
        'count-up': 'count-up 0.8s ease-out forwards',
        'stat-bar': 'stat-bar 1.5s ease-out forwards',
        
        // Notificaciones
        'notification-slide': 'notification-slide 4s ease-in-out',
        'testimonial-slide': 'testimonial-slide 0.8s ease-out forwards',
      },

      // Keyframes para las animaciones
      keyframes: {
        // Flotación para elementos decorativos
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-10px) rotate(2deg)' },
          '50%': { transform: 'translateY(-20px) rotate(0deg)' },
          '75%': { transform: 'translateY(-10px) rotate(-2deg)' },
        },
        'float-delay': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '25%': { transform: 'translateY(-15px) rotate(-2deg)' },
          '50%': { transform: 'translateY(-25px) rotate(0deg)' },
          '75%': { transform: 'translateY(-15px) rotate(2deg)' },
        },
        
        // Vapor de café
        steam: {
          '0%': { transform: 'translateY(0px) translateX(0px) scaleX(1)', opacity: '0.8' },
          '25%': { transform: 'translateY(-10px) translateX(2px) scaleX(1.1)', opacity: '0.6' },
          '50%': { transform: 'translateY(-20px) translateX(-2px) scaleX(0.9)', opacity: '0.4' },
          '75%': { transform: 'translateY(-30px) translateX(1px) scaleX(1.05)', opacity: '0.2' },
          '100%': { transform: 'translateY(-40px) translateX(0px) scaleX(1)', opacity: '0' },
        },
        
        // Ondas de café
        'coffee-ripple': {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        
        // Pulso suave
        'gentle-pulse': {
          '0%, 100%': { 
            transform: 'scale(1)', 
            boxShadow: '0 0 0 0 rgba(184, 149, 106, 0.4)' 
          },
          '50%': { 
            transform: 'scale(1.02)', 
            boxShadow: '0 0 0 10px rgba(184, 149, 106, 0)' 
          },
        },
        
        // Animaciones de entrada
        'slide-up': {
          'from': { opacity: '0', transform: 'translateY(30px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          'from': { opacity: '0', transform: 'translateX(-30px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          'from': { opacity: '0', transform: 'translateX(30px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        'zoom-in': {
          'from': { opacity: '0', transform: 'scale(0.8)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        
        // Efectos especiales
        'gentle-rotate': {
          'from': { transform: 'rotate(0deg)' },
          'to': { transform: 'rotate(360deg)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(184, 149, 106, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(184, 149, 106, 0.8), 0 0 30px rgba(184, 149, 106, 0.6)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.05)' },
          '50%': { transform: 'scale(1.1)' },
          '75%': { transform: 'scale(1.05)' },
        },
        'gentle-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
        
        // Loading y efectos de onda
        wave: {
          '0%, 60%, 100%': { transform: 'initial' },
          '30%': { transform: 'translateY(-15px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        
        // Contadores
        'count-up': {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'stat-bar': {
          'from': { width: '0%' },
          'to': { width: 'var(--target-width)' },
        },
        
        // Notificaciones y testimonios
        'notification-slide': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '10%, 90%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'testimonial-slide': {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },

      // Gradientes personalizados
      backgroundImage: {
        'coffee-gradient': 'linear-gradient(135deg, #fef3c7 0%, #b8956a 100%)',
        'warm-gradient': 'linear-gradient(135deg, #fef3c7 0%, #fdecd1 50%, #fef3c7 100%)',
        'coffee-dark': 'linear-gradient(135deg, #1c1917 0%, #57534e 50%, #1c1917 100%)',
        'animated-gradient': 'linear-gradient(-45deg, #b8956a, #57534e, #b8956a, #fef3c7)',
      },

      // Tamaños de gradiente para animaciones
      backgroundSize: {
        '400': '400% 400%',
      },

      // Sombras personalizadas
      boxShadow: {
        'coffee': '0 4px 6px -1px rgba(184, 149, 106, 0.1), 0 2px 4px -1px rgba(184, 149, 106, 0.06)',
        'coffee-lg': '0 10px 15px -3px rgba(184, 149, 106, 0.1), 0 4px 6px -2px rgba(184, 149, 106, 0.05)',
        'coffee-xl': '0 20px 25px -5px rgba(184, 149, 106, 0.1), 0 10px 10px -5px rgba(184, 149, 106, 0.04)',
        'coffee-2xl': '0 25px 50px -12px rgba(184, 149, 106, 0.25)',
        'glow-coffee': '0 0 20px rgba(184, 149, 106, 0.4)',
        'glow-coffee-lg': '0 0 30px rgba(184, 149, 106, 0.6)',
      },

      // Spacing adicional
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '128': '32rem',
      },

      // Typography personalizada
      fontFamily: {
        'coffee': ['Inter', 'system-ui', 'sans-serif'],
      },

      // Delays para animaciones escalonadas
      animationDelay: {
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
        '400': '400ms',
        '500': '500ms',
        '1000': '1000ms',
        '2000': '2000ms',
      },

      // Duraciones personalizadas
      animationDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
        '4000': '4000ms',
        '5000': '5000ms',
        '6000': '6000ms',
      },

      // Z-index personalizado
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    // Plugin para agregar utilidades adicionales
    function({ addUtilities, theme }) {
      const newUtilities = {
        // Clases para elementos interactivos
        '.hover-lift': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: theme('boxShadow.coffee-xl'),
          },
        },
        '.hover-scale': {
          transition: 'transform 0.3s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
        '.hover-glow': {
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: theme('boxShadow.glow-coffee'),
            transform: 'translateY(-2px)',
          },
        },
        '.hover-coffee': {
          transition: 'all 0.3s ease',
          '&:hover': {
            backgroundColor: 'rgba(184, 149, 106, 0.1)',
            borderColor: 'rgba(184, 149, 106, 0.5)',
          },
        },

        // Utilidades de performance
        '.gpu-accelerated': {
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: '1000px',
        },
        '.will-change-transform': {
          willChange: 'transform',
        },
        '.will-change-opacity': {
          willChange: 'opacity',
        },

        // Utilidades de animación
        '.animate-on-scroll': {
          opacity: '0',
          transform: 'translateY(30px)',
          transition: 'all 0.8s ease-out',
        },
        '.animate-on-scroll.visible': {
          opacity: '1',
          transform: 'translateY(0)',
        },

        // Efectos de partículas
        '.coffee-particle': {
          position: 'absolute',
          width: '4px',
          height: '4px',
          background: theme('colors.primary.500'),
          borderRadius: '50%',
          pointerEvents: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: '100%',
            height: '100%',
            background: 'inherit',
            borderRadius: 'inherit',
            animation: 'coffee-ripple 2s ease-out infinite',
          },
        },

        // Loading spinner personalizado
        '.loading-spinner': {
          border: '2px solid transparent',
          borderTop: '2px solid currentColor',
          borderRadius: '50%',
          width: '16px',
          height: '16px',
          animation: 'spin 1s linear infinite',
        },

        // Elementos de formulario mejorados
        '.form-input-enhanced': {
          transition: 'all 0.3s ease',
          '&:focus': {
            transform: 'translateY(-2px)',
            boxShadow: theme('boxShadow.coffee-lg'),
          },
        },

        // CTA button con efecto de brillo
        '.cta-button': {
          position: 'relative',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '0',
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            transition: 'left 0.5s ease',
          },
          '&:hover::before': {
            left: '100%',
          },
        },
      };

      addUtilities(newUtilities);
    },
  ],
}