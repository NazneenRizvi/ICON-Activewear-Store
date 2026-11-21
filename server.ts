import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import app from './src/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Static or Vite Middleware for local development and preview
async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const indexHtml = path.join(distPath, 'index.html');
  const isPreviewOrStart =
    process.env.npm_lifecycle_event === 'preview' ||
    process.env.npm_lifecycle_event === 'start' ||
    process.env.NODE_ENV === 'production';

  if (isPreviewOrStart && fs.existsSync(indexHtml)) {
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(indexHtml);
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const targetPort = Number(process.env.PORT) || PORT;
  const server = app.listen(targetPort, '0.0.0.0', () => {
    console.log(`Dubai Activewear Full-Stack server running at http://0.0.0.0:${targetPort}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE' && targetPort !== 3000) {
      console.log(`Port ${targetPort} in use, falling back to 3000...`);
      app.listen(3000, '0.0.0.0', () => {
        console.log(`Dubai Activewear Full-Stack server running at http://0.0.0.0:3000`);
      });
    }
  });
}

export default app;

// Start the standalone HTTP server and local Vite middleware only in local/non-serverless environments
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  startServer();
}
