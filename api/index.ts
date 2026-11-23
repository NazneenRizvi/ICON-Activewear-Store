
import type { IncomingMessage, ServerResponse } from 'http';
import app from './app.js';

export default function handler(req: IncomingMessage, res: ServerResponse) {
  // Preserve the original API request path for Express routing.
  const original = (req as any).originalUrl || req.headers['x-matched-path'];

  if (typeof original === 'string' && original.startsWith('/api')) {
    req.url = original;
  }

  return app(req as any, res as any);
}
