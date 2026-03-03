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
  }

  app.use(express.static(distPath));

  // fall through to index.html or index-admin.html based on route
  app.use("*", (req, res) => {
    const isAdminRoute = req.originalUrl.startsWith('/dashboard') || req.originalUrl.startsWith('/admin');
    const htmlFile = isAdminRoute && fs.existsSync(path.resolve(distPath, 'index-admin.html'))
      ? 'index-admin.html'
      : 'index.html';
    res.sendFile(path.resolve(distPath, htmlFile));
  });
}
