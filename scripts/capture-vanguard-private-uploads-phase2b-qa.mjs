import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5178";
const outputDir = resolve("docs/qa/vanguard-private-uploads-phase2b");
const sourcePath = resolve("node_modules/occt-import-js/test/testfiles/cube-10x10mm/Cube 10x10.igs");
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-phase2b-chrome-"));
const debugPort = 9263;
const externalApplicationRequests = [];
await mkdir(outputDir, { recursive: true });

const sourceBytes = await readFile(sourcePath);
const sourceStat = await stat(sourcePath);
const digestSha256 = createHash("sha256").update(sourceBytes).digest("hex");
const receipt = {
  schemaVersion: 1,
  receiptId: "VE-RRB-PREVIEW",
  source: "vanguard-reversr-embedded-intake",
  persistence: "session_local",
  sourcePackage: ["CAD or 3D model"],
  goal: "Rebuild this verified 10 mm reference cube as a bounded engineering-review request.",
  discipline: "Rebuild engineering",
  constraints: ["Fit, tolerance, or critical dimensions"],
  engineeringReview: {
    schemaVersion: 1,
    status: "engineering_review_only",
    fileName: "Cube 10x10.igs",
    sourceBytes: sourceStat.size,
    meshCount: 1,
    vertexCount: 24,
    triangleCount: 12,
    boundingBoxMm: [10, 10, 10],
    digestSha256,
    receiptId: `VE-IGES-${digestSha256.slice(0, 12).toUpperCase()}`,
  },
};

const chrome = spawn(chromePath, [
  "--headless=new",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--hide-scrollbars",
  "--no-first-run",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: "ignore" });

