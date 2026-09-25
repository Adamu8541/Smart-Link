/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import express from "express";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import { readDB, writeDB, initializeDB } from "./server/db";
import { maintenanceMiddleware, isMaintenanceModeActive, getMaintenanceDetails, sanitizePublicSettings, seedModule7SettingsIfEmpty, getValueByJsonPath } from "./server/middleware/maintenance";
import { verifyUserOrAdminSession } from "./server/middleware/auth";
import { getAI } from "./server/services/ai";

import { resolveSEOMetadata, injectSEOTags, generateSitemapXml, generateRobotsTxt } from "./server/services/seo.service";

// Import modular route handlers
import publicRoutes from "./server/routes/public.routes";
import authRoutes from "./server/routes/auth.routes";
import adminAuthRoutes from "./server/routes/adminAuth.routes";
import adminUsersRoutes from "./server/routes/adminUsers.routes";
import walletsRoutes from "./server/routes/wallets.routes";
import transactionsRoutes from "./server/routes/transactions.routes";
import providersRoutes from "./server/routes/providers.routes";
import servicesCatalogRoutes from "./server/routes/servicesCatalog.routes";
import billsRoutes from "./server/routes/bills.routes";
import verificationRoutes from "./server/routes/verification.routes";
import notificationsRoutes from "./server/routes/notifications.routes";
import settingsRoutes from "./server/routes/settings.routes";
import aiRoutes from "./server/routes/ai.routes";
import storageRoutes from "./server/routes/storage.routes";
import webhooksRoutes from "./server/routes/webhooks.routes";
import legalRoutes from "./server/routes/legal.routes";
import marketplaceRoutes from "./server/routes/marketplace.routes";
import virtualAccountRoutes from "./server/routes/virtualAccount.routes";
import manualServicesRoutes from "./server/routes/manualServices.routes";
import tursoRoutes from "./server/routes/turso.routes";
import securityRoutes from "./server/routes/security.routes";
import apiBuilderRoutes from "./server/routes/apiBuilder.routes";

// Re-export core helpers for backwards compatibility
export {
  readDB,
  writeDB,
  initializeDB,
  isMaintenanceModeActive,
  getMaintenanceDetails,
  sanitizePublicSettings,
  seedModule7SettingsIfEmpty,
  getValueByJsonPath,
  verifyUserOrAdminSession,
  getAI,
};

dotenv.config();

const app = express();
app.use(compression());
const PORT = 3000;

// Security Headers
app.use(helmet({
  frameguard: false,
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS setup for custom domains smartlinkng.com.ng and Render subdomains
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://smartlinkng.com.ng",
    "https://www.smartlinkng.com.ng",
    "http://smartlinkng.com.ng",
    "http://www.smartlinkng.com.ng"
  ];
  const origin = req.headers.origin;
  if (origin) {
    if (allowedOrigins.includes(origin) || origin.includes("onrender.com") || process.env.NODE_ENV !== "production") {
      res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, x-admin-token");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// JSON and URL-encoded body parser with generous limit for document attachments
app.use(
  express.json({
    limit: "50mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf ? buf.toString("utf8") : "";
      req.rawBodyBuffer = buf;
    },
  })
);

app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  })
);

// Body parser error handler: Ensure API requests never receive raw HTML 413 or 400 error pages
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && req.path.startsWith("/api/")) {
    console.warn(`[API Body Error] ${req.method} ${req.path}:`, err.message || err);
    if (err.type === "entity.too.large" || err.status === 413) {
      return res.status(413).json({
        success: false,
        error: "The uploaded file(s) or submission payload is too large. Please upload smaller documents or photos.",
      });
    }
    return res.status(err.status || 400).json({
      success: false,
      error: err.message || "Invalid submission payload.",
    });
  }
  next(err);
});

// Search Engine Crawler & Privacy Directives Middleware
app.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (
    p.startsWith("/api") ||
    p.startsWith("/admin") ||
    p.startsWith("/dashboard") ||
    p.startsWith("/wallet") ||
    p.startsWith("/reset-password") ||
    p.startsWith("/verify-email") ||
    p.startsWith("/auth/action") ||
    p.startsWith("/__/auth")
  ) {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  next();
});

