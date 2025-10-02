import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import vitePluginSpaFallback from "./vite-spa-fallback";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    // Habilita o suporte a SPA (Single Page Application)
    fs: {
      strict: false
    },
    hmr: {
      overlay: false
    },
    // Configurações adicionais para o servidor de desenvolvimento
    open: true,
    cors: true
  },
  plugins: [
    react(),
    vitePluginSpaFallback()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Configuração para garantir que as rotas funcionem corretamente no build de produção
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  },
  // Configuração base para URLs
  base: '/',
  // Define variáveis de ambiente
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  // Configuração para o servidor de visualização
  preview: {
    port: 8080,
    strictPort: true,
    // Habilita o fallback SPA no servidor de visualização
    open: true
  },
  // Habilita o modo SPA
  appType: 'spa',
});
