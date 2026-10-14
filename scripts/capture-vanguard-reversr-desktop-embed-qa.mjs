import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5177";
const outputDir = resolve("docs/qa/vanguard-reversr-desktop-embed");
const debugPort = 9254;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-vanguard-reversr-desktop-embed-"));
const externalRequests = [];
const externalApplicationRequests = [];

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
    if (message.method === "Network.requestWillBeSent") {
      const url = message.params?.request?.url;
      if (typeof url === "string" && /^https?:/.test(url) && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) {
        const observed = { url, method: message.params?.request?.method, type: message.params?.type };
        externalRequests.push(observed);
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
    return send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  }

  async function setViewport(width, height) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  }

  async function navigate(url) {
    await send("Page.navigate", { url });
    await new Promise((resolveWait) => setTimeout(resolveWait, 1100));
  }

  async function waitForSelector(selector, attempts = 60) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const result = await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`);
      if (result.result?.value) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    throw new Error(`Timed out waiting for selector: ${selector}`);
  }

  async function click(selector) {
    const result = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLElement)) return false; element.click(); return true; })()`);
    if (!result.result?.value) throw new Error(`Clickable element not found: ${selector}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 350));
  }

  async function clickByText(selector, text) {
    const result = await evaluate(`(() => { const element = [...document.querySelectorAll(${JSON.stringify(selector)})].find((node) => node.textContent?.includes(${JSON.stringify(text)})); if (!(element instanceof HTMLElement)) return false; element.click(); return true; })()`);
    if (!result.result?.value) throw new Error(`Element not found for text: ${text}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 350));
  }

  async function fillTextarea(selector, value) {
    const result = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLTextAreaElement)) return false; const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set; setter?.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
    if (!result.result?.value) throw new Error(`Textarea not found: ${selector}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 350));
  }

  async function capture(name, selector, block = "start") {
    await evaluate(`(() => { document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: ${JSON.stringify(block)} }); window.scrollBy(0, window.innerWidth < 600 ? -112 : -76); })()`);
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
  await send("Network.enable");

  await setViewport(1440, 1000);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises?qa=desktop#build-request`);
  await waitForSelector('[data-testid="vanguard-reversr-desktop-workspace"]');
  await capture("vanguard-reversr-desktop-workspace.png", '[data-testid="vanguard-reversr-intake-app"]');
  await clickByText('[data-testid="vanguard-intake-source-package"] button', "Drawing or specification");
  await capture("01-desktop-materials-selected.png", '[data-testid="vanguard-reversr-intake-app"]');

  await click('[data-testid="vanguard-intake-step-request-goal"]');
  await fillTextarea("#vanguard-reversr-goal", "Rebuild a worn stainless steel mounting bracket from the available drawing and measurements for manufacturing review.");
  await capture("02-desktop-build-requirement.png", '[data-testid="vanguard-reversr-intake-app"]');

  await click('[data-testid="vanguard-intake-step-discipline"]');
  await clickByText('[data-testid="vanguard-intake-discipline"] button', "Rebuild engineering");
  await capture("03-desktop-work-routing.png", '[data-testid="vanguard-reversr-intake-app"]');

  await click('[data-testid="vanguard-intake-step-constraints"]');
  await clickByText('[data-testid="vanguard-intake-constraints"] label', "Material or manufacturing process");
  await capture("04-desktop-constraints.png", '[data-testid="vanguard-reversr-intake-app"]');

  await click('[data-testid="vanguard-intake-step-readiness"]');
  await click('[data-testid="vanguard-generate-local-receipt"]');
  await waitForSelector('[data-testid="vanguard-build-request-receipt"]');
  await capture("05-desktop-request-handoff.png", '[data-testid="vanguard-reversr-intake-app"]');

  await setViewport(768, 900);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises?qa=tablet#build-request`);
  await waitForSelector('[data-testid="vanguard-reversr-desktop-workspace"]');
  await assertNoOverflow("tablet ReversR workspace");
  await capture("vanguard-reversr-tablet-workspace.png", '[data-testid="vanguard-reversr-intake-app"]');

  await setViewport(390, 844);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises?qa=mobile#build-request`);
  await waitForSelector('[data-testid="vanguard-reversr-desktop-workspace"]');
  await assertNoOverflow("mobile ReversR workspace");
  await capture("vanguard-reversr-mobile-workspace.png", '[data-testid="vanguard-reversr-intake-app"]');

  if (externalApplicationRequests.length) throw new Error(`Unexpected non-loopback application requests: ${JSON.stringify(externalApplicationRequests)}`);
  await writeFile(join(outputDir, "network-evidence.json"), `${JSON.stringify({ externalApplicationRequests: 0, externalWrites: 0, passivePageDependencies: externalRequests }, null, 2)}\n`);

  const videoPath = join(outputDir, "vanguard-reversr-desktop-embed-walkthrough.mp4");
  const frames = [
    "vanguard-reversr-desktop-workspace.png",
    "01-desktop-materials-selected.png",
    "02-desktop-build-requirement.png",
    "03-desktop-work-routing.png",
    "04-desktop-constraints.png",
    "05-desktop-request-handoff.png",
    "vanguard-reversr-tablet-workspace.png",
    "vanguard-reversr-mobile-workspace.png",
  ];
  const args = ["-y"];
  for (const frame of frames) args.push("-loop", "1", "-t", "2.6", "-i", join(outputDir, frame));
  const streams = frames.map((_, index) => `[${index}:v]scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1[v${index}]`).join(";");
  const inputs = frames.map((_, index) => `[v${index}]`).join("");
  args.push("-filter_complex", `${streams};${inputs}concat=n=${frames.length}:v=1:a=0[outv]`, "-map", "[outv]", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath);
  const video = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (video.status !== 0) throw new Error(`FFmpeg walkthrough render failed: ${video.stderr}`);
  console.log("Rendered vanguard-reversr-desktop-embed-walkthrough.mp4");
  console.log("External application requests: 0");
  console.log(`Passive page dependencies observed: ${externalRequests.length}`);
  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
