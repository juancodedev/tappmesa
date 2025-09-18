import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Permite conexiones externas
    port: 5173,
    // Permitir hosts personalizados para subdominios
    allowedHosts: [
      "tappmesa.local",
      "cafe-central.tappmesa.local",
      "admin.tappmesa.local",
      ".tappmesa.local", // Wildcard para cualquier subdominio
    ],
    // Configuración para subdominios locales
    hmr: {
      host: "localhost",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: ["tappmesa.local", ".tappmesa.local"],
  },
});
