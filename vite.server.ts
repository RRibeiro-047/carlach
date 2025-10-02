import { createServer } from 'vite';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function startServer() {
  const app = express();
  
  // Criar servidor Vite em modo middleware
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Usar o middleware do Vite
  app.use(vite.middlewares);

  // Servir arquivos estáticos da pasta dist
  app.use(express.static(resolve(__dirname, 'dist')));

  // Roteamento SPA - todas as rotas não encontradas vão para o index.html
  app.get('*', (req, res) => {
    res.sendFile(resolve(__dirname, 'dist', 'index.html'));
  });

  // Iniciar o servidor
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});
