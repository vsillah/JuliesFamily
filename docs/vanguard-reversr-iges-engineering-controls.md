# Vanguard / ReversR IGES engineering controls

This slice extends the existing browser-local IGES review inside the Vanguard order workspace. It does not add upload persistence, Convex bindings, provider calls, order writes, or hosted conversion.

## Spatial, not temporal

The requested "space/time" information is represented as spatial model information. The review shows:

- X/Y/Z bounding-box extents;
- X/Y/Z minimum, maximum, and source-coordinate center;
- the current placed center after local translation;
- exact X/Y/Z translation and rotation values; and
- the current zoom percentage.

Converted geometry coordinates are normalized to millimetres by the qualified browser converter. Source-declared unit: unknown. The interface states this explicitly instead of claiming that the original IGES global section was independently decoded for unit provenance.

## Interaction and precision

Mouse, trackpad, touch, and keyboard-accessible controls coexist:

- switchable Orbit / rotate and Move / pan modes;
- Shift/right-drag pan plus scroll/pinch zoom;
- Fit and Home actions;
- configurable translation and rotation steps;
- X/Y/Z negative and positive nudges;
- exact numeric translation and rotation fields; and
- bounded 25–400% numeric zoom with step buttons.

All placement changes are local review transforms. They do not rewrite the selected source or the sanitized order receipt.

## Capability-driven downloads

- **Original validated IGES:** downloads the exact in-memory `.igs` or `.iges` selected by the reviewer.
- **Derived inspection mesh (STL):** a real ASCII triangle export using browser-normalized millimetre coordinates. STL itself does not encode units.
- **Derived inspection mesh (OBJ):** a real Wavefront triangle export using browser-normalized millimetre coordinates. OBJ itself does not encode units.
- **STEP:** STEP remains unavailable because the bounded browser path has a triangle review mesh, not verified editable solid/topology output.

The derived files are inspection artifacts, not manufacturing-certified conversions.

## Preserved boundaries

- Existing strict filename/source admission, size, mesh, vertex, triangle, timeout, and serialized-output limits remain active.
- Malformed, unsupported, too-large, no-geometry, loading, and runtime-error states remain fail closed.
- Source bytes and triangle arrays remain excluded from the order receipt.
- No `.env.local`, secrets, persistence, private storage, provider requests, external sends, live order mutations, environment changes, deployment, or hosted smoke are introduced.
