/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },

    extend: {
      colors: {
        primary: {
          50: '#FAF0E6',
          100: '#F5E6D3',
          200: '#E8CBB0',
          300: '#DBAF8D',
          400: '#CE946A',
          500: '#C07947',
          600: '#9A6239',
          700: '#734A2B',
          800: '#4D321D',
          900: '#2C1810',
        },

        secondary: {
          50: '#EEF7F8',
          100: '#DCEFF2',
          200: '#B9E0E5',
          300: '#95D0D9',
          400: '#71C1CC',
          500: '#4DB2C0',
          600: '#3E8E99',
          700: '#2E6B73',
          800: '#1F474C',
          900: '#0F2426',
        },

        warm: {
          50: '#FFF8F3',
          100: '#FEEBDD',
          200: '#FFD0B8',
          300: '#FDB68F',
          400: '#FC9B66',
          500: '#FA812E',
          600: '#C46525',
          700: '#8D491C',
          800: '#573012',
          900: '#211707',
        },

        neutral: {
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },

        accent: {
          100: '#F0F7FF',
          200: '#D6EAFF',
          300: '#A8D4FF',
          400: '#7BBEFF',
          500: '#4EA8FF',
          600: '#3E86CC',
          700: '#2F6599',
          800: '#1F4366',
          900: '#102233',
        },
      },

      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },

      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },

        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        slideDown: { "0%": { transform: "translateY(-10px)", opacity: 0 }, "100%": { transform: "translateY(0)", opacity: 1 } },
        slideUp: { "0%": { transform: "translateY(20px)", opacity: 0 }, "100%": { transform: "translateY(0)", opacity: 1 } },
        ripple: {
          "0%": { transform: "scale(0)", opacity: 0.7 },
          "100%": { transform: "scale(1.2)", opacity: 0 },
        },
      },

      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        fadeIn: "fadeIn 0.5s ease-out",
        shimmer: "shimmer 2s infinite linear",
        slideDown: "slideDown 0.4s ease-out",
        slideUp: "slideUp 0.4s ease-out",
        ripple: "ripple 0.6s ease-out",
      },

      boxShadow: {
        warm: "0 10px 20px rgba(192, 121, 71, 0.3)",
        soft: "0 4px 10px rgba(0,0,0,0.1)",
      },

      blur: {
        xs: "2px",
      },

      scale: {
        101: "1.01",
        102: "1.02",
      }
    },
  },

  plugins: [
    plugin(function ({ addUtilities, addVariant, theme }) {
      addUtilities({
        ".scrollbar-none": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
        ".scrollbar-none::-webkit-scrollbar": { display: "none" },
      });

      addVariant("scrollbar", "&::-webkit-scrollbar");
      addVariant("scrollbar-track", "&::-webkit-scrollbar-track");
      addVariant("scrollbar-thumb", "&::-webkit-scrollbar-thumb");

      addUtilities({
        ".input-focus-effect": {
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
        },
        ".input-focus-effect:focus": {
          borderColor: theme("colors.primary.500"),
          boxShadow: `0 0 8px ${theme("colors.primary.300")}`,
        },
      });

      addUtilities({
        ".form-input-enhanced": {
          transition: "all 0.3s ease",
        },
        ".form-input-enhanced:focus": {
          borderColor: theme("colors.primary.400"),
          boxShadow: theme("boxShadow.warm"),
        },
      });
    }),
  ],
};
