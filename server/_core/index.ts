import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import path from "path";
import fs from "fs";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { createUploadRouter } from "../uploadRoute";
import { createWebhookRouter } from "../webhookRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
// import { initSimpleCronScheduler } from "../cron/scheduler";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Resolve the path to a static file that works in both dev and production.
 * - In development: files are in client/public/
 * - In production: files are compiled to dist/public/ (same dir as dist/index.js + /public/)
 */
function resolveStaticFile(filename: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    // In dev: import.meta.dirname = server/_core/, so go up 2 levels to project root
    return path.resolve(import.meta.dirname, '../../client/public', filename);
  } else {
    // In production: import.meta.dirname = dist/, so public/ is right next to it
    return path.resolve(import.meta.dirname, 'public', filename);
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ===== PWA Service Worker Routes =====
  // Serve sw-admin.js from /admin/sw-admin.js with correct scope header
  // This is required because browsers enforce that SW files must be within their scope
  // Also keep /dashboard/sw-admin.js for backward compatibility
  const serveAdminSW = (scopePath: string) => (req: any, res: any) => {
    const swPath = resolveStaticFile('sw-admin.js');
    console.log(`[SW] Serving sw-admin.js from: ${swPath} (exists: ${fs.existsSync(swPath)})`);
    if (fs.existsSync(swPath)) {
      res.set({
        'Content-Type': 'application/javascript',
        'Service-Worker-Allowed': scopePath,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      res.sendFile(swPath);
    } else {
      console.error(`[SW] sw-admin.js not found at: ${swPath}`);
      res.status(404).send('Service Worker not found');
    }
  };
  app.get('/admin/sw-admin.js', serveAdminSW('/admin/'));
  app.get('/dashboard/sw-admin.js', serveAdminSW('/dashboard/'));

  // Also serve the public sw.js with correct headers
  app.get('/sw.js', (req: any, res: any) => {
    const swPath = resolveStaticFile('sw.js');
    console.log(`[SW] Serving sw.js from: ${swPath} (exists: ${fs.existsSync(swPath)})`);
    if (fs.existsSync(swPath)) {
      res.set({
        'Content-Type': 'application/javascript',
        'Service-Worker-Allowed': '/',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      res.sendFile(swPath);
    } else {
      res.status(404).send('Service Worker not found');
    }
  });

  // Serve manifest-admin.json from /manifest-admin.json (root) and /dashboard/manifest-admin.json (legacy)
  const serveAdminManifest = (req: any, res: any) => {
    const manifestPath = resolveStaticFile('manifest-admin.json');
    console.log(`[Manifest] Serving manifest-admin.json from: ${manifestPath} (exists: ${fs.existsSync(manifestPath)})`);
    if (fs.existsSync(manifestPath)) {
      res.set({
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache',
      });
      res.sendFile(manifestPath);
    } else {
      console.error(`[Manifest] manifest-admin.json not found at: ${manifestPath}`);
      res.status(404).send('Manifest not found');
    }
  };
  app.get('/manifest-admin.json', serveAdminManifest);
  app.get('/dashboard/manifest-admin.json', serveAdminManifest);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // File upload route
  app.use(createUploadRouter());
  // WhatsApp Webhook routes (direct Express, not tRPC - Meta requirement)
  app.use(createWebhookRouter());
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Initialize cron scheduler for automatic deactivation
    // initSimpleCronScheduler(); // Disabled: Auto-deactivation feature removed per user request
  });
}

startServer().catch(console.error);
