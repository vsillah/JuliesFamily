import type { IncomingMessage, ServerResponse } from "http";
import { app } from "./app";
import { registerRoutes } from "./routes";
import type { Request, Response, NextFunction } from "express";

let ready: Promise<void> | null = null;

function ensureReady(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await registerRoutes(app);

      app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        const clientMessage = status === 500 ? "Internal Server Error" : message;
        res.status(status).json({ message: clientMessage });
      });
    })();
  }
  return ready;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ensureReady();
  app(req as any, res as any);
}
