import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5177";
const outputDir = resolve("docs/qa/kinflo-tenant-palettes");
const debugPort = 9271;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-tenant-palettes-"));
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
      const method = message.params?.request?.method;
      const type = message.params?.type;
      if (typeof url === "string" && /^https?:/.test(url) && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) {
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
    await new Promise((resolveWait) => setTimeout(resolveWait, 1200));
  }

  async function waitForSelector(selector, attempts = 80) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const found = await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`);
      if (found.result?.value) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    const state = await evaluate(`({ path: location.pathname, text: document.body.innerText.slice(0, 600) })`);
    throw new Error(`Timed out waiting for ${selector}: ${JSON.stringify(state.result?.value)}`);
  }

  async function capture(name) {
    const overflow = await evaluate(`({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })`);
    if (overflow.result?.value?.clientWidth !== overflow.result?.value?.scrollWidth) throw new Error(`${name} has horizontal overflow: ${JSON.stringify(overflow.result?.value)}`);
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
    console.log(`Captured ${name}`);
  }

  async function assertPalette(expectedId) {
    const state = await evaluate(`(() => {
      const root = document.querySelector('[data-kinflo-palette]');
      if (!(root instanceof HTMLElement)) return null;
      const style = getComputedStyle(root);
      return {
        id: root.dataset.kinfloPalette,
        mode: root.dataset.kinfloTheme,
        background: style.getPropertyValue('--kinflo-background').trim(),
        accent: style.getPropertyValue('--kinflo-accent').trim(),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    })()`);
    const value = state.result?.value;
    if (!value || value.id !== expectedId || !value.background || !value.accent || value.overflow) {
      throw new Error(`Palette assertion failed for ${expectedId}: ${JSON.stringify(value)}`);
    }
  }

  async function setVanguardTheme(mode) {
    await waitForSelector(`[data-testid="vanguard-theme-${mode}"]`);
    await evaluate(`document.querySelector('[data-testid="vanguard-theme-${mode}"]')?.click()`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 350));
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  await setViewport(1440, 900);
  await navigate("/kinflo-sites/julies-family");
  await waitForSelector('[data-kinflo-palette="kinflo-default"]');
  await assertPalette("kinflo-default");
  await capture("01-kinflo-default-desktop.png");

  await navigate("/kinflo-sites/advisor-client-site");
  await waitForSelector('[data-kinflo-palette="professional-neutral"]');
  await assertPalette("professional-neutral");
  await capture("02-professional-neutral-desktop.png");

  await navigate("/kinflo-sites/vanguard-enterprises");
  await waitForSelector('[data-kinflo-palette="reversr-vanguard"]');
  await setVanguardTheme("light");
  await assertPalette("reversr-vanguard");
  await capture("03-reversr-vanguard-light-desktop.png");

  await setViewport(390, 844);
  await setVanguardTheme("dark");
  await evaluate(`document.querySelector('#order-journey')?.scrollIntoView({ block: 'start' }); window.scrollBy(0, -92)`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  await assertPalette("reversr-vanguard");
  await capture("04-reversr-vanguard-dark-mobile.png");

  await setViewport(1440, 900);
  await navigate("/admin/kinflo-os?tab=brand");
  await waitForSelector('[data-testid="select-kinflo-brand-palette"]');
  await evaluate(`document.querySelector('[data-testid="select-kinflo-brand-site"]')?.click()`);
  await waitForSelector('[role="option"]');
  const selectedVanguard = await evaluate(`(() => {
    const option = [...document.querySelectorAll('[role="option"]')].find((element) => element.textContent?.includes('Vanguard Enterprises'));
    if (!(option instanceof HTMLElement)) return false;
    option.click();
    return true;
  })()`);
  if (!selectedVanguard.result?.value) throw new Error("Vanguard site option was not available in Brand Theme Studio.");
  await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  await evaluate(`document.querySelector('[data-testid="select-kinflo-brand-palette"]')?.scrollIntoView({ block: 'center' })`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  const adminState = await evaluate(`(() => ({
    hasAssignment: Boolean(document.querySelector('[data-testid="kinflo-tenant-palette-assignment"]')),
    hasSaveGate: document.querySelector('[data-testid="button-save-brand-theme"]') instanceof HTMLButtonElement
      && document.querySelector('[data-testid="button-save-brand-theme"]').disabled,
    paletteText: document.querySelector('[data-testid="select-kinflo-brand-palette"]')?.textContent?.trim(),
    assignmentText: document.querySelector('[data-testid="kinflo-tenant-palette-assignment"]')?.textContent?.trim(),
  }))()`);
  if (
    !adminState.result?.value?.hasAssignment
    || !adminState.result?.value?.hasSaveGate
    || !adminState.result?.value?.paletteText?.includes("ReversR Industrial")
    || !adminState.result?.value?.assignmentText?.includes("vanguard-enterprises")
  ) throw new Error(`Admin palette gate failed: ${JSON.stringify(adminState.result?.value)}`);
  await capture("05-admin-brand-theme-studio.png");

  if (externalApplicationRequests.length) throw new Error(`Unexpected non-loopback application requests: ${JSON.stringify(externalApplicationRequests)}`);
  await writeFile(join(outputDir, "network-evidence.json"), `${JSON.stringify({ externalApplicationRequests: 0, externalWrites: 0 }, null, 2)}\n`);

  const shots = [
    "01-kinflo-default-desktop.png",
    "02-professional-neutral-desktop.png",
    "03-reversr-vanguard-light-desktop.png",
    "04-reversr-vanguard-dark-mobile.png",
    "05-admin-brand-theme-studio.png",
  ];
  const videoPath = join(outputDir, "kinflo-tenant-palette-walkthrough.mp4");
  const args = ["-y"];
  for (const shot of shots) args.push("-loop", "1", "-t", "2.8", "-i", join(outputDir, shot));
  const streams = shots.map((_, index) => `[${index}:v]scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:color=#101827,setsar=1[v${index}]`).join(";");
  const inputs = shots.map((_, index) => `[v${index}]`).join("");
  args.push("-filter_complex", `${streams};${inputs}concat=n=${shots.length}:v=1:a=0[outv]`, "-map", "[outv]", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath);
  const video = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (video.status !== 0) throw new Error(`FFmpeg walkthrough render failed: ${video.stderr}`);
  console.log("Rendered kinflo-tenant-palette-walkthrough.mp4");
  console.log("External application requests: 0");
  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
