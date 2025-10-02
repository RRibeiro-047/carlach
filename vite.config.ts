import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '::',
    port: 8080,
    strictPort: true,
    open: '/',
    fs: {
      strict: false
    },
    hmr: {
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    }
  },
  base: '/',
  define: {
    'process.env.NODE_ENV': '"development"',
    'process.env.BASE_URL': JSON.stringify('/')
  },
  preview: {
    port: 8080,
    strictPort: true,
    open: '/',
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      }
    }
  },
  appType: 'spa',
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
    esbuildOptions: {
      target: 'es2020',
      supported: {
        'top-level-await': true
      }
    }
  },
  ssr: {
    noExternal: ['@radix-ui/*']
  },
  worker: {
    format: 'es'
  }
});
