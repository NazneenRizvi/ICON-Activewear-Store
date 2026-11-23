import type { IncomingMessage, ServerResponse } from 'http';

import app from '../src/app';
export default function handler(req: IncomingMessage, res: ServerResponse) {
  // Catch-all URL preservation:
  // If Vercel router rewrote req.url (e.g. to '/api/index.ts' or '/api'),
  // restore the exact original path requested by the client so Express matches its registered routes.
  const original = (req as any).originalUrl || req.headers['x-matched-path'];
  if (typeof original === 'string' && original.startsWith('/api')) {
    req.url = original;
  }
  return app(req as any, res as any);
}
