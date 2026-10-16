import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const port = 5182;
const baseUrl = `http://127.0.0.1:${port}`;
const outputDir = resolve("docs/qa/phase178-preview-activation-control");
const debugPort = 9282;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-preview-activation-"));
const externalApplicationRequests = [];

await mkdir(outputDir, { recursive: true });

const server = spawn(process.execPath, ["scripts/serve-kinflo-local-admin-smoke.mjs"], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: "ignore" });

async function waitForJson(url, attempts = 120) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      // The local server or Chrome may still be starting.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Endpoint did not become ready: ${url}`);
}

let nextId = 0;
const pending = new Map();

try {
  await waitForJson(`${baseUrl}/api/auth/user`);
  const pages = await waitForJson(`http://127.0.0.1:${debugPort}/json`);
  const page = pages.find((item) => item.type === "page");
  if (!page?.webSocketDebuggerUrl) throw new Error("No debuggable Chrome page was found.");

  const socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Network.requestWillBeSent") {
      const url = message.params?.request?.url;
      const method = message.params?.request?.method;
      const type = message.params?.type;
      if (typeof url === "string" && /^https?:/.test(url) && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) {
        if (method !== "GET" || ["Fetch", "XHR", "WebSocket"].includes(type)) {
          externalApplicationRequests.push({ url, method, type });
        }
      }
    }
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  function send(method, params = {}) {
    const id = ++nextId;
    return new Promise((resolveRequest, rejectRequest) => {
      pending.set(id, { resolve: resolveRequest, reject: rejectRequest });
      socket.send(JSON.stringify({ id, method, params }));
    });
  }

  const evaluate = (expression) => send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  const setViewport = (width, height) => send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });

  async function navigate(path) {
    await send("Page.navigate", { url: `${baseUrl}${path}` });
    await new Promise((resolveWait) => setTimeout(resolveWait, 900));
  }

  async function waitForSelector(selector, attempts = 100) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const found = await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`);
      if (found.result?.value) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    const state = await evaluate(`({ path: location.pathname + location.search, text: document.body.innerText.slice(0, 800) })`);
    throw new Error(`Timed out waiting for ${selector}: ${JSON.stringify(state.result?.value)}`);
  }

  async function capture(name) {
    const overflow = await evaluate(`({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })`);
    const dimensions = overflow.result?.value;
    if (dimensions?.scrollWidth > dimensions?.clientWidth) {
      throw new Error(`${name} has horizontal overflow: ${JSON.stringify(dimensions)}`);
    }
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
    console.log(`Captured ${name}`);
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  await setViewport(1440, 900);
  await navigate("/admin/kinflo-os?tab=hosted-activation&activationEvidence=bootstrap");
  await waitForSelector('[data-testid="button-kinflo-bootstrap-platform-admin"]');
  await capture("01-desktop-bootstrap-ready.png");

  await evaluate(`document.querySelector('[data-testid="button-kinflo-bootstrap-platform-admin"]')?.click()`);
  await waitForSelector('[data-testid="section-kinflo-preview-activation-control"]');
  await evaluate(`document.querySelector('[data-testid="section-kinflo-preview-activation-control"]')?.scrollIntoView({ block: 'center' })`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  await capture("02-desktop-seed-ready.png");

  await evaluate(`document.querySelector('[data-testid="button-kinflo-run-vanguard-seed"]')?.click()`);
  await waitForSelector('[role="alertdialog"]');
  await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  await capture("03-desktop-seed-confirmation.png");

  await setViewport(390, 844);
  await navigate("/admin/kinflo-os?tab=hosted-activation&activationEvidence=bootstrap");
  await waitForSelector('[data-testid="button-kinflo-bootstrap-platform-admin"]');
  await capture("04-mobile-bootstrap-ready.png");

  await navigate("/admin/kinflo-os?tab=hosted-activation&activationEvidence=seed-ready");
  await waitForSelector('[data-testid="section-kinflo-preview-activation-control"]');
  await evaluate(`document.querySelector('[data-testid="section-kinflo-preview-activation-control"]')?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12)`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  await capture("05-mobile-seed-ready.png");

  if (externalApplicationRequests.length) {
    throw new Error(`Unexpected non-loopback application requests: ${JSON.stringify(externalApplicationRequests)}`);
  }

  await writeFile(
    join(outputDir, "network-evidence.json"),
    `${JSON.stringify({ externalApplicationRequests: 0, externalWrites: 0, liveConvexExecution: 0 }, null, 2)}\n`,
  );

  const shots = [
    "01-desktop-bootstrap-ready.png",
    "02-desktop-seed-ready.png",
    "03-desktop-seed-confirmation.png",
    "04-mobile-bootstrap-ready.png",
    "05-mobile-seed-ready.png",
  ];
  const videoPath = join(outputDir, "phase178-preview-activation-control-walkthrough.mp4");
  const args = ["-y"];
  for (const shot of shots) args.push("-loop", "1", "-t", "3", "-i", join(outputDir, shot));
  const streams = shots
    .map((_, index) => `[${index}:v]scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:color=#e2e8f0,setsar=1[v${index}]`)
    .join(";");
  const inputs = shots.map((_, index) => `[v${index}]`).join("");
  args.push(
    "-filter_complex",
    `${streams};${inputs}concat=n=${shots.length}:v=1:a=0[outv]`,
    "-map",
    "[outv]",
    "-r",
    "30",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    videoPath,
  );
  const video = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (video.status !== 0) throw new Error(`FFmpeg walkthrough render failed: ${video.stderr}`);

  const probe = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration,size:stream=codec_name,width,height,avg_frame_rate", "-of", "json", videoPath],
    { encoding: "utf8" },
  );
  if (probe.status !== 0) throw new Error(`FFprobe validation failed: ${probe.stderr}`);
  const videoEvidence = JSON.parse(probe.stdout);
  const videoStream = videoEvidence.streams?.[0];
  if (videoStream?.codec_name !== "h264" || videoStream?.width !== 1440 || videoStream?.height !== 900) {
    throw new Error(`Unexpected video encoding: ${probe.stdout}`);
  }
  await writeFile(join(outputDir, "video-evidence.json"), `${JSON.stringify(videoEvidence, null, 2)}\n`);

  console.log("Rendered phase178-preview-activation-control-walkthrough.mp4");
  console.log("Live Convex execution: 0");
  console.log("External application requests: 0");
  socket.close();
} finally {
  chrome.kill("SIGTERM");
  server.kill("SIGTERM");
}
