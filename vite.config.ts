import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ command }) => {
  const phase174GeneratedApi = command === "serve"
    ? path.resolve(import.meta.dirname, "convex", "_generated", "api")
    : path.resolve(import.meta.dirname, "client", "src", "lib", "kinfloPhase174GeneratedApiBuildStub.ts");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "shared"),
        "@assets": path.resolve(import.meta.dirname, "attached_assets"),
        "@kinflo-phase174-generated-api": phase174GeneratedApi,
      },
    },
    root: path.resolve(import.meta.dirname, "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
