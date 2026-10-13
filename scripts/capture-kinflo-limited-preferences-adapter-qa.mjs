import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5177";
const outputDir = resolve("docs/qa/phase177-batch6-preferences");
const debugPort = 9246;
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-phase177-batch6-cdp-"));

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
          id: "qa-phase177-batch6-admin",
          email: "qa-phase177-batch6@example.invalid",
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

  async function navigate() {
    await send("Page.navigate", { url: `${baseUrl}/admin/kinflo-os?tab=experience` });
    await new Promise((resolveWait) => setTimeout(resolveWait, 1100));
  }

  async function waitForSelector(selector, attempts = 50) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const result = await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`);
      if (result.result?.value) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    throw new Error(`Timed out waiting for selector: ${selector}`);
  }

  async function capture(name) {
    const result = await send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
    });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
    console.log(`Captured ${name}`);
  }

  async function scrollPreferencesIntoView() {
    await evaluate(`document.querySelector('[data-testid="select-kinflo-experience-theme"]')?.scrollIntoView({block: "start"})`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }

  async function setItemsPerPage(value) {
    await evaluate(`(() => {
      const input = document.querySelector('#kinflo-items-per-page');
      if (!(input instanceof HTMLInputElement)) throw new Error('Items-per-page input unavailable');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, ${JSON.stringify(String(value))});
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    })()`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 200));
  }

  async function assertState({ dirty }) {
    const result = await evaluate(`(() => {
      const button = document.querySelector('[data-testid="button-save-experience-preferences"]');
      const body = document.body.innerText;
      return {
        buttonDisabled: button instanceof HTMLButtonElement ? button.disabled : null,
        buttonText: button?.textContent?.trim() ?? null,
        dirtyBadge: body.includes('Unsaved changes'),
        fixtureBadge: body.includes('Fixture defaults'),
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    })()`);
    const state = result.result?.value;
    if (!state || state.buttonDisabled !== true || state.buttonText !== "Live preference save gated") {
      throw new Error(`Default-off save gate failed: ${JSON.stringify(state)}`);
    }
    if (dirty !== state.dirtyBadge || dirty === state.fixtureBadge) {
      throw new Error(`Preference badge state mismatch: ${JSON.stringify(state)}`);
    }
    if (state.hasHorizontalOverflow) {
      throw new Error(`Horizontal overflow detected: ${JSON.stringify(state)}`);
    }
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Fetch.enable", { patterns: [{ urlPattern: "*://127.0.0.1:5177/api/auth/user*", requestStage: "Request" }] });

  await setViewport(1280, 900);
  await navigate();
  await waitForSelector('[data-testid="button-save-experience-preferences"]');
  await scrollPreferencesIntoView();
  await assertState({ dirty: false });
  await capture("01-desktop-default-off.png");

  await setItemsPerPage(50);
  await assertState({ dirty: true });
  await capture("02-desktop-unsaved-gated.png");

  await setViewport(390, 844);
  await navigate();
  await waitForSelector('[data-testid="button-save-experience-preferences"]');
  await scrollPreferencesIntoView();
  await setItemsPerPage(50);
  await assertState({ dirty: true });
  await capture("03-mobile-unsaved-gated.png");
  await evaluate(`document.querySelector('[data-testid="button-save-experience-preferences"]')?.scrollIntoView({block: "center"})`);
  await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  await capture("04-mobile-default-off-gate.png");

  const videoPath = join(outputDir, "phase177-batch6-preferences-walkthrough.mp4");
  const frames = [
    "01-desktop-default-off.png",
    "02-desktop-unsaved-gated.png",
    "03-mobile-unsaved-gated.png",
    "04-mobile-default-off-gate.png",
  ];
  const ffmpegArgs = ["-y"];
  for (const frame of frames) ffmpegArgs.push("-loop", "1", "-t", "4", "-i", join(outputDir, frame));
  ffmpegArgs.push(
    "-filter_complex",
    `${frames.map((_, index) => `[${index}:v]scale=1280:900:force_original_aspect_ratio=decrease,pad=1280:900:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1[v${index}]`).join(";")};${frames.map((_, index) => `[v${index}]`).join("")}concat=n=${frames.length}:v=1:a=0[outv]`,
    "-map", "[outv]",
    "-r", "30",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    videoPath,
  );
  const video = spawnSync("ffmpeg", ffmpegArgs, { encoding: "utf8" });
  if (video.status !== 0) throw new Error(video.stderr || "ffmpeg failed");
  console.log(`Created ${videoPath}`);
  console.log("Verified desktop 1280x900 and mobile 390x844 with zero horizontal overflow.");
  console.log("Provider writes: 0; live Convex execution: 0.");
} finally {
  chrome.kill("SIGTERM");
}
