import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initBackupScheduler, shutdownBackupScheduler } from "./services/backupScheduler";
import { initDonorLifecycleScheduler, shutdownDonorLifecycleScheduler } from "./services/donorLifecycleScheduler";
import { helmetConfig, globalLimiter } from "./security";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Configure helmet for security headers
app.use(helmet(helmetConfig));

// Apply global rate limiter
app.use(globalLimiter);

app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

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
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Log full error details for debugging (server-side only)
    console.error('Error occurred:', {
      path: req.path,
      method: req.method,
      status,
      message: err.message,
      stack: err.stack,
    });

    // In production, sanitize error messages to prevent information leakage
    const isProduction = process.env.NODE_ENV === 'production';
    const clientMessage = isProduction && status === 500 
      ? 'Internal Server Error' 
      : message;

    res.status(status).json({ 
      message: clientMessage,
      ...(isProduction ? {} : { error: err.message }) // Include error details in dev only
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Initialize backup scheduler after routes are registered
  initBackupScheduler();
  
  // Initialize donor lifecycle scheduler (runs daily lapsed donor detection)
  initDonorLifecycleScheduler();

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    log(`${signal} received, shutting down gracefully...`);
    
    // Shutdown the backup scheduler
    await shutdownBackupScheduler();
    
    // Shutdown the donor lifecycle scheduler
    await shutdownDonorLifecycleScheduler();
    
    // Close the server
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
    
    // Force exit after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      log('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
