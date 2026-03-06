import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, "client", "index.html"),
        admin: path.resolve(import.meta.dirname, "client", "index-admin.html"),
      },
      output: {
        manualChunks(id) {
          // React core
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
            return "vendor-react";
          }
          // tRPC + React Query
          if (id.includes("node_modules/@trpc/") || id.includes("node_modules/@tanstack/react-query")) {
            return "vendor-trpc";
          }
          // Radix UI
          if (id.includes("node_modules/@radix-ui/")) {
            return "vendor-radix";
          }
          // Charts (recharts + d3) - heavy, admin-only
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          // Framer Motion - heavy animation
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-motion";
          }
          // Streamdown markdown renderer
          if (id.includes("node_modules/streamdown")) {
            return "vendor-streamdown";
          }
          // Date utilities
          if (id.includes("node_modules/date-fns")) {
            return "vendor-date";
          }
          // Form utilities
          if (id.includes("node_modules/react-hook-form") || id.includes("node_modules/zod")) {
            return "vendor-forms";
          }
          // Lucide icons
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          // DnD kit
          if (id.includes("node_modules/@dnd-kit/")) {
            return "vendor-dnd";
          }
          // Misc UI libs
          if (
            id.includes("node_modules/embla-carousel") ||
            id.includes("node_modules/vaul") ||
            id.includes("node_modules/cmdk") ||
            id.includes("node_modules/sonner") ||
            id.includes("node_modules/next-themes")
          ) {
            return "vendor-ui-misc";
          }
          // Wouter router
          if (id.includes("node_modules/wouter")) {
            return "vendor-router";
          }
        },
      },
    },
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    hmr: {
      protocol: 'wss',
      host: process.env.VITE_HMR_HOST || undefined,
      clientPort: 443,
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
