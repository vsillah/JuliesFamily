import "dotenv/config";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.local", override: true });

import { app } from "./app";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initBackupScheduler, shutdownBackupScheduler } from "./services/backupScheduler";
import { initDonorLifecycleScheduler, shutdownDonorLifecycleScheduler } from "./services/donorLifecycleScheduler";
import { initEmailReportScheduler, shutdownEmailReportScheduler } from "./services/emailReportScheduler";
import type { Request, Response, NextFunction } from "express";

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Error occurred:', {
      path: req.path,
      method: req.method,
      status,
      message: err.message,
      stack: err.stack,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const clientMessage = isProduction && status === 500
      ? 'Internal Server Error'
      : message;

    res.status(status).json({
      message: clientMessage,
      ...(isProduction ? {} : { error: err.message })
    });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  initBackupScheduler();
  initDonorLifecycleScheduler();
  initEmailReportScheduler();

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, process.env.NODE_ENV === "development" ? "localhost" : "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });

  const shutdown = async (signal: string) => {
    log(`${signal} received, shutting down gracefully...`);
    await shutdownBackupScheduler();
    await shutdownDonorLifecycleScheduler();
    await shutdownEmailReportScheduler();
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
    setTimeout(() => {
      log('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