// Global Maintenance Mode Middleware
app.use(maintenanceMiddleware);

// Mount modular route groups
app.use(publicRoutes);
app.use(webhooksRoutes);
app.use(authRoutes);
app.use(adminAuthRoutes);
app.use(adminUsersRoutes);
app.use(walletsRoutes);
app.use(transactionsRoutes);
app.use(providersRoutes);
app.use(servicesCatalogRoutes);
app.use(billsRoutes);
app.use(verificationRoutes);
app.use(notificationsRoutes);
app.use(settingsRoutes);
app.use(aiRoutes);
app.use(storageRoutes);
app.use(legalRoutes);
app.use(marketplaceRoutes);
app.use(virtualAccountRoutes);
app.use(manualServicesRoutes);
app.use(tursoRoutes);
app.use(securityRoutes);
app.use(apiBuilderRoutes);

// Fallback 404 for all unhandled /api/* routes so they always return JSON and never HTML
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global API Error Handler: Guarantees any unhandled error in /api routes returns JSON, never HTML
app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[API Unhandled Error] ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = typeof err.status === "number" ? err.status : typeof err.statusCode === "number" ? err.statusCode : 500;
  return res.status(statusCode).json({
    success: false,
    error: err?.message || "Internal server error processing API request.",
    errorCode: err?.code || "INTERNAL_API_ERROR",
    details: err?.details || undefined,
  });
});

// Search Engine Directives: robots.txt and sitemap.xml
app.get("/robots.txt", (req, res) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "smartlinkng.com.ng";
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const origin = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("ais-")
    ? `${protocol}://${host}`
    : "https://smartlinkng.com.ng";

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(generateRobotsTxt(origin));
});

app.get(["/sitemap.xml", "/sitemap_index.xml"], (req, res) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "smartlinkng.com.ng";
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const origin = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("ais-")
    ? `${protocol}://${host}`
    : "https://smartlinkng.com.ng";

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.send(generateSitemapXml(origin));
});

app.get("/llms.txt", (_req, res) => {
  const filePath = path.join(process.cwd(), "public", "llms.txt");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.sendFile(filePath);
  }
  res.status(404).send("llms.txt not found");
});

app.get("/llms-full.txt", (_req, res) => {
  const filePath = path.join(process.cwd(), "public", "llms-full.txt");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.sendFile(filePath);
  }
  res.status(404).send("llms-full.txt not found");
});

app.get("/.well-known/ai-plugin.json", (_req, res) => {
  const filePath = path.join(process.cwd(), "public", ".well-known", "ai-plugin.json");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.sendFile(filePath);
  }
  res.status(404).json({ error: "ai-plugin.json not found" });
});

app.get("/.well-known/agent.json", (_req, res) => {
  const filePath = path.join(process.cwd(), "public", ".well-known", "agent.json");
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.sendFile(filePath);
  }
  res.status(404).json({ error: "agent.json not found" });
});

// =========================================================================
// VITE MIDDLEWARE & SERVER STARTUP
// =========================================================================
let serverInstance: any = null;

