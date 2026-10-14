import { spawn, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.KINFLO_QA_BASE_URL ?? "http://127.0.0.1:5177";
const outputDir = resolve("docs/qa/vanguard-iges-phase2a");
const cubeFixture = resolve("node_modules/occt-import-js/test/testfiles/cube-10x10mm/Cube 10x10.igs");
const tempRoot = await mkdtemp(join(tmpdir(), "kinflo-iges-phase2a-"));
const userDataDir = await mkdtemp(join(tmpdir(), "kinflo-iges-chrome-"));
const malformedFixture = join(tempRoot, "Malformed Model.igs");
const unsupportedFixture = join(tempRoot, "Unsupported Model.step");
const oversizedFixture = join(tempRoot, "Oversized Model.igs");
const debugPort = 9262;
const externalApplicationRequests = [];

await mkdir(outputDir, { recursive: true });
await writeFile(malformedFixture, "This is not a strict 80-column IGES source.\n");
await writeFile(unsupportedFixture, "ISO-10303-21;\nEND-ISO-10303-21;\n");
await writeFile(oversizedFixture, Buffer.alloc(256 * 1024 + 1, 32));

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

  async function waitForSelector(selector, attempts = 120) {
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
    const clicked = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLElement)) return false; element.click(); return true; })()`);
    if (!clicked) throw new Error(`Clickable element not found: ${selector}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 180));
  }

  async function clickByText(selector, text) {
    const clicked = await evaluate(`(() => { const element = [...document.querySelectorAll(${JSON.stringify(selector)})].find((node) => node.textContent?.includes(${JSON.stringify(text)})); if (!(element instanceof HTMLElement)) return false; element.click(); return true; })()`);
    if (!clicked) throw new Error(`Element not found for text: ${text}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 180));
  }

  async function fillTextarea(selector, value) {
    const filled = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLTextAreaElement)) return false; const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set; setter?.call(element, ${JSON.stringify(value)}); element.dispatchEvent(new Event("input", { bubbles: true })); return true; })()`);
    if (!filled) throw new Error(`Textarea not found: ${selector}`);
  }

  async function capture(name, selector) {
    const rect = await evaluate(`(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!(element instanceof HTMLElement)) return null; element.scrollIntoView({ block: "start" }); window.scrollBy(0, -96); const rect = element.getBoundingClientRect(); return { x: Math.max(0, rect.x + window.scrollX), y: Math.max(0, rect.y + window.scrollY), width: Math.max(1, rect.width), height: Math.max(1, Math.min(rect.height, 1000)) }; })()`);
    if (!rect) throw new Error(`Capture target not found: ${selector}`);
    await new Promise((resolveWait) => setTimeout(resolveWait, 220));
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

  await setViewport(1440, 1000);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises?qa=iges-phase2a#build-request`);
  await waitForSelector('[data-testid="vanguard-iges-file-input"]');
  await assertNoOverflow("desktop IGES intake");
  await capture("01-desktop-empty.png", '[data-testid="vanguard-iges-intake"]');

  await setFile('[data-testid="vanguard-iges-file-input"]', cubeFixture);
  if (await evaluate('document.querySelector(\'[data-testid="vanguard-iges-intake"]\')?.getAttribute("data-cad-state") === "loading"')) {
    await capture("02-desktop-loading.png", '[data-testid="vanguard-iges-intake"]');
  }
  await waitForSelector('[data-cad-state="ready"]');
  await waitForSelector('[data-viewer-state="ready"] canvas');
  await new Promise((resolveWait) => setTimeout(resolveWait, 600));
  const canvasEvidence = await evaluate(`(() => { const canvas = document.querySelector('[data-testid="vanguard-iges-canvas"]'); if (!(canvas instanceof HTMLCanvasElement)) return null; const context = canvas.getContext("webgl2") || canvas.getContext("webgl"); const pixels = new Uint8Array(4 * canvas.width * canvas.height); context.readPixels(0, 0, canvas.width, canvas.height, context.RGBA, context.UNSIGNED_BYTE, pixels); const colors = new Set(); const stride = Math.max(4, Math.floor(pixels.length / 4000 / 4) * 4); for (let index = 0; index < pixels.length; index += stride) colors.add(pixels.slice(index, index + 3).join(",")); return { width: canvas.width, height: canvas.height, distinctColors: colors.size, dataUrlLength: canvas.toDataURL("image/png").length }; })()`);
  if (!canvasEvidence || canvasEvidence.width < 300 || canvasEvidence.height < 300 || canvasEvidence.distinctColors < 2 || canvasEvidence.dataUrlLength < 10_000) {
    throw new Error(`3D canvas is blank or undersized: ${JSON.stringify(canvasEvidence)}`);
  }
  await click('[data-testid="vanguard-iges-orbit"]');
  const orbitStart = await evaluate(`(() => { const canvas = document.querySelector('[data-testid="vanguard-iges-canvas"]'); canvas.scrollIntoView({ block: "center" }); const rect = canvas.getBoundingClientRect(); return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, camera: canvas.dataset.cameraPosition }; })()`);
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: orbitStart.x, y: orbitStart.y, button: "left", buttons: 1, clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: orbitStart.x + 110, y: orbitStart.y + 45, button: "left", buttons: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: orbitStart.x + 110, y: orbitStart.y + 45, button: "left", buttons: 0, clickCount: 1 });
  await new Promise((resolveWait) => setTimeout(resolveWait, 450));
  const orbitEnd = await evaluate(`document.querySelector('[data-testid="vanguard-iges-canvas"]')?.dataset.cameraPosition`);
  if (!orbitStart.camera || !orbitEnd || orbitStart.camera === orbitEnd) throw new Error(`Orbit drag did not change the camera: ${JSON.stringify({ orbitStart, orbitEnd })}`);
  await click('[data-testid="vanguard-iges-fit"]');
  await click('[data-testid="vanguard-iges-reset"]');
  await capture("03-desktop-ready.png", '[data-testid="vanguard-iges-ready"]');

  await click('[data-testid="vanguard-intake-step-request-goal"]');
  await fillTextarea("#vanguard-reversr-goal", "Rebuild this verified 10 mm reference cube geometry as a bounded engineering-review request.");
  await click('[data-testid="vanguard-intake-step-discipline"]');
  await clickByText('[data-testid="vanguard-intake-discipline"] button', "Rebuild engineering");
  await click('[data-testid="vanguard-intake-step-constraints"]');
  await clickByText('[data-testid="vanguard-intake-constraints"] label', "Fit, tolerance, or critical dimensions");
  await click('[data-testid="vanguard-intake-step-readiness"]');
  await click('[data-testid="vanguard-generate-local-receipt"]');
  await click('[data-testid="vanguard-continue-to-order-portal"]');
  await waitForSelector('[data-testid="vanguard-order-engineering-review-summary"]');
  await capture("04-desktop-receipt-summary.png", '[data-testid="vanguard-order-transfer-review"]');

  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises?qa=iges-errors#build-request`);
  await waitForSelector('[data-testid="vanguard-iges-file-input"]');
  await setFile('[data-testid="vanguard-iges-file-input"]', malformedFixture);
  await waitForSelector('[data-cad-state="malformed"]');
  await capture("05-desktop-malformed.png", '[data-testid="vanguard-iges-intake"]');
  await setFile('[data-testid="vanguard-iges-file-input"]', unsupportedFixture);
  await waitForSelector('[data-cad-state="unsupported"]');
  await capture("06-desktop-unsupported.png", '[data-testid="vanguard-iges-intake"]');
  await setFile('[data-testid="vanguard-iges-file-input"]', oversizedFixture);
  await waitForSelector('[data-cad-state="too-large"]');
  await capture("07-desktop-too-large.png", '[data-testid="vanguard-iges-intake"]');

  await setViewport(390, 844);
  await navigate(`${baseUrl}/kinflo-sites/vanguard-enterprises?qa=iges-mobile#build-request`);
  await waitForSelector('[data-testid="vanguard-iges-file-input"]');
  await assertNoOverflow("mobile IGES intake empty state");
  await capture("08-mobile-empty.png", '[data-testid="vanguard-iges-intake"]');
  await setFile('[data-testid="vanguard-iges-file-input"]', cubeFixture);
  await waitForSelector('[data-cad-state="ready"]');
  await waitForSelector('[data-viewer-state="ready"] canvas');
  await assertNoOverflow("mobile IGES ready state");
  await capture("09-mobile-ready.png", '[data-testid="vanguard-iges-ready"]');

  if (externalApplicationRequests.length) throw new Error(`Unexpected external application requests: ${JSON.stringify(externalApplicationRequests)}`);
  await writeFile(join(outputDir, "network-evidence.json"), `${JSON.stringify({ externalApplicationRequests: 0, externalWrites: 0, canvasEvidence, orbitEvidence: { changed: true, before: orbitStart.camera, after: orbitEnd } }, null, 2)}\n`);

  const frames = [
    "01-desktop-empty.png",
    "02-desktop-loading.png",
    "03-desktop-ready.png",
    "04-desktop-receipt-summary.png",
    "05-desktop-malformed.png",
    "06-desktop-unsupported.png",
    "07-desktop-too-large.png",
    "08-mobile-empty.png",
    "09-mobile-ready.png",
  ];
  const availableFrames = [];
  for (const frame of frames) {
    const present = await import("node:fs").then(({ existsSync }) => existsSync(join(outputDir, frame)));
    if (present) availableFrames.push(frame);
  }
  const videoPath = join(outputDir, "vanguard-iges-phase2a-walkthrough.mp4");
  const args = ["-y"];
  for (const frame of availableFrames) args.push("-loop", "1", "-t", "2.8", "-i", join(outputDir, frame));
  const streams = availableFrames.map((_, index) => [
    `[${index}:v]split=2[bg${index}][fg${index}]`,
    `[bg${index}]scale=1440:1000:force_original_aspect_ratio=increase,crop=1440:1000,boxblur=20:10[bgf${index}]`,
    `[fg${index}]scale=1440:1000:force_original_aspect_ratio=decrease[fgf${index}]`,
    `[bgf${index}][fgf${index}]overlay=(W-w)/2:(H-h)/2,setsar=1[v${index}]`,
  ].join(";")).join(";");
  const inputs = availableFrames.map((_, index) => `[v${index}]`).join("");
  args.push("-filter_complex", `${streams};${inputs}concat=n=${availableFrames.length}:v=1:a=0[outv]`, "-map", "[outv]", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", videoPath);
  const rendered = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (rendered.status !== 0) throw new Error(`FFmpeg walkthrough render failed: ${rendered.stderr}`);
  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_name,width,height,avg_frame_rate,nb_frames", "-of", "json", videoPath], { encoding: "utf8" });
  if (probe.status !== 0) throw new Error(`FFprobe validation failed: ${probe.stderr}`);
  const videoEvidence = JSON.parse(probe.stdout);
  await writeFile(join(outputDir, "video-evidence.json"), `${JSON.stringify(videoEvidence, null, 2)}\n`);
  console.log(`Rendered ${videoPath}`);
  console.log(JSON.stringify({ canvasEvidence, videoEvidence }, null, 2));
  socket.close();
} finally {
  chrome.kill("SIGTERM");
}
