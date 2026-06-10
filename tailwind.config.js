/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

export default {
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
    extend: {},
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
