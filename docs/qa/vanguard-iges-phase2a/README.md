# Vanguard IGES Phase 2A QA

## Local evidence

- Route: `http://127.0.0.1:5177/kinflo-sites/vanguard-enterprises?qa=iges-phase2a#build-request`
- Desktop viewport: 1440 × 1000
- Mobile viewport: 390 × 844
- Public source fixture: `occt-import-js` 0.0.23 `Cube 10x10.igs`
- Fixture result: 1 mesh, 24 vertices, 12 triangles, 10.00 × 10.00 × 10.00 mm
- Receipt id: `VE-IGES-5BC09D9B7A16`
- Canvas check: 778 × 420, 62 sampled RGB colors, PNG data URL length 68,570
- External application requests: 0
- External writes: 0
- Server persistence: disabled
- Private uploads/storage: disabled
- Provider calls: 0
- Live order writes: 0

## Captures

- `01-desktop-empty.png`
- `02-desktop-loading.png`
- `03-desktop-ready.png`
- `04-desktop-receipt-summary.png`
- `05-desktop-malformed.png`
- `06-desktop-unsupported.png`
- `07-desktop-too-large.png`
- `08-mobile-empty.png`
- `09-mobile-ready.png`
- `vanguard-iges-phase2a-walkthrough.mp4`

The screenshots come from real browser states. The ready captures use the actual OpenCascade conversion and Three.js canvas; no model or screenshot is mocked. The playable MP4 is assembled from the captured state sequence and validated with FFprobe. `network-evidence.json` and `video-evidence.json` contain the machine-readable checks.

The no-geometry branch is covered by the focused normalization test because the qualified public package supplies a cube with valid geometry and no privacy-safe no-geometry IGES fixture is included. The implemented UI maps `NO_GEOMETRY` to its own visible recovery state.

## Commands

```text
npm run kinflo:test-vanguard-iges-admission
npm run kinflo:validate-vanguard-iges-phase2a
npm run kinflo:validate-vanguard-reversr-intake
npm run kinflo:validate-vanguard-reversr-desktop-embed
npm run check
npm run build
npx vite --host 127.0.0.1 --port 5177 --strictPort
npm run kinflo:capture-vanguard-iges-phase2a-qa
```

The full Express development command was intentionally not used for evidence because this source-only worktree has no `DATABASE_URL`. The client-only Vite route is the relevant runtime for the browser-local CAD path and avoids introducing server persistence or environment changes.
