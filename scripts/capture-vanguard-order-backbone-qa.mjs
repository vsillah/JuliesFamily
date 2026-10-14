import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5177";
const outputDir = resolve("docs/qa/vanguard-order-backbone");
const debugPort = 9246;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-vanguard-order-backbone-"));

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

async function waitForJson(url, attempts = 60) {
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

try {
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
    return send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  }

  async function setViewport(width, height) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  }

  async function navigate(url) {
    await send("Page.navigate", { url });
    await new Promise((resolveWait) => setTimeout(resolveWait, 900));
  }

  async function waitForSelector(selector, attempts = 50) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const result = await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`);
      if (result.result?.value) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    throw new Error(`Timed out waiting for selector: ${selector}`);
  }

  async function click(selector) {
    const result = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!(element instanceof HTMLElement)) return false;
      element.click();
      return true;
    })()`);
    if (!result.result?.value) throw new Error(`Clickable element not found: ${selector}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }

  async function capture(name, selector, block = "start") {
    await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: ${JSON.stringify(block)} })`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
    console.log(`Captured ${name}`);
  }

  async function assertNoOverflow(label) {
    const result = await evaluate(`({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })`);
    const metrics = result.result?.value;
    if (!metrics || metrics.clientWidth !== metrics.scrollWidth) throw new Error(`${label} overflow: ${JSON.stringify(metrics)}`);
  }

  await send("Page.enable");
  await send("Runtime.enable");

  await setViewport(1280, 820);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises`);
  await waitForSelector('[data-testid="public-preview-vanguard-order-backbone"]');
  await capture("00-desktop-hero.png", '[data-testid="public-preview-hero"]');
  await capture("01-desktop-order-journey.png", '[data-testid="public-preview-vanguard-order-backbone"]');

  await setViewport(390, 844);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises`);
  await waitForSelector('[data-testid="vanguard-order-backed-journey-map"]');
  await assertNoOverflow("mobile order journey");
  await capture("02-mobile-order-journey.png", '[data-testid="public-preview-vanguard-order-backbone"]');

  await setViewport(1280, 820);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises`);
  await click('a[href="#build-request"]');
  await waitForSelector('[data-testid="vanguard-reversr-intake-app"]');
  await capture("03-desktop-order-request.png", '[data-testid="public-preview-vanguard-build-request"]');

  const receipt = {
    schemaVersion: 1,
    receiptId: "VE-RRB-PREVIEW",
    source: "vanguard-reversr-embedded-intake",
    persistence: "session_local",
    sourcePackage: ["Drawing or specification"],
    goal: "Rebuild a worn mounting bracket for a stainless steel manufacturing handoff.",
    discipline: "Rebuild engineering",
    constraints: ["Material or manufacturing process"],
  };
  await evaluate(`window.sessionStorage.setItem("kinflo:vanguard:local-receipt:v1", ${JSON.stringify(JSON.stringify(receipt))})`);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises/orders`);
  await waitForSelector('[data-testid="vanguard-order-portal"]');
  await click('[data-testid="vanguard-order-review-transfer"]');
  await capture("04-desktop-order-portal.png", '[data-testid="vanguard-order-portal-foundation"]');
  await capture("05-desktop-associate-support.png", '[data-testid="vanguard-order-assist-request"]');
  await capture("06-desktop-saved-order-path.png", '[data-testid="vanguard-order-tracking-preview"]');

  const videoPath = join(outputDir, "vanguard-order-backbone-walkthrough.mp4");
  const frames = [
    "00-desktop-hero.png",
    "01-desktop-order-journey.png",
    "02-mobile-order-journey.png",
    "03-desktop-order-request.png",
    "04-desktop-order-portal.png",
    "05-desktop-associate-support.png",
    "06-desktop-saved-order-path.png",
  ];
  const args = ["-y"];
  for (const frame of frames) args.push("-loop", "1", "-t", "3", "-i", join(outputDir, frame));
  const streams = frames.map((_, index) => `[${index}:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1[v${index}]`).join(";");
  const inputs = frames.map((_, index) => `[v${index}]`).join("");
  args.push(
    "-filter_complex", `${streams};${inputs}concat=n=${frames.length}:v=1:a=0[outv]`,
    "-map", "[outv]",
    "-r", "30",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    videoPath,
  );
  const video = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (video.status !== 0) throw new Error(`FFmpeg walkthrough render failed: ${video.stderr}`);
  console.log("Rendered vanguard-order-backbone-walkthrough.mp4");

  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
