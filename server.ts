/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

import { readDB, writeDB, initializeDB } from "./server/db";
import { maintenanceMiddleware, isMaintenanceModeActive, getMaintenanceDetails, sanitizePublicSettings, seedModule7SettingsIfEmpty, getValueByJsonPath } from "./server/middleware/maintenance";
import { verifyUserOrAdminSession } from "./server/middleware/auth";
import { getAI } from "./server/services/ai";

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
const PORT = 3000;

// CORS setup for custom domains smartlinkng.com.ng
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://smartlinkng.com.ng",
    "https://www.smartlinkng.com.ng",
    "http://smartlinkng.com.ng",
    "http://www.smartlinkng.com.ng"
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
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

// =========================================================================
// VITE MIDDLEWARE & SERVER STARTUP
// =========================================================================
let serverInstance: any = null;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  serverInstance = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] SmartLink Core Server running on http://0.0.0.0:${PORT}`);
  });

  return serverInstance;
}

startServer();

export default app;
