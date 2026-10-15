import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5177";
const outputDir = resolve("docs/qa/kinflo-home-recovery");
const debugPort = 9272;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-home-recovery-"));

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

  const evaluate = (expression) => send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  const setViewport = (width, height) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });

  async function navigate(path) {
    await send("Page.navigate", { url: `${baseUrl}${path}` });
    await new Promise((resolveWait) => setTimeout(resolveWait, 900));
  }

  async function waitForSelector(selector, attempts = 80) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const found = await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`);
      if (found.result?.value) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    throw new Error(`Timed out waiting for ${selector}`);
  }

  async function capture(name) {
    const overflow = await evaluate(`({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })`);
    if (overflow.result?.value?.clientWidth !== overflow.result?.value?.scrollWidth) {
      throw new Error(`${name} has horizontal overflow: ${JSON.stringify(overflow.result?.value)}`);
    }
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
    console.log(`Captured ${name}`);
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await setViewport(1440, 900);
  await navigate("/");
  await waitForSelector('[data-testid="home-loading-state"]');
  await capture("01-root-recovery-desktop.png");

  await evaluate(`document.querySelector('a[href="/kinflo-sites/vanguard-enterprises"]')?.click()`);
  await waitForSelector('[data-kinflo-palette="reversr-vanguard"]');
  await capture("02-vanguard-destination-desktop.png");

  await setViewport(390, 844);
  await navigate("/");
  await waitForSelector('[data-testid="home-loading-state"]');
  await capture("03-root-recovery-mobile.png");

  const videoPath = join(outputDir, "kinflo-home-recovery-walkthrough.mp4");
  const shots = [
    "01-root-recovery-desktop.png",
    "02-vanguard-destination-desktop.png",
    "03-root-recovery-mobile.png",
  ];
  const args = ["-y"];
  for (const shot of shots) args.push("-loop", "1", "-t", "2.8", "-i", join(outputDir, shot));
  const streams = shots.map((_, index) => `[${index}:v]scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:color=#f8fafc,setsar=1[v${index}]`).join(";");
  const inputs = shots.map((_, index) => `[v${index}]`).join("");
  args.push("-filter_complex", `${streams};${inputs}concat=n=${shots.length}:v=1:a=0[outv]`, "-map", "[outv]", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath);
  const video = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (video.status !== 0) throw new Error(`FFmpeg walkthrough render failed: ${video.stderr}`);
  console.log("Rendered kinflo-home-recovery-walkthrough.mp4");
  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
