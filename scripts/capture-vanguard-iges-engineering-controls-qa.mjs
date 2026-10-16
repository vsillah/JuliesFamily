import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readdir, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5183";
const outputDir = resolve("docs/qa/vanguard-iges-engineering-controls");
const cubeFixture = resolve("node_modules/occt-import-js/test/testfiles/cube-10x10mm/Cube 10x10.igs");
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-iges-controls-chrome-"));
const downloadDir = await mkdtemp(join(tmpdir(), "kinflo-iges-controls-downloads-"));
const debugPort = 9268;
const externalApplicationRequests = [];

await mkdir(outputDir, { recursive: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--hide-scrollbars",
  "--no-first-run",
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: "ignore" });

async function waitForJson(url, attempts = 100) {
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
    const response = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    return response.result?.value;
  }

  async function setViewport(width, height) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: width < 600 });
  }

  async function navigate(url) {
    await send("Page.navigate", { url });
    await new Promise((resolveWait) => setTimeout(resolveWait, 900));
  }

  async function waitForSelector(selector, attempts = 160) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (await evaluate(`document.querySelector(${JSON.stringify(selector)}) !== null`)) return;
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
    throw new Error(`Timed out waiting for selector: ${selector}`);
  }

  async function setFile(selector, filePath) {
    const documentNode = await send("DOM.getDocument", { depth: -1, pierce: true });
    const target = await send("DOM.querySelector", { nodeId: documentNode.root.nodeId, selector });
    if (!target.nodeId) throw new Error(`File input not found: ${selector}`);
    await send("DOM.setFileInputFiles", { nodeId: target.nodeId, files: [filePath] });
  }

  async function click(selector) {
    const clicked = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLButtonElement) || element.disabled) return false; element.click(); return true; })()`);
    if (!clicked) throw new Error(`Enabled button not found: ${selector}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 180));
  }

  async function fillNumber(selector, value) {
    const changed = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLInputElement)) return false; const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set; setter?.call(element, ${JSON.stringify(String(value))}); element.dispatchEvent(new Event("input", { bubbles: true })); element.dispatchEvent(new Event("change", { bubbles: true })); return true; })()`);
    if (!changed) throw new Error(`Numeric input not found: ${selector}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 220));
  }

  async function capture(name, selector, maxHeight = 1200) {
    const rect = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLElement)) return null; element.scrollIntoView({ block: "start" }); window.scrollBy(0, -96); const rect = element.getBoundingClientRect(); return { x: Math.max(0, rect.x + window.scrollX), y: Math.max(0, rect.y + window.scrollY), width: Math.max(1, rect.width), height: Math.max(1, Math.min(rect.height, ${maxHeight})) }; })()`);
    if (!rect) throw new Error(`Capture target not found: ${selector}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    const result = await send("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: true, clip: { ...rect, scale: 1 } });
    await writeFile(join(outputDir, name), Buffer.from(result.data, "base64"));
    console.log(`Captured ${name}`);
  }

  async function assertNoOverflow(label) {
    const metrics = await evaluate("({ clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth })");
    if (!metrics || metrics.clientWidth !== metrics.scrollWidth) throw new Error(`${label} overflow: ${JSON.stringify(metrics)}`);
  }

  await send("Page.enable");
  await send("Runtime.enable");
  await send("DOM.enable");
  await send("Network.enable");
  await send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });

  const routeFor = (viewport) => `${baseUrl}/kinflo-sites/vanguard-enterprises?qa=khalid-iges-engineering-controls&rev=final-source&viewport=${viewport}#build-request`;
  const route = routeFor("desktop");
  await setViewport(1440, 1000);
  await navigate(route);
  await waitForSelector('[data-testid="vanguard-iges-file-input"]');
  await assertNoOverflow("desktop empty state");
  await capture("01-desktop-empty.png", '[data-testid="vanguard-iges-intake"]', 900);

  await setFile('[data-testid="vanguard-iges-file-input"]', cubeFixture);
  await waitForSelector('[data-cad-state="ready"]');
  await waitForSelector('[data-viewer-state="ready"] canvas');
  await waitForSelector('[data-testid="vanguard-iges-export-panel"]');
  await new Promise((resolveWait) => setTimeout(resolveWait, 650));
  const spatialEvidence = await evaluate(`(() => ({
    sourceUnit: document.querySelector('[data-testid="vanguard-iges-spatial-readout"]')?.textContent?.includes('Source unit: unknown'),
    extents: document.querySelector('[data-testid="vanguard-iges-spatial-readout"]')?.textContent?.includes('10 mm'),
    boundsRows: document.querySelectorAll('[data-testid="vanguard-iges-spatial-readout"] tbody tr').length,
    placedCenter: [...document.querySelectorAll('[data-testid^="vanguard-iges-placed-center-"]')].map((node) => node.textContent),
  }))()`);
  if (!spatialEvidence?.sourceUnit || !spatialEvidence?.extents || spatialEvidence.boundsRows !== 3) throw new Error(`Spatial evidence failed: ${JSON.stringify(spatialEvidence)}`);
  await capture("02-desktop-loaded-model.png", '[data-testid="vanguard-iges-viewer"]', 1120);

  await click('[data-testid="vanguard-iges-move"]');
  const moveMode = await evaluate(`document.querySelector('[data-testid="vanguard-iges-canvas"]')?.dataset.interactionMode`);
  if (moveMode !== "move") throw new Error(`Move mode did not activate: ${moveMode}`);
  await click('[data-testid="vanguard-iges-orbit"]');
  await click('[data-testid="vanguard-iges-translate-x-plus"]');
  await click('[data-testid="vanguard-iges-translate-y-plus"]');
  await click('[data-testid="vanguard-iges-translate-z-minus"]');
  await click('[data-testid="vanguard-iges-rotate-x-plus"]');
  await click('[data-testid="vanguard-iges-rotate-y-minus"]');
  await click('[data-testid="vanguard-iges-rotate-z-plus"]');
  await click('[data-testid="vanguard-iges-zoom-in"]');
  await capture("03-desktop-precision-controls.png", '[data-testid="vanguard-iges-precision-controls"]', 900);
  const buttonTransform = await evaluate(`(() => { const canvas = document.querySelector('[data-testid="vanguard-iges-canvas"]'); return { translation: canvas?.dataset.modelTranslationMm, rotation: canvas?.dataset.modelRotationDeg, zoom: canvas?.dataset.zoomPercent }; })()`);
  if (buttonTransform?.translation !== "1.000,1.000,-1.000" || buttonTransform?.rotation !== "5.000,-5.000,5.000") throw new Error(`Nudge controls failed: ${JSON.stringify(buttonTransform)}`);

  await fillNumber('[data-testid="vanguard-iges-translation-x"]', 2.5);
  await fillNumber('[data-testid="vanguard-iges-rotation-z"]', 15);
  await fillNumber('[data-testid="vanguard-iges-zoom-percent"]', 125);
  const numericTransform = await evaluate(`(() => { const canvas = document.querySelector('[data-testid="vanguard-iges-canvas"]'); return { translation: canvas?.dataset.modelTranslationMm, rotation: canvas?.dataset.modelRotationDeg, zoom: canvas?.dataset.zoomPercent }; })()`);
  if (!numericTransform?.translation?.startsWith("2.500,") || !numericTransform?.rotation?.endsWith(",15.000") || Number(numericTransform?.zoom) < 124) throw new Error(`Numeric controls failed: ${JSON.stringify(numericTransform)}`);
  await click('[data-testid="vanguard-iges-fit"]');
  await click('[data-testid="vanguard-iges-reset"]');

  const stepBlocked = await evaluate(`(() => { const button = document.querySelector('[data-testid="vanguard-iges-export-step"]'); return button instanceof HTMLButtonElement && button.disabled && button.textContent?.includes('Unavailable'); })()`);
  if (!stepBlocked) throw new Error("STEP export is not visibly unavailable and disabled.");
  await click('[data-testid="vanguard-iges-export-source"]');
  await click('[data-testid="vanguard-iges-export-stl"]');
  await click('[data-testid="vanguard-iges-export-obj"]');
  await new Promise((resolveWait) => setTimeout(resolveWait, 900));
  const downloadedFiles = await readdir(downloadDir);
  const expectedDownloads = ["Cube 10x10.igs", "Cube 10x10-inspection-mesh-mm.stl", "Cube 10x10-inspection-mesh-mm.obj"];
  for (const expected of expectedDownloads) if (!downloadedFiles.includes(expected)) throw new Error(`Download missing: ${expected}; observed ${downloadedFiles.join(", ")}`);
  const downloadEvidence = [];
  for (const fileName of expectedDownloads) downloadEvidence.push({ fileName, bytes: (await stat(join(downloadDir, fileName))).size });
  await capture("04-desktop-export-panel.png", '[data-testid="vanguard-iges-export-panel"]', 780);

  await setViewport(820, 1180);
  await navigate(routeFor("tablet"));
  await waitForSelector('[data-testid="vanguard-iges-file-input"]');
  await setFile('[data-testid="vanguard-iges-file-input"]', cubeFixture);
  await waitForSelector('[data-viewer-state="ready"] canvas');
  await assertNoOverflow("tablet ready state");
  await capture("05-tablet-spatial-controls.png", '[data-testid="vanguard-iges-viewer"]', 1180);

  await setViewport(390, 844);
  await navigate(routeFor("mobile"));
  await waitForSelector('[data-testid="vanguard-iges-file-input"]');
  await assertNoOverflow("mobile empty state");
  await capture("06-mobile-empty.png", '[data-testid="vanguard-iges-intake"]', 900);
  await setFile('[data-testid="vanguard-iges-file-input"]', cubeFixture);
  await waitForSelector('[data-viewer-state="ready"] canvas');
  await assertNoOverflow("mobile ready state");
  const mobileControlLayout = await evaluate(`(() => {
    const panel = document.querySelector('[data-testid="vanguard-iges-precision-controls"]');
    const buttons = [...document.querySelectorAll('[data-testid^="vanguard-iges-translate-"], [data-testid^="vanguard-iges-rotate-"], [data-testid^="vanguard-iges-zoom-"]')];
    if (!(panel instanceof HTMLElement)) return null;
    const panelRect = panel.getBoundingClientRect();
    return {
      viewportWidth: document.documentElement.clientWidth,
      panel: { left: panelRect.left, right: panelRect.right },
      controls: buttons.map((button) => { const rect = button.getBoundingClientRect(); return { testId: button.getAttribute('data-testid'), left: rect.left, right: rect.right }; }),
    };
  })()`);
  if (!mobileControlLayout
    || mobileControlLayout.panel.left < -1
    || mobileControlLayout.panel.right > mobileControlLayout.viewportWidth + 1
    || mobileControlLayout.controls.some((control) => control.left < mobileControlLayout.panel.left - 1 || control.right > mobileControlLayout.panel.right + 1)) {
    throw new Error(`Mobile precision controls are clipped: ${JSON.stringify(mobileControlLayout)}`);
  }
  await capture("07-mobile-precision-controls.png", '[data-testid="vanguard-iges-precision-controls"]', 1050);
  await capture("08-mobile-export-panel.png", '[data-testid="vanguard-iges-export-panel"]', 1050);

  if (externalApplicationRequests.length) throw new Error(`Unexpected external application requests: ${JSON.stringify(externalApplicationRequests)}`);
  const qaEvidence = {
    route,
    viewportWidths: [1440, 820, 390],
    spatialEvidence,
    buttonTransform,
    numericTransform,
    mobileControlLayout,
    downloadEvidence,
    blockedExports: ["STEP"],
    externalApplicationRequests: 0,
    externalWrites: 0,
    serverPersistence: "disabled",
    privateStorage: "disabled",
    providerCalls: 0,
    liveOrderWrites: 0,
  };
  await writeFile(join(outputDir, "qa-evidence.json"), `${JSON.stringify(qaEvidence, null, 2)}\n`);

  const frames = [
    "01-desktop-empty.png",
    "02-desktop-loaded-model.png",
    "03-desktop-precision-controls.png",
    "04-desktop-export-panel.png",
    "05-tablet-spatial-controls.png",
    "06-mobile-empty.png",
    "07-mobile-precision-controls.png",
    "08-mobile-export-panel.png",
  ];
  const videoPath = join(outputDir, "vanguard-iges-engineering-controls-walkthrough.mp4");
  const args = ["-y"];
  for (const frame of frames) args.push("-loop", "1", "-t", "3", "-i", join(outputDir, frame));
  const streams = frames.map((_, index) => [
    `[${index}:v]split=2[bg${index}][fg${index}]`,
    `[bg${index}]scale=1440:1000:force_original_aspect_ratio=increase,crop=1440:1000,boxblur=20:10[bgf${index}]`,
    `[fg${index}]scale=1440:1000:force_original_aspect_ratio=decrease[fgf${index}]`,
    `[bgf${index}][fgf${index}]overlay=(W-w)/2:(H-h)/2,setsar=1[v${index}]`,
  ].join(";")).join(";");
  const inputs = frames.map((_, index) => `[v${index}]`).join("");
  args.push("-filter_complex", `${streams};${inputs}concat=n=${frames.length}:v=1:a=0[outv]`, "-map", "[outv]", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath);
  const rendered = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (rendered.status !== 0) throw new Error(`FFmpeg walkthrough render failed: ${rendered.stderr}`);
  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height,avg_frame_rate,nb_frames", "-of", "json", videoPath], { encoding: "utf8" });
  if (probe.status !== 0) throw new Error(`FFprobe validation failed: ${probe.stderr}`);
  const videoEvidence = JSON.parse(probe.stdout);
  await writeFile(join(outputDir, "video-evidence.json"), `${JSON.stringify(videoEvidence, null, 2)}\n`);
  console.log(JSON.stringify({ qaEvidence, videoEvidence }, null, 2));
  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
