/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal inspirada en café y ambientes cálidos
        primary: {
          50: '#fdf8f6',
          100: '#f2e8e5', 
          200: '#eaddd7',
          300: '#e0cfc5',
          400: '#d2bab0',
          500: '#b8956a', // Color café principal - cálido y acogedor
          600: '#a67c52',
          700: '#8b6914',
          800: '#723610',
          900: '#5c2e0a',
        },
        // Verde suave para elementos secundarios (plantas, naturaleza)
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Verde suave para éxito/confirmaciones
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // Crema/beige para fondos y elementos neutros
        cream: {
          50: '#fffdf7',
          100: '#fffbeb',
          200: '#fef3c7',
          300: '#fde68a',
          400: '#fcd34d',
          500: '#f59e0b', // Dorado suave para acentos
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Marrón café para textos y elementos serios
        coffee: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e', // Marrón café para textos principales
          700: '#44403c',
          800: '#292524',
          900: '#1c1917', // Marrón muy oscuro para títulos
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'coffee-gradient': 'linear-gradient(135deg, #fdf8f6 0%, #f2e8e5 100%)',
        'warm-gradient': 'linear-gradient(135deg, #fffdf7 0%, #fef3c7 100%)',
        'coffee-dark': 'linear-gradient(135deg, #78716c 0%, #44403c 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'steam': 'steam 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        steam: {
          '0%': { opacity: '0.7', transform: 'translateY(0px) scale(1)' },
          '50%': { opacity: '0.9', transform: 'translateY(-10px) scale(1.05)' },
          '100%': { opacity: '0.7', transform: 'translateY(-20px) scale(1.1)' },
        }
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      }
    },
  },
  plugins: [],
}