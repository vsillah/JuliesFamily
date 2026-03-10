import type { IncomingMessage, ServerResponse } from "http";
import type { Request, Response, NextFunction } from "express";

let ready: Promise<void> | null = null;
let initError: Error | null = null;

function ensureReady(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      try {
        const { app: appInstance } = await import("./app");
        const { registerRoutes } = await import("./routes");

        await registerRoutes(appInstance);

        appInstance.use((err: any, req: Request, res: Response, _next: NextFunction) => {
          const status = err.status || err.statusCode || 500;
          const message = err.message || "Internal Server Error";
          const clientMessage = status === 500 ? "Internal Server Error" : message;
          res.status(status).json({ message: clientMessage });
        });

        (globalThis as any).__vercelApp = appInstance;
      } catch (e: any) {
        initError = e;
        console.error("[vercel-entry] INIT FAILED:", e?.message, e?.stack);
        throw e;
      }
    })();
  }
  return ready;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ensureReady();
    const appInstance = (globalThis as any).__vercelApp;
    appInstance(req as any, res as any);
  } catch (e: any) {
    console.error("[vercel-entry] HANDLER ERROR:", e?.message, e?.stack);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      error: "Function initialization failed",
      message: e?.message,
      stack: e?.stack?.substring(0, 2000),
    }));
  }
}