async function waitForJson(url, attempts = 80) {
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
let socket;

try {
  const pages = await waitForJson(`http://127.0.0.1:${debugPort}/json`);
  const page = pages.find((item) => item.type === "page");
  if (!page?.webSocketDebuggerUrl) throw new Error("No debuggable Chrome page was found.");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolveOpen, rejectOpen) => {
    socket.addEventListener("open", resolveOpen, { once: true });
    socket.addEventListener("error", rejectOpen, { once: true });
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Network.requestWillBeSent") {
      const url = message.params?.request?.url;
      if (typeof url === "string" && /^https?:/.test(url) && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) {
        const observed = { url, method: message.params?.request?.method, type: message.params?.type };
        if (observed.method !== "GET" || ["Fetch", "XHR", "WebSocket"].includes(observed.type)) externalApplicationRequests.push(observed);
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
  async function evaluate(expression) {
    const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    return response.result?.value;
  }
  async function waitForSelector(selector, attempts = 140) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`)) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    throw new Error(`Timed out waiting for selector: ${selector}`);
  }
  async function setViewport(width, height) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  }
  async function navigate(url) {
    await send("Page.navigate", { url });
    await new Promise((resolveWait) => setTimeout(resolveWait, 800));
  }
  async function click(selector) {
    const clicked = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLElement)) return false; element.click(); return true; })()`);
    if (!clicked) throw new Error(`Clickable element not found: ${selector}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 220));
  }
  async function setFile(selector, filePath) {
    const documentNode = await send("DOM.getDocument", { depth: -1, pierce: true });
    const target = await send("DOM.querySelector", { nodeId: documentNode.root.nodeId, selector });
    if (!target.nodeId) throw new Error(`File input not found: ${selector}`);
    await send("DOM.setFileInputFiles", { nodeId: target.nodeId, files: [filePath] });
  }
  async function capture(name, selector) {
    const rect = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLElement)) return null; element.scrollIntoView({ block: "start" }); window.scrollBy(0, -90); const rect = element.getBoundingClientRect(); return { x: Math.max(0, rect.x + window.scrollX), y: Math.max(0, rect.y + window.scrollY), width: Math.max(1, rect.width), height: Math.max(1, Math.min(rect.height, 1100)) }; })()`);
    if (!rect) throw new Error(`Capture target not found: ${selector}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    const result = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: true, clip: { ...rect, scale: 1 } });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
  }
  async function assertNoOverflow(label) {
    const metrics = await evaluate("({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })");
    if (!metrics || metrics.clientWidth !== metrics.scrollWidth) throw new Error(`${label} overflow: ${JSON.stringify(metrics)}`);
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("DOM.enable");
  await send("Network.enable");
  await setViewport(1440, 1000);
  await navigate(`${baseUrl}/`);
  await evaluate(`sessionStorage.setItem("kinflo:vanguard:local-receipt:v1", ${JSON.stringify(JSON.stringify(receipt))})`);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises/orders?qa=phase2b`);
  await waitForSelector('[data-testid="vanguard-order-transfer-review"]');
  await assertNoOverflow("desktop review state");
  await capture("01-desktop-review-ready.png", '[data-testid="vanguard-order-transfer-review"]');

  await click('[data-testid="vanguard-order-promote"]');
  await waitForSelector('[data-testid="vanguard-order-private-upload"]');
  await capture("02-desktop-private-draft.png", '[data-testid="vanguard-order-auth-gate"]');

  await setFile('[data-testid="vanguard-order-private-upload-input"]', sourcePath);
  await waitForSelector('[data-testid="vanguard-order-private-upload-stored"]');
  await capture("03-desktop-source-attached.png", '[data-testid="vanguard-order-auth-gate"]');

  await setViewport(390, 844);
  await assertNoOverflow("mobile stored state");
  await capture("04-mobile-source-attached.png", '[data-testid="vanguard-order-auth-gate"]');

  if (externalApplicationRequests.length) {
    throw new Error(`Unexpected external application requests: ${JSON.stringify(externalApplicationRequests)}`);
  }
  await writeFile(join(outputDir, "network-evidence.json"), `${JSON.stringify({
    externalApplicationRequests: 0,
    externalWrites: 0,
    hostedConvexCalls: 0,
    visualMode: "device_only_review",
  }, null, 2)}\n`);

  const frames = [
    "01-desktop-review-ready.png",
    "02-desktop-private-draft.png",
    "03-desktop-source-attached.png",
    "04-mobile-source-attached.png",
  ];
  const videoPath = join(outputDir, "vanguard-private-uploads-phase2b-walkthrough.mp4");
  const args = ["-y"];
  for (const frame of frames) args.push("-loop", "1", "-t", "3.2", "-i", join(outputDir, frame));
  const filters = frames.map((_, index) => [
    `[${index}:v]split=2[bg${index}][fg${index}]`,
    `[bg${index}]scale=1440:1000:force_original_aspect_ratio=increase,crop=1440:1000,boxblur=20:10[bgf${index}]`,
    `[fg${index}]scale=1440:1000:force_original_aspect_ratio=decrease[fgf${index}]`,
    `[bgf${index}][fgf${index}]overlay=(W-w)/2:(H-h)/2,setsar=1[v${index}]`,
  ].join(";")).join(";");
  args.push(
    "-filter_complex",
    `${filters};${frames.map((_, index) => `[v${index}]`).join("")}concat=n=${frames.length}:v=1:a=0[outv]`,
    "-map", "[outv]", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath,
  );
  const rendered = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (rendered.status !== 0) throw new Error(`FFmpeg walkthrough render failed: ${rendered.stderr}`);
  const probe = spawnSync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height,avg_frame_rate,nb_frames", "-of", "json", videoPath,
  ], { encoding: "utf8" });
  if (probe.status !== 0) throw new Error(`FFprobe validation failed: ${probe.stderr}`);
  const videoEvidence = JSON.parse(probe.stdout);
  await writeFile(join(outputDir, "video-evidence.json"), `${JSON.stringify(videoEvidence, null, 2)}\n`);
} finally {
  socket?.close();
  chrome.kill("SIGTERM");
}
