// Load environment variables first
import "dotenv/config";

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./init-db";
import { startPriceUpdater } from "./price-updater";
import { initializeDailyContests, startDailyContestScheduler } from "./daily-contest-scheduler";

const app = express();

// CORS configuration - allow credentials for session cookies
app.use(cors({
  origin: process.env.CORS_ORIGIN || true, // Allow all origins in dev, set specific in production
  credentials: true, // Allow cookies/credentials
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Add headers to support Google OAuth popups (Cross-Origin-Opener-Policy)
app.use((req, res, next) => {
  // Allow popups for OAuth (needed for Google Sign-In)
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none'); // Allow embedding if needed
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "stock-fantasy-simulator-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax",
    },
  })
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize database with default data if using PostgreSQL
  if (process.env.DATABASE_URL) {
    try {
      await initializeDatabase();
    } catch (error) {
      log("⚠️  Database initialization failed (this is okay if tables don't exist yet):");
      log(String(error));
    }
  }

  const server = await registerRoutes(app);

  // Initialize and start daily contest scheduler
  if (process.env.NODE_ENV !== "test") {
    try {
      await initializeDailyContests();
      startDailyContestScheduler();
    } catch (error) {
      console.error("Failed to initialize daily contests:", error);
      // Continue anyway - server should still work
    }
  }

  // Start price updater service
  if (process.env.NODE_ENV !== "test") {
    try {
      startPriceUpdater();
    } catch (error) {
      console.error("Failed to start price updater:", error);
      // Continue anyway - server should still work
    }
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 8081 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '8081', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
