import { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export default function vitePluginSpaFallback(): Plugin {
  return {
    name: 'vite-plugin-spa-fallback',
    configureServer(server) {
      // Middleware para lidar com o roteamento SPA
      return () => {
        server.middlewares.use((req, res, next) => {
          // Verifica se a requisição é para um arquivo que não existe
          const filePath = path.join(server.config.root, req.url || '');
          
          // Se o arquivo não existir e não for uma rota de API, servimos o index.html
          if (!fs.existsSync(filePath) && !req.url?.startsWith('/api')) {
            req.url = '/';
          }
          
          next();
        });
      };
    },
    // Configuração para o build de produção
    config() {
      return {
        build: {
          rollupOptions: {
            input: {
              main: path.resolve(__dirname, 'index.html')
            }
          }
        },
        // Habilita o modo SPA
        appType: 'spa',
        // Configuração para garantir que as rotas funcionem corretamente no build de produção
        base: '/',
        // Configuração para garantir que os módulos sejam carregados corretamente
        optimizeDeps: {
          include: ['react', 'react-dom', 'react-router-dom']
        }
      };
    }
  };
}
