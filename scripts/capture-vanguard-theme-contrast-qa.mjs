import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5177";
const outputDir = resolve("docs/qa/vanguard-theme-contrast");
const debugPort = 9262;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-vanguard-theme-"));
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
        const method = message.params?.request?.method;
        const type = message.params?.type;
        if (method !== "GET" || ["Fetch", "XHR", "WebSocket"].includes(type)) externalApplicationRequests.push({ url, method, type });
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
  const setViewport = (width, height) => send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });

  async function navigate(path) {
    await send("Page.navigate", { url: `${baseUrl}${path}` });
    await new Promise((resolveWait) => setTimeout(resolveWait, 1100));
  }

  async function setTheme(mode) {
    for (let attempt = 0; attempt < 80; attempt += 1) {
      const ready = await evaluate(`document.querySelector('[data-testid="vanguard-theme-${mode}"]') !== null`);
      if (ready.result?.value) break;
      if (attempt === 79) {
        const state = await evaluate(`({ path: location.pathname, title: document.title, text: document.body.innerText.slice(0, 500) })`);
        throw new Error(`Theme control not found for ${mode}: ${JSON.stringify(state.result?.value)}`);
      }
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    const result = await evaluate(`(() => { const button = document.querySelector('[data-testid="vanguard-theme-${mode}"]'); if (!(button instanceof HTMLElement)) return false; button.click(); return true; })()`);
    if (!result.result?.value) throw new Error(`Theme control not found for ${mode}.`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 300));
    const state = await evaluate(`({ stored: localStorage.getItem("kinflo:vanguard:theme:v1"), dark: document.documentElement.classList.contains("dark") })`);
    const expectedDark = mode === "dark";
    if (state.result?.value?.stored !== mode || state.result?.value?.dark !== expectedDark) throw new Error(`Theme ${mode} did not apply: ${JSON.stringify(state.result?.value)}`);
  }

  async function capture({ name, path, width, height, mode, selector }) {
    await setViewport(width, height);
    await navigate(path);
    await setTheme(mode);
    if (selector) {
      await evaluate(`document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: "start" }); window.scrollBy(0, window.innerWidth < 600 ? -110 : -72);`);
      await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    }
    const overflow = await evaluate(`({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })`);
    if (overflow.result?.value?.clientWidth !== overflow.result?.value?.scrollWidth) throw new Error(`${name} overflow: ${JSON.stringify(overflow.result?.value)}`);
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
    console.log(`Captured ${name}`);
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  const shots = [
    { name: "01-light-desktop-order-journey.png", path: "/kinflo-sites/vanguard-enterprises", width: 1440, height: 900, mode: "light", selector: "#order-journey" },
    { name: "02-light-desktop-proof.png", path: "/kinflo-sites/vanguard-enterprises", width: 1440, height: 900, mode: "light", selector: "#proof" },
    { name: "03-light-mobile-reversr.png", path: "/kinflo-sites/vanguard-enterprises", width: 390, height: 844, mode: "light", selector: "#build-request" },
    { name: "04-dark-desktop-order-journey.png", path: "/kinflo-sites/vanguard-enterprises", width: 1440, height: 900, mode: "dark", selector: "#order-journey" },
    { name: "05-dark-desktop-proof.png", path: "/kinflo-sites/vanguard-enterprises", width: 1440, height: 900, mode: "dark", selector: "#proof" },
    { name: "06-dark-mobile-reversr.png", path: "/kinflo-sites/vanguard-enterprises", width: 390, height: 844, mode: "dark", selector: "#build-request" },
    { name: "07-light-desktop-order-portal.png", path: "/kinflo-sites/vanguard-enterprises/orders", width: 1440, height: 900, mode: "light", selector: "[data-testid=\"vanguard-order-portal-foundation\"]" },
    { name: "08-dark-mobile-order-portal.png", path: "/kinflo-sites/vanguard-enterprises/orders", width: 390, height: 844, mode: "dark", selector: "[data-testid=\"vanguard-order-portal-foundation\"]" },
  ];
  for (const shot of shots) await capture(shot);

  if (externalApplicationRequests.length) throw new Error(`Unexpected non-loopback application requests: ${JSON.stringify(externalApplicationRequests)}`);
  await writeFile(join(outputDir, "network-evidence.json"), `${JSON.stringify({ externalApplicationRequests: 0, externalWrites: 0 }, null, 2)}\n`);

  const videoPath = join(outputDir, "vanguard-theme-contrast-walkthrough.mp4");
  const args = ["-y"];
  for (const shot of shots) args.push("-loop", "1", "-t", "2.8", "-i", join(outputDir, shot.name));
  const streams = shots.map((_, index) => `[${index}:v]scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1[v${index}]`).join(";");
  const inputs = shots.map((_, index) => `[v${index}]`).join("");
  args.push("-filter_complex", `${streams};${inputs}concat=n=${shots.length}:v=1:a=0[outv]`, "-map", "[outv]", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath);
  const video = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (video.status !== 0) throw new Error(`FFmpeg walkthrough render failed: ${video.stderr}`);
  console.log("Rendered vanguard-theme-contrast-walkthrough.mp4");
  console.log("External application requests: 0");
  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
