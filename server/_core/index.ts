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

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // ===== PWA Service Worker Routes =====
  // Serve sw-admin.js from /dashboard/sw-admin.js with correct scope header
  // This is required because browsers enforce that SW files must be within their scope
  app.get('/dashboard/sw-admin.js', (req, res) => {
    const swPath = path.resolve(import.meta.dirname, '../../client/public/sw-admin.js');
    if (fs.existsSync(swPath)) {
      res.set({
        'Content-Type': 'application/javascript',
        'Service-Worker-Allowed': '/dashboard/',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      });
      res.sendFile(swPath);
    } else {
      res.status(404).send('Service Worker not found');
    }
  });

  // Serve manifest-admin.json from /dashboard/manifest-admin.json for correct PWA scope
  app.get('/dashboard/manifest-admin.json', (req, res) => {
    const manifestPath = path.resolve(import.meta.dirname, '../../client/public/manifest-admin.json');
    if (fs.existsSync(manifestPath)) {
      res.set({
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'no-cache',
      });
      res.sendFile(manifestPath);
    } else {
      res.status(404).send('Manifest not found');
    }
  });

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
