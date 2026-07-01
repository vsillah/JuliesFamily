import { createServer } from "vite";

const port = Number(process.env.PORT ?? 5177);
const host = "127.0.0.1";

const fixtureUser = {
  id: "kinflo-local-admin-fixture",
  oidcSub: "local|kinflo-admin-fixture",
  email: "kinflo-admin@example.invalid",
  firstName: "KinFlo",
  lastName: "Admin Fixture",
  role: "super_admin",
  isAdminSession: true,
  persona: "provider",
  funnelStage: "decision",
  source: "kinflo-local-admin-fixture",
};

const kinfloLocalAdminSmokePlugin = {
  name: "kinflo-local-admin-smoke-fixture",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.method === "GET" && req.url?.split("?")[0] === "/api/auth/user") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.setHeader("X-KinFlo-Local-Admin-Fixture", "true");
        res.end(JSON.stringify(fixtureUser));
        return;
      }

      next();
    });
  },
};

const server = await createServer({
  configFile: "vite.config.ts",
  plugins: [kinfloLocalAdminSmokePlugin],
  server: {
    host,
    port,
    strictPort: true,
  },
});

await server.listen();

server.printUrls();
console.log("KinFlo local admin smoke server");
console.log(`Admin shell: http://${host}:${port}/admin/kinflo-os`);
console.log(`Public preview: http://${host}:${port}/kinflo-sites/julies-family`);
console.log("Fixture default in production server: disabled");
console.log("External writes: 0");
console.log("Hosted deployment touched: no");
console.log("Live Convex execution: no");
