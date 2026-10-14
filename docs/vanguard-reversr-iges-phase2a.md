# Vanguard ReversR IGES Phase 2A

## Outcome

The Vanguard public-site order workspace now accepts one real `.igs` or `.iges` file for a browser-local engineering review. The browser validates the source, converts it with OpenCascade/WASM, renders the resulting triangle geometry with Three.js, and carries a sanitized specifications summary into the existing browser-session receipt.

The source file and mesh arrays remain in the active browser process only. They are not uploaded, persisted, placed in Convex, sent to a provider, or attached to the receipt.

## Source provenance

The bounded contract and implementation shape were adapted from the local ReversR Rebuild workspace:

- `/Users/vambahsillah/Documents/ReversR-Workspace/ReversR-Rebuild/utils/igesAdmission.js`
- `/Users/vambahsillah/Documents/ReversR-Workspace/ReversR-Rebuild/server/cadWorkerContract.js`
- `/Users/vambahsillah/Documents/ReversR-Workspace/ReversR-Rebuild/server/cadMeshWorker.js`
- `/Users/vambahsillah/Documents/ReversR-Workspace/ReversR-Rebuild/utils/cadLocalIgesPreview.js`
- `occt-import-js` 0.0.23 and Three.js 0.184.0

The runtime smoke uses the public dependency fixture `node_modules/occt-import-js/test/testfiles/cube-10x10mm/Cube 10x10.igs`. No private CAD file is part of repository evidence.

## Admission and conversion boundary

- ASCII-safe filename, maximum 120 characters, no `..` path-like segment
- `.igs` or `.iges` extension only
- 256 KiB maximum source
- ASCII text bytes only
- strict 80-column IGES records
- ordered Start, Global, Directory, Parameter, and Terminate sections
- paired Directory entries
- external-reference entity 416 rejected
- five-second disposable browser worker
- maximum 16 meshes
- maximum 20,000 vertices
- maximum 10,000 triangles
- finite coordinates and in-range triangle indices
- maximum 1 MiB serialized geometry result

The OpenCascade worker is emitted as a separate Vite worker bundle. Its 7.3 MiB WASM dependency and Three.js renderer load only after a file passes the cheap browser-side admission checks.

## Receipt boundary

The existing session-local receipt can carry:

- validated filename
- source size
- mesh, vertex, and triangle counts
- millimeter bounding-box dimensions
- SHA-256 digest
- deterministic `VE-IGES-<12 digest characters>` receipt id
- `engineering_review_only` status

The receipt excludes source bytes, base64, blob/object URLs, mesh positions, triangle indices, and provider/storage identifiers. It remains a browser draft until the separately gated account and persistence path exists.

## Product states

The intake provides explicit empty/upload, loading, malformed, unsupported, too-large/output-limit, no-geometry, runtime error, and ready states. The ready state contains a nonblank interactive WebGL canvas and Orbit, Fit, and Reset controls. Desktop and mobile states preserve the Vanguard/ReversR order context.

## Scope boundary

This lane does not add Convex bindings, codegen, server persistence, private uploads or storage, provider calls, live order writes, environment changes, deployment, or hosted smoke. The rendered model and summary support engineering review only; they are not a quote, dimensional inspection, certification, or manufacturing guarantee.
