import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5320";
const outputDir = resolve("docs/qa/tenant-site-composer");
const debugPort = 9284;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-tenant-site-composer-"));
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
  const wait = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms));

  async function navigate(path) {
    await send("Page.navigate", { url: `${baseUrl}${path}` });
    await wait(900);
  }

  async function waitForSelector(selector, attempts = 80) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const found = await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`);
      if (found.result?.value) return;
      await wait(100);
    }
    throw new Error(`Timed out waiting for ${selector}`);
  }

  async function capture(name) {
    const result = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
    console.log(`Captured ${name}`);
  }

  async function assertNoOverflow(label) {
    const result = await evaluate(`({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, bodyScrollWidth: document.body.scrollWidth })`);
    const value = result.result?.value;
    if (!value || value.scrollWidth !== value.clientWidth || value.bodyScrollWidth !== value.clientWidth) {
      throw new Error(`${label} has horizontal overflow: ${JSON.stringify(value)}`);
    }
    return value;
  }

  async function setTheme(mode) {
    await evaluate(`(() => {
      const trigger = document.querySelector('[data-testid="vanguard-theme-control"]');
      if (!(trigger instanceof HTMLElement)) return false;
      trigger.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" }));
      trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
      return true;
    })()`);
    await wait(80);
    await evaluate(`(() => {
      const item = document.querySelector('[data-testid="vanguard-theme-${mode}"]');
      if (!(item instanceof HTMLElement)) return false;
      item.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" }));
      item.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }));
      return true;
    })()`);
    await wait(180);
    const state = await evaluate(`document.querySelector('.kinflo-public-surface[data-kinflo-theme]')?.dataset.kinfloTheme`);
    const resolved = state.result?.value;
    if (mode !== "system" && resolved !== mode) throw new Error(`Expected ${mode} theme, got ${JSON.stringify(resolved)}`);
    if (mode === "system" && !["light", "dark"].includes(resolved)) throw new Error(`System theme did not resolve to light or dark: ${JSON.stringify(resolved)}`);
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Network.enable");

  const qaState = { viewports: {}, themes: [], navStates: [], navContrast: null, reducedMotion: null, order: null, parallax: null, debugCopy: [], externalApplicationRequests: 0 };

  await setViewport(1440, 900);
  await navigate("/kinflo-sites/vanguard-enterprises");
  await waitForSelector('.kinflo-public-surface[data-kinflo-palette="reversr-vanguard"]');
  qaState.viewports.desktop = await assertNoOverflow("public desktop");
  await setTheme("light");
  qaState.themes.push("light");
  await setTheme("dark");
  qaState.themes.push("dark");
  await setTheme("system");
  qaState.themes.push("system");
  qaState.navContrast = (await evaluate("document.querySelector('header[data-nav-contrast]')?.dataset.navContrast")).result?.value;
  const publicText = (await evaluate("document.body.innerText")).result?.value ?? "";
  qaState.debugCopy = ["convexFunction", "fixture-public-renderer", "templateKey", "reviewSource", "Public preview"].filter((token) => publicText.includes(token));
  if (qaState.debugCopy.length) throw new Error(`Public renderer exposed debug/source copy: ${qaState.debugCopy.join(", ")}`);
  await evaluate("window.scrollTo(0, 0)");
  await wait(180);
  qaState.navStates.push((await evaluate("document.querySelector('header[data-nav-state]')?.dataset.navState")).result?.value);
  await capture("01-public-vanguard-desktop.png");

  await evaluate("window.scrollTo(0, 520)");
  await wait(220);
  qaState.navStates.push((await evaluate("document.querySelector('header[data-nav-state]')?.dataset.navState")).result?.value);
  const parallax = await evaluate(`(() => {
    const hero = document.querySelector('[data-testid="public-preview-hero"]');
    const media = hero?.querySelector('.kinflo-hero-media');
    const next = hero?.nextElementSibling;
    const heroRect = hero?.getBoundingClientRect();
    const nextRect = next?.getBoundingClientRect();
    return {
      transform: media instanceof HTMLElement ? getComputedStyle(media).transform : null,
      heroBottom: heroRect?.bottom,
      nextTop: nextRect?.top,
      overlap: Boolean(heroRect && nextRect && heroRect.bottom > nextRect.top + 1),
    };
  })()`);
  qaState.parallax = parallax.result?.value;
  if (qaState.navStates[0] !== "overlay" || qaState.navStates[1] !== "solid") throw new Error(`Unexpected nav states: ${JSON.stringify(qaState.navStates)}`);
  if (qaState.parallax?.overlap) throw new Error(`Hero overlaps body content: ${JSON.stringify(qaState.parallax)}`);
  await capture("02-public-vanguard-nav-solid.png");

  await setViewport(1024, 800);
  await navigate("/kinflo-sites/vanguard-enterprises");
  qaState.viewports.tablet = await assertNoOverflow("public tablet");
  await capture("03-public-vanguard-tablet.png");

  await setViewport(390, 844);
  await navigate("/kinflo-sites/vanguard-enterprises");
  qaState.viewports.mobile = await assertNoOverflow("public mobile");
  await capture("04-public-vanguard-mobile.png");
  await setTheme("dark");
  await capture("05-public-vanguard-dark-mobile.png");

  await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await navigate("/kinflo-sites/vanguard-enterprises");
  const reducedMotion = await evaluate(`(() => {
    const media = document.querySelector('.kinflo-hero-media');
    return {
      matches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      transform: media instanceof HTMLElement ? getComputedStyle(media).transform : null,
    };
  })()`);
  qaState.reducedMotion = reducedMotion.result?.value;
  if (!qaState.reducedMotion?.matches || qaState.reducedMotion.transform !== "none") throw new Error(`Reduced-motion fallback failed: ${JSON.stringify(qaState.reducedMotion)}`);
  await capture("06-public-vanguard-reduced-motion.png");
  await send("Emulation.setEmulatedMedia", { features: [] });

  const order = await evaluate(`(() => [
    '[data-testid="public-preview-hero"]',
    '[data-testid="public-preview-services"]',
    '[data-testid="public-preview-vanguard-source-parity"]',
    '[data-testid="public-preview-vanguard-order-backbone"]',
    '[data-testid="public-preview-vanguard-workflow"]',
    '[data-testid="public-preview-vanguard-build-request"]',
  ].map((selector) => document.querySelector(selector)).map((element) => element?.getAttribute('data-testid') ?? null))()`);
  qaState.order = order.result?.value;
  const expectedOrder = [
    "public-preview-hero",
    "public-preview-services",
    "public-preview-vanguard-source-parity",
    "public-preview-vanguard-order-backbone",
    "public-preview-vanguard-workflow",
    "public-preview-vanguard-build-request",
  ];
  if (JSON.stringify(qaState.order) !== JSON.stringify(expectedOrder)) throw new Error(`Vanguard order mismatch: ${JSON.stringify(qaState.order)}`);

  await setViewport(1440, 900);
  await navigate("/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites");
  await waitForSelector('[data-testid="section-kinflo-tenant-site-composer"]');
  qaState.viewports.adminDesktop = await assertNoOverflow("admin desktop");
  await capture("07-admin-composer-desktop.png");

  await setViewport(1024, 800);
  await navigate("/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites");
  await waitForSelector('[data-testid="section-kinflo-tenant-site-composer"]');
  qaState.viewports.adminTablet = await assertNoOverflow("admin tablet");
  await capture("08-admin-composer-tablet.png");

  await setViewport(390, 844);
  await navigate("/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites");
  await waitForSelector('[data-testid="section-kinflo-tenant-site-composer"]');
  qaState.viewports.adminMobile = await assertNoOverflow("admin mobile");
  await capture("09-admin-composer-mobile.png");

  qaState.externalApplicationRequests = externalApplicationRequests.length;
  if (externalApplicationRequests.length) throw new Error(`Unexpected non-loopback application requests: ${JSON.stringify(externalApplicationRequests)}`);
  await writeFile(join(outputDir, "qa-state.json"), `${JSON.stringify(qaState, null, 2)}\n`);

  const frames = [
    "01-public-vanguard-desktop.png",
    "02-public-vanguard-nav-solid.png",
    "03-public-vanguard-tablet.png",
    "04-public-vanguard-mobile.png",
    "05-public-vanguard-dark-mobile.png",
    "06-public-vanguard-reduced-motion.png",
    "07-admin-composer-desktop.png",
    "08-admin-composer-tablet.png",
    "09-admin-composer-mobile.png",
  ];
  const videoPath = join(outputDir, "tenant-site-composer-walkthrough.mp4");
  const args = ["-y"];
  for (const frame of frames) args.push("-loop", "1", "-t", "2.4", "-i", join(outputDir, frame));
  const streams = frames.map((_, index) => `[${index}:v]scale=1440:900:force_original_aspect_ratio=decrease,pad=1440:900:(ow-iw)/2:(oh-ih)/2:color=#101827,setsar=1[v${index}]`).join(";");
  const inputs = frames.map((_, index) => `[v${index}]`).join("");
  args.push("-filter_complex", `${streams};${inputs}concat=n=${frames.length}:v=1:a=0[outv]`, "-map", "[outv]", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath);
  const video = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (video.status !== 0) throw new Error(`FFmpeg walkthrough render failed: ${video.stderr}`);
  console.log("Rendered tenant-site-composer-walkthrough.mp4");
  console.log(`QA state: ${join(outputDir, "qa-state.json")}`);
  console.log("External application requests: 0");
  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
