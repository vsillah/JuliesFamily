import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5177";
const outputDir = resolve("docs/qa/vanguard-order-portal");
const debugPort = 9239;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-vanguard-order-portal-cdp-"));

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

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method === "Fetch.requestPaused" && syntheticAdminAuthEnabled) {
      const requestUrl = message.params?.request?.url ?? "";
      if (requestUrl.includes("/api/auth/user")) {
        const body = Buffer.from(JSON.stringify({
          id: "qa-vanguard-admin",
          email: "qa-vanguard-admin@example.invalid",
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
    await new Promise((resolveWait) => setTimeout(resolveWait, 950));
  }

  async function click(selector, wait = 200) {
    const result = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!(element instanceof HTMLElement)) return false;
      element.click();
      return true;
    })()`);
    if (!result.result?.value) throw new Error(`Clickable element not found: ${selector}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, wait));
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

  async function capture({ name, selector, selectorBlock = "start", clipSelector }) {
    if (selector) {
      await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block: ${JSON.stringify(selectorBlock)}})`);
      await new Promise((resolveWait) => setTimeout(resolveWait, 220));
    }
    let clip;
    if (clipSelector) {
      const box = await evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(clipSelector)});
        if (!(element instanceof HTMLElement)) return null;
        const rect = element.getBoundingClientRect();
        return { x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height, scale: 1 };
      })()`);
      clip = box.result?.value;
      if (!clip) throw new Error(`Clip element not found: ${clipSelector}`);
    }
    const result = await send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: Boolean(clip),
      fromSurface: true,
      ...(clip ? { clip } : {}),
    });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
    console.log(`Captured ${name}`);
  }

  async function waitForSelector(selector, attempts = 50) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const result = await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`);
      if (result.result?.value) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    throw new Error(`Timed out waiting for selector: ${selector}`);
  }

  async function prepareReceiptAndOpenPortal(width, height) {
    await setViewport(width, height);
    await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises#build-request`);
    await click('[data-testid="vanguard-intake-source-package"] button');
    await click('[data-testid="vanguard-intake-step-request-goal"]');
    await setTextarea("#vanguard-reversr-goal", "Rebuild the worn mounting bracket from the available drawing and measurements for a stainless steel manufacturing handoff.");
    await click('[data-testid="vanguard-intake-step-discipline"]');
    await click('[data-testid="vanguard-intake-discipline"] button');
    await click('[data-testid="vanguard-intake-step-constraints"]');
    await setTextarea("#vanguard-reversr-constraint-notes", "Target material is stainless steel; no other constraints are known yet.");
    await click('[data-testid="vanguard-intake-step-readiness"]');
    await click('[data-testid="vanguard-generate-local-receipt"]');
    const receipt = await evaluate('document.body.innerText.includes("VE-RRB-PREVIEW")');
    if (!receipt.result?.value) throw new Error("VE-RRB-PREVIEW receipt was not rendered.");
    await capture({ name: width < 600 ? "05-mobile-local-receipt.png" : "01-desktop-local-receipt.png", selector: '[data-testid="vanguard-build-request-receipt"]', selectorBlock: "center" });
    await click('[data-testid="vanguard-continue-to-order-portal"]', 850);
    const portal = await evaluate('document.querySelector(\'[data-testid="vanguard-order-portal"]\') !== null');
    if (!portal.result?.value) throw new Error("Secure order portal did not render after receipt handoff.");
    await click('[data-testid="vanguard-order-review-transfer"]');
  }

  async function assertNoOverflow() {
    const layout = await evaluate(`({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    })`);
    const metrics = layout.result?.value;
    if (!metrics || metrics.clientWidth !== metrics.scrollWidth) throw new Error(`Mobile overflow detected: ${JSON.stringify(metrics)}`);
  }

  await send("Page.enable");
  await send("Runtime.enable");

  await prepareReceiptAndOpenPortal(1280, 820);
  await capture({ name: "02-desktop-transfer-review.png", selector: '[data-testid="vanguard-order-transfer-review"]' });
  await capture({ name: "03-desktop-tracking.png", selector: '[data-testid="vanguard-order-tracking-preview"]' });

  syntheticAdminAuthEnabled = true;
  await send("Fetch.enable", { patterns: [{ urlPattern: "*://127.0.0.1:5177/api/auth/user*", requestStage: "Request" }] });
  await evaluate('window.sessionStorage.setItem("julies-persona-modal-shown", "true")');
  await navigate(`${baseUrl}/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`);
  await waitForSelector('[data-testid="section-kinflo-vanguard-order-portal-handoff"]');
  await capture({
    name: "04-admin-order-portal-handoff.png",
    selector: '[data-testid="section-kinflo-vanguard-order-portal-handoff"]',
    selectorBlock: "center",
    clipSelector: '[data-testid="section-kinflo-vanguard-order-portal-handoff"]',
  });
  await send("Fetch.disable");
  syntheticAdminAuthEnabled = false;

  await prepareReceiptAndOpenPortal(390, 844);
  await assertNoOverflow();
  await capture({ name: "06-mobile-transfer-review.png", selector: '[data-testid="vanguard-order-transfer-review"]' });
  await capture({ name: "07-mobile-tracking.png", selector: '[data-testid="vanguard-order-tracking-preview"]' });

  const videoPath = join(outputDir, "vanguard-order-portal-walkthrough.mp4");
  const videoFrames = [
    "01-desktop-local-receipt.png",
    "02-desktop-transfer-review.png",
    "03-desktop-tracking.png",
    "04-admin-order-portal-handoff.png",
    "05-mobile-local-receipt.png",
    "06-mobile-transfer-review.png",
    "07-mobile-tracking.png",
  ];
  const ffmpegArgs = ["-y"];
  for (const frame of videoFrames) ffmpegArgs.push("-loop", "1", "-t", "2.75", "-i", join(outputDir, frame));
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
  console.log("Rendered vanguard-order-portal-walkthrough.mp4");

  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
