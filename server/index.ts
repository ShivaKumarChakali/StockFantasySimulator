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
  try {
    console.log("🚀 Starting server initialization...");
    
    // Initialize database with default data if using PostgreSQL
    if (process.env.DATABASE_URL) {
      try {
        console.log("📦 Initializing database...");
        await initializeDatabase();
        console.log("✅ Database initialization complete");
      } catch (error) {
        console.log("⚠️  Database initialization failed (this is okay if tables don't exist yet):");
        console.log(String(error));
      }
    } else {
      console.log("ℹ️  No DATABASE_URL, skipping database initialization");
    }

    console.log("🛣️  Registering routes...");
    let server;
    try {
      server = await registerRoutes(app);
      console.log("✅ Routes registered, HTTP server created");
    } catch (error) {
      console.error("❌ Failed to register routes:", error);
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
      throw error;
    }

    // Initialize and start daily contest scheduler
    if (process.env.NODE_ENV !== "test") {
      try {
        console.log("📅 Initializing daily contests...");
        await initializeDailyContests();
        console.log("✅ Daily contests initialized");
        startDailyContestScheduler();
        console.log("✅ Daily contest scheduler started");
      } catch (error) {
        console.error("❌ Failed to initialize daily contests:", error);
        // Continue anyway - server should still work
      }
    }

    // Start price updater service
    if (process.env.NODE_ENV !== "test") {
      try {
        console.log("💰 Starting price updater...");
        startPriceUpdater();
        console.log("✅ Price updater started");
      } catch (error) {
        console.error("❌ Failed to start price updater:", error);
        // Continue anyway - server should still work
      }
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Error:", err);
      res.status(status).json({ message });
      // Don't throw - error already handled
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      console.log("🔧 Setting up Vite dev server...");
      try {
        await setupVite(app, server);
        console.log("✅ Vite dev server setup complete");
      } catch (error) {
        console.error("❌ Failed to setup Vite:", error);
        throw error;
      }
    } else {
      console.log("📁 Setting up static file serving...");
      try {
        serveStatic(app);
        console.log("✅ Static file serving setup complete");
      } catch (error) {
        console.error("❌ Failed to setup static file serving:", error);
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          console.error("Error stack:", error.stack);
        }
        throw error;
      }
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 8081 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '8081', 10);
    console.log(`🌐 Starting server on port ${port}...`);
    
    server.listen(port, "0.0.0.0", () => {
      console.log(`✅ Server listening on port ${port}`);
      log(`✅ Server listening on port ${port}`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use`);
        log(`❌ Port ${port} is already in use`);
      } else {
        console.error(`❌ Server error: ${error.message}`);
        log(`❌ Server error: ${error.message}`);
      }
      process.exit(1);
    });

    console.log("✅ Server initialization complete - server should be running");
  } catch (error) {
    console.error("❌ Error during server initialization:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
    throw error; // Re-throw to be caught by outer catch
  }
})().catch((error) => {
  console.error("❌ Fatal error during server startup:", error);
  if (error instanceof Error) {
    console.error("Error stack:", error.stack);
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - log and continue
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
