import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Load .env variables into Node process in local development
try {
  process.loadEnvFile('.env');
} catch (e) {
  // .env might not exist or already loaded
}

// Vite plugin to execute Vercel serverless functions in /api locally
function vercelApiPlugin(): Plugin {
  return {
    name: 'vercel-api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // Ignore proxies handled separately
        if (!url.startsWith('/api/') || url.startsWith('/api/upcitemdb') || url.startsWith('/api/openfoodfacts')) {
          return next();
        }

        const parsedUrl = new URL(url, 'http://localhost');
        const query = Object.fromEntries(parsedUrl.searchParams.entries());

        // Buffer JSON body for POST/PUT requests
        let body: Record<string, unknown> = {};
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          const buffers: Buffer[] = [];
          for await (const chunk of req) {
            buffers.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const raw = Buffer.concat(buffers).toString('utf-8');
          if (raw) {
            try {
              body = JSON.parse(raw);
            } catch {
              body = {};
            }
          }
        }

        // Augment req/res to match Vercel Serverless environment
        (req as any).body = body;
        (req as any).query = query;

        (res as any).status = function (code: number) {
          res.statusCode = code;
          return res;
        };

        (res as any).json = function (data: unknown) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return res;
        };

        try {
          const pathname = parsedUrl.pathname;

          if (pathname === '/api/auth/login') {
            const mod = await import('./api/auth/login.js');
            return mod.default(req as any, res as any);
          }
          if (pathname === '/api/auth/register') {
            const mod = await import('./api/auth/register.js');
            return mod.default(req as any, res as any);
          }
          if (pathname === '/api/auth/google') {
            const mod = await import('./api/auth/google.js');
            return mod.default(req as any, res as any);
          }
          if (pathname === '/api/items') {
            const mod = await import('./api/items/index.js');
            return mod.default(req as any, res as any);
          }
          const itemMatch = pathname.match(/^\/api\/items\/([^/]+)$/);
          if (itemMatch) {
            (req as any).query.id = itemMatch[1];
            const mod = await import('./api/items/[id].js');
            return mod.default(req as any, res as any);
          }
          if (pathname === '/api/health') {
            const mod = await import('./api/health.js');
            return mod.default(req as any, res as any);
          }
          if (pathname === '/api/whatsapp/send') {
            const mod = await import('./api/whatsapp/send.js');
            return mod.default(req as any, res as any);
          }

          next();
        } catch (err: any) {
          console.error('[API Dev Error]:', err);
          (res as any).status(500).json({ error: 'Dev API error', details: err?.message || String(err) });
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercelApiPlugin()],
  server: {
    proxy: {
      // Proxy UPCitemdb API to avoid CORS issues
      '/api/upcitemdb': {
        target: 'https://api.upcitemdb.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/upcitemdb/, '')
      },
      // Proxy Open Food Facts API to avoid CORS issues
      '/api/openfoodfacts': {
        target: 'https://world.openfoodfacts.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openfoodfacts/, '/api/v0')
      }
    }
  }
})
