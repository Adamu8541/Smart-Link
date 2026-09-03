/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import express from "express";
import path from "path";
import fs from "fs";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import { readDB, writeDB, initializeDB } from "./server/db";
import { maintenanceMiddleware, isMaintenanceModeActive, getMaintenanceDetails, sanitizePublicSettings, seedModule7SettingsIfEmpty, getValueByJsonPath } from "./server/middleware/maintenance";
import { verifyUserOrAdminSession } from "./server/middleware/auth";
import { getAI } from "./server/services/ai";
import { connectRedis } from "./server/redis";

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
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Security Headers
app.use(helmet({
  frameguard: false,
  contentSecurityPolicy: false,
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

// JSON body parser with rawBody capture for webhook signature verification
app.use(
  express.json({
    limit: "20mb",
    verify: (req: any, _res, buf) => {
      req.rawBody = buf ? buf.toString("utf8") : "";
      req.rawBodyBuffer = buf;
    },
  })
);

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

// Fallback 404 for all unhandled /api/* routes so they always return JSON and never HTML
app.all("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`,
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

// =========================================================================
// VITE MIDDLEWARE & SERVER STARTUP
// =========================================================================
let serverInstance: any = null;

async function startServer() {
  // await connectRedis(); // Temporarily disabled due to missing Redis service in this environment
  if (process.env.NODE_ENV !== "production") {
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

    // Hashed Vite production assets - 1 Year Immutable Cache
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "31536000s",
      immutable: true,
    }));

    // Static public directory - 7 Days Cache with ETag support
    app.use(express.static(publicPath, {
      maxAge: "604800s",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      }
    }));

    app.use(express.static(distPath, {
      maxAge: "86400s",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      }
    }));

    // Dynamic Server-Side HTML Rendering with SEO, Open Graph & Twitter Card Meta Tags
    app.get("*", (req, res) => {
      try {
        const indexPath = path.join(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          const rawHtml = fs.readFileSync(indexPath, "utf-8");
          const seoMetadata = resolveSEOMetadata(req);
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
