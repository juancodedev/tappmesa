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
          DEFAULT: '#8b5e3c',
          50: '#f7f3f0',
          100: '#eee0d5',
          200: '#d6bda9',
          300: '#bf957a',
          400: '#a97253',
          500: '#8b5e3c',
          600: '#6f4a30',
          700: '#543724',
          800: '#3a2619',
          900: '#20150d',
        },

        // Alias for primary to support semantic 'coffee' classes
        coffee: {
          DEFAULT: '#8b5e3c',
          50: '#f7f3f0',
          100: '#eee0d5',
          200: '#d6bda9',
          300: '#bf957a',
          400: '#a97253',
          500: '#8b5e3c',
          600: '#6f4a30',
          700: '#543724',
          800: '#3a2619',
          900: '#20150d',
        },

        secondary: {
          50: '#f4f6f3',
          100: '#e2e8df',
          200: '#c5d1c0',
          300: '#a4b79e',
          400: '#869d7f',
          500: '#6b8263',
          600: '#54664e',
          700: '#42503d',
          800: '#2f392b',
          900: '#1b2119',
        },

        warm: {
          50: '#fef9ed',
          100: '#fdefcd',
          200: '#fbdc9b',
          300: '#f8c564',
          400: '#f4ab34',
          500: '#e98b11',
          600: '#c46d0a',
          700: '#934e0a',
          800: '#62340b',
          900: '#311a05',
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
          100: '#fdf3f0',
          200: '#fbe4db',
          300: '#f6c4b2',
          400: '#f09a83',
          500: '#e66a50',
          600: '#c45240',
          700: '#943d30',
          800: '#632920',
          900: '#321410',
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
