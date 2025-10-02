import type { Plugin } from 'vite';
import { readFileSync } from 'fs';
import { resolve } from 'path';

interface VitePluginSpaFallbackOptions {
  // Lista de extensões de arquivo que devem ser tratadas como arquivos estáticos
  staticExtensions?: string[];
  // Caminho para o arquivo HTML de entrada (padrão: 'index.html')
  indexPath?: string;
}

export default function vitePluginSpaFallback(options: VitePluginSpaFallbackOptions = {}): Plugin {
  const {
    staticExtensions = ['.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'],
    indexPath = 'index.html'
  } = options;

  return {
    name: 'vite-plugin-spa-fallback',
    
    configureServer(server) {
      // Middleware para lidar com o fallback SPA
      const handleSpaFallback = (req: any, res: any, next: any) => {
        const url = req.url || '';
        
        // Verifica se a URL não é uma rota de API e não corresponde a um arquivo estático
        const isStaticFile = staticExtensions.some(ext => url.includes(ext));
        const isApiRoute = url.startsWith('/api') || url.includes('.');
        
        if (!isStaticFile && !isApiRoute && !url.includes('vite/')) {
          try {
            // Tenta ler o arquivo index.html
            const html = readFileSync(resolve(process.cwd(), indexPath), 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            res.end(html);
            return;
          } catch (error) {
            console.error('Error serving SPA fallback:', error);
          }
        }
        
        next();
      };
      
      // Adiciona o middleware ao servidor Vite
      return () => {
        server.middlewares.use(handleSpaFallback);
      };
    },
    
    // Configuração para o build de produção
    config(_, { command }) {
      if (command === 'build') {
        return {
          build: {
            rollupOptions: {
              input: {
                main: resolve(process.cwd(), indexPath)
              },
              output: {
                entryFileNames: 'assets/[name]-[hash].js',
                chunkFileNames: 'assets/[name]-[hash].js',
                assetFileNames: 'assets/[name]-[hash][extname]'
              }
            }
          }
        };
      }
    }
  };
}
