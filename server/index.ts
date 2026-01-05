// Load environment variables first
import "dotenv/config";

import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cors from "cors";
import pgSession from "connect-pg-simple";
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
// Use PostgreSQL session store if DATABASE_URL is available, otherwise use memory store
let sessionStore: session.Store | undefined;

if (process.env.DATABASE_URL) {
  try {
    const PgSession = pgSession(session);
    
    // Add connection timeout parameters to the connection string if not already present
    let connectionString = process.env.DATABASE_URL;
    if (!connectionString.includes('connect_timeout')) {
      const separator = connectionString.includes('?') ? '&' : '?';
      connectionString += `${separator}connect_timeout=10`;
    }
    
    const pgStore = new PgSession({
      conString: connectionString,
      tableName: "session", // Table name for sessions
      createTableIfMissing: true, // Automatically create the session table if it doesn't exist
      // Prune expired sessions every 5 minutes
      pruneSessionInterval: 300,
    });
    
    // Wrap the session store to handle connection errors gracefully
    // This prevents the app from crashing when database is temporarily unavailable
    // Use a Proxy to forward all methods to the underlying store, but wrap error-prone methods
    sessionStore = new Proxy(pgStore, {
      get(target, prop) {
        // Wrap methods that can throw connection errors
        if (prop === 'get') {
          return (sid: string, callback: (err: any, session?: session.SessionData | null) => void) => {
            target.get(sid, (err, session) => {
              if (err && (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ENETUNREACH')) {
                console.warn(`[Session Store] Database connection error, returning null session: ${err.message}`);
                callback(null, null);
              } else {
                callback(err, session);
              }
            });
          };
        }
        if (prop === 'set') {
          return (sid: string, session: session.SessionData, callback?: (err?: any) => void) => {
            target.set(sid, session, (err) => {
              if (err && (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ENETUNREACH')) {
                console.warn(`[Session Store] Database connection error during set, session not persisted: ${err.message}`);
                if (callback) callback();
              } else {
                if (callback) callback(err);
              }
            });
          };
        }
        if (prop === 'destroy') {
          return (sid: string, callback?: (err?: any) => void) => {
            target.destroy(sid, (err) => {
              if (err && (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ENETUNREACH')) {
                console.warn(`[Session Store] Database connection error during destroy: ${err.message}`);
                if (callback) callback();
              } else {
                if (callback) callback(err);
              }
            });
          };
        }
        if (prop === 'touch') {
          return (sid: string, session: session.SessionData, callback?: (err?: any) => void) => {
            target.touch(sid, session, (err) => {
              if (err && (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND' || err.code === 'ENETUNREACH')) {
                console.warn(`[Session Store] Database connection error during touch: ${err.message}`);
                if (callback) callback();
              } else {
                if (callback) callback(err);
              }
            });
          };
        }
        // Forward all other properties/methods (including 'on', 'emit', etc.) to the original store
        const value = (target as any)[prop];
        if (typeof value === 'function') {
          return value.bind(target);
        }
        return value;
      }
    }) as session.Store;
    
    console.log("✅ Using PostgreSQL session store (with error handling)");
  } catch (error) {
    console.warn("⚠️  Failed to initialize PostgreSQL session store, using memory store:", error);
    sessionStore = undefined;
  }
} else {
  console.log("ℹ️  No DATABASE_URL, using memory session store (sessions will be lost on restart)");
}

// Trust proxy for secure cookies behind Render's load balancer
if (process.env.NODE_ENV === "production") {
  app.set('trust proxy', 1);
}

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "stock-fantasy-simulator-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Will be true behind HTTPS proxy
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: "lax",
    },
  })
);

// Middleware to handle session store errors gracefully
app.use((req, res, next) => {
  // If session store fails, ensure req.session exists
  if (!req.session) {
    // Create a minimal session object if store fails
    (req as any).session = {};
  }
  next();
});

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
  // Don't exit here in Render - let errors be visible in logs
  // The process will stay alive so we can see what went wrong
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - log and continue
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (error instanceof Error) {
    console.error('Error stack:', error.stack);
  }
  // Don't exit here on Render - log and let the process stay alive to see errors
});
