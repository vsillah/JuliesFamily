# Vanguard IGES engineering-controls QA

This packet captures the browser-local Vanguard / ReversR review surface from the final source tree at:

`http://127.0.0.1:5183/kinflo-sites/vanguard-enterprises?qa=khalid-iges-engineering-controls&rev=final-source#build-request`

The public `occt-import-js` `Cube 10x10.igs` fixture is parsed by the real OpenCascade worker and rendered by the real Three.js viewer. No source geometry or screenshot is mocked.

## Coverage

- Desktop: 1440 × 1000
- Tablet: 820 × 1180
- Mobile: 390 × 844
- Empty state and loaded real fixture
- X/Y/Z extent, min, max, source center, and placed-center spatial readouts
- Explicit `Source unit: unknown` disclosure and millimetre-normalized display coordinates
- Orbit/rotate, move/pan, Fit, Home, translation/rotation nudges, exact numeric fields, and bounded zoom
- Exact original IGES download plus real STL and OBJ triangle-mesh exports
- Visibly disabled STEP solid-model export with an in-context explanation
- No horizontal document overflow at any tested viewport
- External application requests: 0
- External writes: 0
- Server persistence, private storage, provider calls, and live order writes: disabled / 0

## Artifacts

- `01-desktop-empty.png`
- `02-desktop-loaded-model.png`
- `03-desktop-precision-controls.png`
- `04-desktop-export-panel.png`
- `05-tablet-spatial-controls.png`
- `06-mobile-empty.png`
- `07-mobile-precision-controls.png`
- `08-mobile-export-panel.png`
- `vanguard-iges-engineering-controls-walkthrough.mp4`
- `qa-evidence.json`
- `video-evidence.json`

The MP4 is H.264/YUV420p with fast-start metadata and is validated with FFprobe after rendering.