async function startServer() {
  const isProductionMode = process.env.NODE_ENV === "production";

  // Universal favicon and icon route handler with long-term 1-year immutable caching
  app.get(["/favicon.webp", "/favicon.png", "/favicon.ico", "/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"], (req, res) => {
    const isWebp = req.path.endsWith(".webp");
    const isPng = req.path.endsWith(".png");
    const mime = isWebp ? "image/webp" : isPng ? "image/png" : "image/x-icon";
    
    const publicPath = path.join(process.cwd(), "public");
    const distPath = path.join(process.cwd(), "dist");

    const reqFile = path.basename(req.path);
    const favPublic = path.join(publicPath, reqFile);
    const favDist = path.join(distPath, reqFile);
    const favDefaultWebp = path.join(publicPath, "favicon.webp");

    res.setHeader("Content-Type", mime);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("CDN-Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Cloudflare-CDN-Cache-Control", "public, max-age=31536000, immutable");

    if (fs.existsSync(favPublic)) return res.sendFile(favPublic);
    if (fs.existsSync(favDist)) return res.sendFile(favDist);
    if (fs.existsSync(favDefaultWebp)) return res.sendFile(favDefaultWebp);
    return res.status(204).send();
  });

  // Universal logo route handler (works in both dev and production modes)
  app.get(["/logo.webp", "/assets/logo.webp", "/logo.png", "/assets/logo.png"], (req, res) => {
    const isWebp = req.path.endsWith(".webp");
    const ext = isWebp ? ".webp" : ".png";
    const mime = isWebp ? "image/webp" : "image/png";
    
    const publicPath = path.join(process.cwd(), "public");
    const distPath = path.join(process.cwd(), "dist");

    const primaryLogo = path.join(publicPath, `logo${ext}`);
    const altExt = isWebp ? ".png" : ".webp";
    const altLogo = path.join(publicPath, `logo${altExt}`);
    const distLogo = path.join(distPath, `logo${ext}`);
    const rootLogo = path.join(process.cwd(), `logo${ext}`);

    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("CDN-Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Cloudflare-CDN-Cache-Control", "public, max-age=31536000, immutable");
    if (fs.existsSync(primaryLogo)) {
      res.setHeader("Content-Type", mime);
      return res.sendFile(primaryLogo);
    }
    if (fs.existsSync(altLogo)) {
      res.setHeader("Content-Type", isWebp ? "image/png" : "image/webp");
      return res.sendFile(altLogo);
    }
    if (fs.existsSync(distLogo)) {
      res.setHeader("Content-Type", mime);
      return res.sendFile(distLogo);
    }
    if (fs.existsSync(rootLogo)) {
      res.setHeader("Content-Type", mime);
      return res.sendFile(rootLogo);
    }
    return res.status(204).send();
  });

  if (!isProductionMode) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const publicPath = path.join(process.cwd(), "public");

    // Explicit route for WebP and PNG logos with long-term caching
    app.get(["/logo.webp", "/assets/logo.webp", "/logo.png", "/assets/logo.png"], (req, res) => {
      const isWebp = req.path.endsWith(".webp");
      const ext = isWebp ? ".webp" : ".png";
      const mime = isWebp ? "image/webp" : "image/png";
      
      const publicLogo = path.join(publicPath, `logo${ext}`);
      const distLogo = path.join(distPath, `logo${ext}`);
      const rootLogo = path.join(process.cwd(), `logo${ext}`);
      
      res.setHeader("Content-Type", mime);
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      if (fs.existsSync(publicLogo)) return res.sendFile(publicLogo);
      if (fs.existsSync(distLogo)) return res.sendFile(distLogo);
      if (fs.existsSync(rootLogo)) return res.sendFile(rootLogo);
      return res.status(404).send("Logo not found");
    });

    // Explicit route for Open Graph & Social Preview image (1200x630)
    app.get(["/og-image.png", "/assets/og-image.png", "/og-image.jpg"], (_req, res) => {
      const publicOg = path.join(publicPath, "og-image.png");
      const distOg = path.join(distPath, "og-image.png");
      const rootOg = path.join(process.cwd(), "og-image.png");

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      if (fs.existsSync(publicOg)) return res.sendFile(publicOg);
      if (fs.existsSync(distOg)) return res.sendFile(distOg);
      if (fs.existsSync(rootOg)) return res.sendFile(rootOg);
      // Fallback to logo if og-image is missing
      const publicLogo = path.join(publicPath, "logo.webp");
      if (fs.existsSync(publicLogo)) return res.sendFile(publicLogo);
      return res.status(404).send("OG image not found");
    });

    // Hashed Vite production assets - 1 Year Immutable Cache (Registered FIRST to avoid fallback interception)
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "31536000s",
      immutable: true,
      setHeaders: (res, filePath) => {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("CDN-Cache-Control", "public, max-age=31536000, immutable");
        res.setHeader("Cloudflare-CDN-Cache-Control", "public, max-age=31536000, immutable");
      }
    }));

    // Dedicated fallback route for public/assets files (NIN slips, BVN cards, etc.)
    app.get("/assets/:filename", (req, res, next) => {
      const filename = decodeURIComponent(req.params.filename);
      // Strictly skip any compiled Vite production asset extensions
      if (
        filename.endsWith(".js") ||
        filename.endsWith(".css") ||
        filename.endsWith(".mjs") ||
        filename.endsWith(".map") ||
        filename.endsWith(".woff2") ||
        filename.endsWith(".woff") ||
        filename.endsWith(".ttf")
      ) {
        return next();
      }

      const searchDirs = [
        path.join(publicPath, "assets"),
        path.join(process.cwd(), "public", "assets"),
        path.join(process.cwd(), "assets"),
      ];
      
      // 1. Exact match
      for (const dir of searchDirs) {
        const exactPath = path.join(dir, filename);
        if (fs.existsSync(exactPath) && fs.statSync(exactPath).isFile()) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          return res.sendFile(exactPath);
        }
      }

      // 2. Case-insensitive match in searchDirs
      const lowerName = filename.toLowerCase();
      for (const dir of searchDirs) {
        if (fs.existsSync(dir)) {
          try {
            const files = fs.readdirSync(dir);
            const found = files.find(f => f.toLowerCase() === lowerName);
            if (found) {
              const fullPath = path.join(dir, found);
              res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
              return res.sendFile(fullPath);
            }
          } catch {}
        }
      }

      next();
    });

    // Static public directory - 1 Year Cache for images, icons & assets with ETag support
    app.use(express.static(publicPath, {
      maxAge: "31536000s",
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html") || filePath.endsWith("sw.js")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (filePath.endsWith(".webp") || filePath.endsWith(".png") || filePath.endsWith(".ico") || filePath.endsWith(".svg") || filePath.endsWith(".jpg")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          res.setHeader("CDN-Cache-Control", "public, max-age=31536000, immutable");
          res.setHeader("Cloudflare-CDN-Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    }));

    app.use(express.static(distPath, {
      maxAge: "31536000s",
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html") || filePath.endsWith("sw.js")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (filePath.endsWith(".webp") || filePath.endsWith(".png") || filePath.endsWith(".ico") || filePath.endsWith(".svg") || filePath.endsWith(".jpg") || filePath.endsWith(".js") || filePath.endsWith(".css")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          res.setHeader("CDN-Cache-Control", "public, max-age=31536000, immutable");
          res.setHeader("Cloudflare-CDN-Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    }));

    // Dynamic Server-Side HTML Rendering with SEO, Open Graph & Twitter Card Meta Tags
    app.get("*", (req, res) => {
      try {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          let rawHtml = fs.readFileSync(indexPath, "utf-8");
          // Eliminate render-blocking CSS penalty by transforming stylesheets into asynchronous preloads
          rawHtml = rawHtml.replace(
            /<link\s+([^>]*?\s+)?(?:rel=["']stylesheet["']\s+[^>]*?href=["']([^"']+\.css)["']|href=["']([^"']+\.css)["']\s+[^>]*?rel=["']stylesheet["'])[^>]*>/gi,
            (_match, _prefix, href1, href2) => {
              const href = href1 || href2;
              return `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" href="${href}"></noscript>`;
            }
          );
          const seoMetadata = resolveSEOMetadata(req);
          if (seoMetadata.noIndex) {
            res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
          }
          const finalHtml = injectSEOTags(rawHtml, seoMetadata);
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.setHeader("Cache-Control", "public, max-age=300");
          return res.send(finalHtml);
        }
        res.sendFile(indexPath);
      } catch (err) {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  }

  serverInstance = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] SmartLink Core Server running on http://0.0.0.0:${PORT}`);
  });

  return serverInstance;
}

startServer();

export default app;
