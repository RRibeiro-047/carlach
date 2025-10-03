import { createServer as createViteServer } from 'vite';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // In production, serve static files from dist directory
    app.use(express.static('dist'));
    
    // Handle SPA fallback - return index.html for all routes
    app.get('*', (req, res) => {
      const indexHtml = join(__dirname, 'dist', 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Not Found');
      }
    });
  } else {
    // In development, use Vite's development server
    const vite = await createViteServer({
      appType: 'spa',
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);
    
    // In development, serve static files from public directory
    app.use(express.static('public'));
  }

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  app.listen(Number(port), host, () => {
    console.log(`Server running at http://${host}:${port}`);
    console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
    if (isProduction) {
      console.log('Serving static files from /dist directory');
    } else {
      console.log('Running in development mode with HMR');
    }
  });
}

startServer().catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
