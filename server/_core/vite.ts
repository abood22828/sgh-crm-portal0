import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Use admin HTML template for /dashboard/* routes
      // This ensures manifest-admin.json is loaded directly in <head> without JS
      // which is required for correct PWA scope isolation
      const isAdminRoute = url.startsWith('/dashboard') || url.startsWith('/admin');
      const templateFile = isAdminRoute ? 'index-admin.html' : 'index.html';
      
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        templateFile
      );

      // Fallback to index.html if index-admin.html doesn't exist
      const templatePath = fs.existsSync(clientTemplate)
        ? clientTemplate
        : path.resolve(import.meta.dirname, "../..", "client", "index.html");

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(templatePath, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  } else {
    // Log available HTML files for debugging
    const files = fs.readdirSync(distPath).filter(f => f.endsWith('.html'));
    console.log(`[serveStatic] distPath: ${distPath}`);
    console.log(`[serveStatic] HTML files found: ${files.join(', ')}`);
  }

  // ===== Service Worker files need special headers =====
  // MUST be registered BEFORE express.static to intercept these specific paths
  // The Service-Worker-Allowed header allows the SW to control a broader scope than its URL
  
  // Admin SW: served from /admin/sw-admin.js, controls /admin/ scope
  app.get('/admin/sw-admin.js', (req, res) => {
    const swFile = path.resolve(distPath, 'admin', 'sw-admin.js');
    console.log(`[SW] /admin/sw-admin.js → ${swFile} (exists: ${fs.existsSync(swFile)})`);
    if (!fs.existsSync(swFile)) {
      return res.status(404).send('Service Worker not found');
    }
    res.set({
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/admin/',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.sendFile(swFile);
  });

  // Dashboard SW fallback (backward compat)
  app.get('/dashboard/sw-admin.js', (req, res) => {
    const swFile = path.resolve(distPath, 'admin', 'sw-admin.js');
    if (!fs.existsSync(swFile)) {
      return res.status(404).send('Service Worker not found');
    }
    res.set({
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/dashboard/',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.sendFile(swFile);
  });

  // Public SW
  app.get('/sw.js', (req, res) => {
    const swFile = path.resolve(distPath, 'sw.js');
    if (!fs.existsSync(swFile)) {
      return res.status(404).send('Service Worker not found');
    }
    res.set({
      'Content-Type': 'application/javascript; charset=utf-8',
      'Service-Worker-Allowed': '/',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    });
    res.sendFile(swFile);
  });

  // Serve static files (this handles all other assets)
  app.use(express.static(distPath));

  // fall through to index.html or index-admin.html based on route
  app.use("*", (req, res) => {
    const isAdminRoute = req.originalUrl.startsWith('/dashboard') || req.originalUrl.startsWith('/admin');
    const htmlFile = isAdminRoute ? 'index-admin.html' : 'index.html';
    const htmlPath = path.resolve(distPath, htmlFile);

    // Verify the file exists before serving
    if (!fs.existsSync(htmlPath)) {
      console.error(`[serveStatic] File not found: ${htmlPath}. Falling back to index.html`);
      return res.sendFile(path.resolve(distPath, 'index.html'));
    }

    res.sendFile(htmlPath);
  });
}
