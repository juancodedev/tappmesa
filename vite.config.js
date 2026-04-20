/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),
    tailwindcss(),
  ],
  define: {
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
  },
  build: {
    rollupOptions: {
      output: {
        // Use a function for dynamic chunk splitting
        manualChunks(id) {
          // Vendor libraries - Split by categories
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Router
            if (id.includes('react-router')) {
              return 'router-vendor';
            }
            // Supabase and database
            if (id.includes('@supabase') || id.includes('@prisma')) {
              return 'supabase-vendor';
            }
            // UI libraries
            if (id.includes('lucide-react') || id.includes('clsx')) {
              return 'ui-vendor';
            }
            // Analytics
            if (id.includes('@vercel/analytics')) {
              return 'analytics-vendor';
            }
            // Other large vendor libraries
            return 'vendor';
          }
          
          // Feature-based splitting for our code
          // Admin features
          if (id.includes('/admin/') || id.includes('AdminApp') || id.includes('SecureAdminApp')) {
            return 'admin';
          }
          
          // Auth features
          if (id.includes('/auth/') || id.includes('Auth/') || id.includes('LoginPage') || id.includes('RegisterPage')) {
            return 'auth';
          }
          
          // Landing and marketing pages
          if (id.includes('/landing/') || id.includes('Landing/') || id.includes('LandingPage')) {
            return 'landing';
          }
          
          // Table and tenant specific features
          if (id.includes('TableApp') || id.includes('MenuLayout') || id.includes('/layout/')) {
            return 'tenant';
          }
          
          // Cart and ecommerce features
          if (id.includes('/cart/') || id.includes('Cart') || id.includes('CartContext')) {
            return 'cart';
          }
          
          // Context providers and hooks (shared)
          if (id.includes('/context/') || id.includes('/hooks/')) {
            return 'shared';
          }
        },
        // Optional: Control chunk size and naming
        chunkFileNames: () => `assets/[name]-[hash].js`
      }
    },
    // Increase chunk size warning limit slightly since we're splitting appropriately
    chunkSizeWarningLimit: 600
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
  server: {
    host: "0.0.0.0", // Permite conexiones externas
    port: 5173,
    // Permitir hosts personalizados para subdominios
    allowedHosts: [
      "tappmesa.local",
      "cafe-central.tappmesa.local",
      "admin.tappmesa.local",
      ".tappmesa.local", // Wildcard para cualquier subdominio
      ".localhost", // Wildcard para subdominios .localhost
      "cafe-central.localhost",
      "admin.localhost",
    ],
    // Configuración para subdominios locales
    hmr: {
      host: "localhost",
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: ["tappmesa.local", ".tappmesa.local", ".localhost"],
  },
});
