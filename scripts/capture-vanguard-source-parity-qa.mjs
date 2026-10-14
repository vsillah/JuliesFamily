import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5177";
const outputDir = resolve("docs/qa/vanguard-source-parity");
const debugPort = 9237;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-vanguard-cdp-"));

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

async function waitForJson(url, attempts = 40) {
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

  async function capture({ name, url, width, height, selector, selectorBlock = "start" }) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    if (url) {
      await send("Page.navigate", { url });
      await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
    }
    if (selector) {
      await send("Runtime.evaluate", {
        expression: `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block: ${JSON.stringify(selectorBlock)}})`,
        returnByValue: true,
      });
      await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    }
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
  }

  async function evaluate(expression) {
    return send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  }

  async function click(selector) {
    await evaluate(`document.querySelector(${JSON.stringify(selector)})?.click()`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 180));
  }

  async function setTextarea(selector, value) {
    await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!(element instanceof HTMLTextAreaElement)) throw new Error("Textarea not found: ${selector}");
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value").set;
      setter.call(element, ${JSON.stringify(value)});
      element.dispatchEvent(new Event("input", { bubbles: true }));
    })()`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 120));
  }

  async function prepareReceipt(width, height) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
    await send("Page.navigate", { url: `${baseUrl}/kinflo-sites/vanguard-enterprises#build-request` });
    await new Promise((resolveWait) => setTimeout(resolveWait, 900));
    await click('[data-testid="vanguard-intake-source-package"] button');
    await click('[data-testid="vanguard-intake-step-request-goal"]');
    await setTextarea("#vanguard-reversr-goal", "Rebuild the worn mounting bracket from the available drawing and measurements for a stainless steel manufacturing handoff.");
    await click('[data-testid="vanguard-intake-step-discipline"]');
    await click('[data-testid="vanguard-intake-discipline"] button');
    await click('[data-testid="vanguard-intake-step-constraints"]');
    await setTextarea("#vanguard-reversr-constraint-notes", "Target material is stainless steel; no other constraints are known yet.");
    await click('[data-testid="vanguard-intake-step-readiness"]');
    const gate = await evaluate(`({
      disabled: document.querySelector('[data-testid="vanguard-generate-local-receipt"]')?.disabled,
      text: document.querySelector('[data-testid="vanguard-intake-readiness"]')?.innerText,
    })`);
    if (gate.result?.value?.disabled) throw new Error(`Local receipt gate remained disabled: ${gate.result.value.text}`);
    await click('[data-testid="vanguard-generate-local-receipt"]');
    const receipt = await evaluate('document.querySelector(\'[data-testid="vanguard-build-request-receipt"]\') !== null');
    if (!receipt.result?.value) throw new Error("Browser draft receipt was not rendered.");
    if (width < 600) {
      const layout = await evaluate(`(() => {
        const app = document.querySelector('[data-testid="vanguard-reversr-intake-app"]');
        const rect = app?.getBoundingClientRect();
        return {
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
          appLeft: rect?.left,
          appRight: rect?.right,
        };
      })()`);
      const metrics = layout.result?.value;
      if (!metrics || metrics.scrollWidth !== metrics.clientWidth || metrics.appLeft < 0 || metrics.appRight > metrics.clientWidth) {
        throw new Error(`Mobile receipt overflow detected: ${JSON.stringify(metrics)}`);
      }
    }
  }

  await send("Page.enable");
  await send("Runtime.enable");

  for (const shot of [
    { name: "01-desktop-hero.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises`, width: 1280, height: 720 },
    { name: "02-desktop-intake-source.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises#build-request`, width: 1280, height: 820, selector: "#build-request" },
    { name: "03-desktop-build-process.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises#build-process`, width: 1280, height: 820, selector: "#build-process" },
    { name: "04-mobile-intake-source.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises#build-request`, width: 390, height: 844, selector: "#build-request" },
    { name: "05-admin-associate-handoff.png", url: `${baseUrl}/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`, width: 1280, height: 820, selector: '[data-testid="section-kinflo-vanguard-reversr-handoff"]', selectorBlock: "center" },
    { name: "08-mobile-build-process.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises#build-process`, width: 390, height: 844, selector: "#build-process" },
    { name: "09-desktop-delivery-stages.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises#build-process`, width: 1280, height: 820, selector: '[data-testid="vanguard-operational-checks"] article:last-child', selectorBlock: "center" },
    { name: "02-desktop-capabilities.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises`, width: 1280, height: 720, selector: "#capabilities" },
    { name: "03-desktop-proof.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises`, width: 1280, height: 720, selector: "#proof" },
    { name: "06-admin-parity-readiness.png", url: `${baseUrl}/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`, width: 1280, height: 720, selector: "#vanguard-source-parity-readiness", selectorBlock: "center" },
  ]) {
    await capture(shot);
    console.log(`Captured ${shot.name}`);
  }

  await prepareReceipt(1280, 820);
  await capture({ name: "06-desktop-local-receipt.png", width: 1280, height: 820, selector: '[data-testid="vanguard-intake-readiness"]' });
  await prepareReceipt(390, 844);
  await capture({ name: "07-mobile-local-receipt.png", width: 390, height: 844, selector: '[data-testid="vanguard-intake-readiness"]' });

  const videoPath = join(outputDir, "vanguard-reversr-intake-walkthrough.mp4");
  const videoFrames = [
    "01-desktop-hero.png",
    "02-desktop-intake-source.png",
    "06-desktop-local-receipt.png",
    "03-desktop-build-process.png",
    "09-desktop-delivery-stages.png",
    "04-mobile-intake-source.png",
    "07-mobile-local-receipt.png",
    "08-mobile-build-process.png",
    "05-admin-associate-handoff.png",
  ];
  const ffmpegArgs = ["-y"];
  for (const frame of videoFrames) ffmpegArgs.push("-loop", "1", "-t", "2.5", "-i", join(outputDir, frame));
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
  console.log("Rendered vanguard-reversr-intake-walkthrough.mp4");

  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
