import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5177";
const outputDir = resolve("docs/qa/vanguard-associate-assist");
const debugPort = 9240;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-vanguard-associate-assist-cdp-"));

await mkdir(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: "ignore" });

async function waitForJson(url, attempts = 50) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // Chrome may still be starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Chrome DevTools endpoint did not become ready: ${url}`);
}

let nextId = 0;
const pending = new Map();
let syntheticAdminAuthEnabled = false;

try {
  const pages = await waitForJson(`http://127.0.0.1:${debugPort}/json`);
  const page = pages.find((item) => item.type === "page");
  if (!page?.webSocketDebuggerUrl) throw new Error("No debuggable Chrome page was found.");

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });

  function send(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolveRequest, rejectRequest) => {
      pending.set(id, { resolve: resolveRequest, reject: rejectRequest });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Fetch.requestPaused" && syntheticAdminAuthEnabled) {
      const requestUrl = message.params?.request?.url ?? "";
      if (requestUrl.includes("/api/auth/user")) {
        const body = Buffer.from(JSON.stringify({
          id: "qa-vanguard-assist-admin",
          email: "qa-vanguard-assist@example.invalid",
          firstName: "QA",
          lastName: "Admin",
          role: "admin",
          isAdminSession: true,
        })).toString("base64");
        void send("Fetch.fulfillRequest", {
          requestId: message.params.requestId,
          responseCode: 200,
          responseHeaders: [{ name: "Content-Type", value: "application/json" }],
          body,
        });
      } else {
        void send("Fetch.continueRequest", { requestId: message.params.requestId });
      }
      return;
    }
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  async function evaluate(expression) {
    return send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  }

  async function setViewport(width, height) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  }

  async function navigate(url) {
    await send("Page.navigate", { url });
    await new Promise((resolveWait) => setTimeout(resolveWait, 950));
  }

  async function waitForSelector(selector, attempts = 50) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const result = await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`);
      if (result.result?.value) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    throw new Error(`Timed out waiting for selector: ${selector}`);
  }

  async function capture({ name, selector }) {
    await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block: "center"})`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 220));
    const box = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!(element instanceof HTMLElement)) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height, scale: 1 };
    })()`);
    const clip = box.result?.value;
    if (!clip) throw new Error(`Clip element not found: ${selector}`);
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, fromSurface: true, clip });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
    console.log(`Captured ${name}`);
  }

  async function assertNoOverflow() {
    const layout = await evaluate(`({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })`);
    const metrics = layout.result?.value;
    if (!metrics || metrics.clientWidth !== metrics.scrollWidth) throw new Error(`Mobile overflow detected: ${JSON.stringify(metrics)}`);
  }

  await send("Page.enable");
  await send("Runtime.enable");

  await setViewport(1280, 900);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises/orders`);
  await waitForSelector('[data-testid="vanguard-order-assist-request"]');
  await capture({ name: "01-desktop-client-assist.png", selector: '[data-testid="vanguard-order-assist-request"]' });

  await setViewport(768, 900);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises/orders`);
  await waitForSelector('[data-testid="vanguard-order-assist-request"]');
  await assertNoOverflow();
  await capture({ name: "02-tablet-client-assist.png", selector: '[data-testid="vanguard-order-assist-request"]' });

  await setViewport(390, 844);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises/orders`);
  await waitForSelector('[data-testid="vanguard-order-assist-request"]');
  await assertNoOverflow();
  await capture({ name: "02-mobile-client-assist.png", selector: '[data-testid="vanguard-order-assist-request"]' });

  syntheticAdminAuthEnabled = true;
  await send("Fetch.enable", { patterns: [{ urlPattern: "*://127.0.0.1:5177/api/auth/user*", requestStage: "Request" }] });
  await setViewport(1280, 900);
  await evaluate('window.sessionStorage.setItem("julies-persona-modal-shown", "true")');
  await navigate(`${baseUrl}/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`);
  await waitForSelector('[data-testid="section-kinflo-vanguard-assist-queue"]');
  await capture({ name: "03-desktop-associate-queue.png", selector: '[data-testid="section-kinflo-vanguard-assist-queue"]' });
  await send("Fetch.disable");
  syntheticAdminAuthEnabled = false;

  const videoPath = join(outputDir, "vanguard-associate-assist-walkthrough.mp4");
  const videoFrames = [
    "01-desktop-client-assist.png",
    "02-tablet-client-assist.png",
    "02-mobile-client-assist.png",
    "03-desktop-associate-queue.png",
  ];
  const ffmpegArgs = ["-y"];
  for (const frame of videoFrames) ffmpegArgs.push("-loop", "1", "-t", "4", "-i", join(outputDir, frame));
  const streams = videoFrames.map((_, index) => `[${index}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1[v${index}]`).join(";");
  const inputs = videoFrames.map((_, index) => `[v${index}]`).join("");
  ffmpegArgs.push(
    "-filter_complex", `${streams};${inputs}concat=n=${videoFrames.length}:v=1:a=0[outv]`,
    "-map", "[outv]",
    "-r", "30",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    videoPath,
  );
  const video = spawnSync("ffmpeg", ffmpegArgs, { encoding: "utf8" });
  if (video.status !== 0) throw new Error(`FFmpeg walkthrough render failed: ${video.stderr}`);
  console.log("Rendered vanguard-associate-assist-walkthrough.mp4");

  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
