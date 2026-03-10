import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app } from "../server/app";
import { registerRoutes } from "../server/routes";
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ensureReady();
  app(req, res);
}
