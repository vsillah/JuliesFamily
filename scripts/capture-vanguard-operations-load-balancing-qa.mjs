import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5177";
const outputDir = resolve("docs/qa/vanguard-operations-load-balancing");
const debugPort = 9241;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-vanguard-operations-cdp-"));

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
    if (message.method === "Fetch.requestPaused") {
      const requestUrl = message.params?.request?.url ?? "";
      if (requestUrl.includes("/api/auth/user")) {
        const body = Buffer.from(JSON.stringify({
          id: "qa-vanguard-operations-admin",
          email: "qa-vanguard-operations@example.invalid",
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
    await new Promise((resolveWait) => setTimeout(resolveWait, 1100));
    await evaluate(`(() => {
      document.querySelectorAll(".sticky").forEach((element) => {
        if (element instanceof HTMLElement) element.style.position = "static";
      });
      document.querySelectorAll(".fixed").forEach((element) => {
        if (element instanceof HTMLElement) element.style.visibility = "hidden";
      });
    })()`);
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
    const point = await evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!(element instanceof HTMLElement)) return null;
      element.scrollIntoView({ block: "center" });
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    if (!point.result?.value) throw new Error(`Click target not found: ${selector}`);
    await send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...point.result.value });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...point.result.value });
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }

  async function clickMatchingText(selector, text) {
    const point = await evaluate(`(() => {
      const element = [...document.querySelectorAll(${JSON.stringify(selector)})].find((candidate) => candidate.textContent?.trim() === ${JSON.stringify(text)});
      if (!(element instanceof HTMLElement)) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    if (!point.result?.value) throw new Error(`Text target not found: ${selector} -> ${text}`);
    await send("Input.dispatchMouseEvent", { type: "mousePressed", button: "left", clickCount: 1, ...point.result.value });
    await send("Input.dispatchMouseEvent", { type: "mouseReleased", button: "left", clickCount: 1, ...point.result.value });
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }

  async function typeText(selector, value) {
    await click(selector);
    await send("Input.insertText", { text: value });
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }

  async function capture({ name, selector }) {
    await evaluate(`(() => {
      document.querySelectorAll(".sticky").forEach((element) => {
        if (element instanceof HTMLElement) element.style.position = "static";
      });
      document.querySelectorAll(".fixed").forEach((element) => {
        if (element instanceof HTMLElement) element.style.visibility = "hidden";
      });
    })()`);
    await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({block: "center"})`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    await evaluate(`(() => {
      const chatbotButton = document.querySelector('[data-testid="button-open-chatbot"]');
      const chatbotRoot = chatbotButton?.closest("div.fixed");
      if (chatbotRoot instanceof HTMLElement) chatbotRoot.style.display = "none";
    })()`);
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
    if (!metrics || metrics.clientWidth !== metrics.scrollWidth) throw new Error(`Horizontal overflow detected: ${JSON.stringify(metrics)}`);
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*://127.0.0.1:5177/api/auth/user*", requestStage: "Request" }] });

  const adminUrl = `${baseUrl}/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`;

  await setViewport(1280, 900);
  await evaluate('window.sessionStorage.setItem("julies-persona-modal-shown", "true")');
  await navigate(adminUrl);
  await waitForSelector('[data-testid="section-kinflo-vanguard-operations-workbench"]');
  await capture({ name: "01-desktop-operations-workbench.png", selector: '[data-testid="section-kinflo-vanguard-operations-workbench"]' });
  await click('[data-testid="kinflo-vanguard-operations-risk-filter"]');
  await clickMatchingText('[role="option"]', "At risk");
  await click('[data-testid="kinflo-vanguard-operations-state-filter"]');
  await clickMatchingText('[role="option"]', "Blocked");
  const combinedFilterCount = await evaluate('document.querySelector("[data-testid=section-kinflo-vanguard-operations-workbench]")?.querySelectorAll("[data-queue-card=true]").length ?? 0');
  if (combinedFilterCount.result?.value !== 1) throw new Error(`Combined risk/state filter returned ${combinedFilterCount.result?.value} orders instead of 1.`);
  await click('[data-testid="kinflo-vanguard-operations-clear-filters"]');
  const clearedFilterCount = await evaluate('document.querySelector("[data-testid=section-kinflo-vanguard-operations-workbench]")?.querySelectorAll("[data-queue-card=true]").length ?? 0');
  if (clearedFilterCount.result?.value !== 4) throw new Error(`Clear filters returned ${clearedFilterCount.result?.value} orders instead of 4.`);

  await setViewport(768, 900);
  await navigate(adminUrl);
  await waitForSelector('[data-testid="section-kinflo-vanguard-capacity-board"]');
  await assertNoOverflow();
  await capture({ name: "02-tablet-capacity-board.png", selector: '[data-testid="section-kinflo-vanguard-capacity-board"]' });

  await setViewport(390, 844);
  await navigate(adminUrl);
  await waitForSelector('[data-testid="kinflo-vanguard-operations-search"]');
  await capture({ name: "06-mobile-filters.png", selector: '[data-testid="section-kinflo-vanguard-operations-filters"]' });
  await typeText('[data-testid="kinflo-vanguard-operations-search"]', "VE-DEMO-1033");
  await waitForSelector('[data-testid="kinflo-vanguard-operations-order-ve-demo-1033"]');
  await assertNoOverflow();
  await capture({ name: "03-mobile-blocked-order.png", selector: '[data-testid="kinflo-vanguard-operations-order-ve-demo-1033"]' });

  await click('[data-testid="kinflo-vanguard-review-order-ve-demo-1033"]');
  await waitForSelector('[data-testid="section-kinflo-vanguard-selected-order-review"]');
  await capture({ name: "05-mobile-selected-order.png", selector: '[data-testid="section-kinflo-vanguard-selected-order-review"]' });

  await setViewport(1280, 900);
  await navigate(adminUrl);
  await waitForSelector('[data-testid="section-kinflo-vanguard-operations-gate"]');
  await capture({ name: "04-desktop-actions-gate.png", selector: '[data-testid="section-kinflo-vanguard-operations-gate"]' });

  const videoPath = join(outputDir, "vanguard-operations-load-balancing-walkthrough.mp4");
  const videoFrames = [
    "01-desktop-operations-workbench.png",
    "02-tablet-capacity-board.png",
    "03-mobile-blocked-order.png",
    "04-desktop-actions-gate.png",
    "05-mobile-selected-order.png",
    "06-mobile-filters.png",
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
  console.log("Rendered vanguard-operations-load-balancing-walkthrough.mp4");

  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
