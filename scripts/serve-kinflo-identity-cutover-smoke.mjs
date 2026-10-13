import { createServer } from "vite";

process.env.VITE_KINFLO_IDENTITY_MODE = "disabled";
delete process.env.VITE_CONVEX_URL;

const port = Number(process.env.PORT ?? 5178);
const host = "127.0.0.1";
let legacyAuthUserRequests = 0;

const identityCutoverSmokePlugin = {
  name: "kinflo-identity-cutover-smoke",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const path = req.url?.split("?")[0];

      if (req.method === "GET" && path === "/api/auth/user") {
        legacyAuthUserRequests += 1;
        res.statusCode = 503;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("X-KinFlo-Legacy-Auth-Probe", "blocked");
        res.end(JSON.stringify({ message: "Legacy auth probe reached" }));
        return;
      }

      if (req.method === "GET" && path === "/__kinflo-identity-smoke/requests") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "no-store");
        res.end(JSON.stringify({ legacyAuthUserRequests }));
        return;
      }

      next();
    });
  },
};

const server = await createServer({
  configFile: "vite.config.ts",
  plugins: [identityCutoverSmokePlugin],
  server: {
    host,
    port,
    strictPort: true,
  },
});

await server.listen();

server.printUrls();
console.log("KinFlo identity cutover smoke server");
console.log(`Fail-closed route: http://${host}:${port}/admin/kinflo-os`);
console.log(`Request counter: http://${host}:${port}/__kinflo-identity-smoke/requests`);
console.log("Expected after route load: legacyAuthUserRequests = 0");
console.log("External writes: 0");
console.log("Hosted Convex touched: no");
console.log("Live Auth0 touched: no");
