import { spawn } from "node:child_process";
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
    await send("Page.navigate", { url });
    await new Promise((resolveWait) => setTimeout(resolveWait, 1000));
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

  await send("Page.enable");
  await send("Runtime.enable");

  for (const shot of [
    { name: "01-desktop-hero.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises`, width: 1280, height: 720 },
    { name: "02-desktop-capabilities.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises`, width: 1280, height: 720, selector: "#capabilities" },
    { name: "03-desktop-proof.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises`, width: 1280, height: 720, selector: "#proof" },
    { name: "04-mobile-hero.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises`, width: 390, height: 844 },
    { name: "05-mobile-capabilities.png", url: `${baseUrl}/kinflo-sites/vanguard-enterprises`, width: 390, height: 844, selector: "#capabilities" },
    { name: "06-admin-parity-readiness.png", url: `${baseUrl}/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`, width: 1280, height: 720, selector: "#vanguard-source-parity-readiness", selectorBlock: "center" },
  ]) {
    await capture(shot);
    console.log(`Captured ${shot.name}`);
  }

  socket.close();
} finally {
  chrome.kill("SIGTERM");
}

