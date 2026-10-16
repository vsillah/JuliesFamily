# Tenant Site Composer Visual QA

Captured from the local development-only fixture at `http://127.0.0.1:5320` with `VITE_KINFLO_IDENTITY_MODE=local_fixture`. No provider writes, Convex codegen, live persistence, hosted smoke, or production environment was used.

## Evidence

- `01-public-vanguard-desktop.png` - transparent hero navigation and Vanguard-first hero.
- `02-public-vanguard-nav-solid.png` - solid accessible navigation after scroll; parallax remains inside the hero.
- `03-public-vanguard-tablet.png` - public Vanguard at 1024 x 800.
- `04-public-vanguard-mobile.png` - public Vanguard at 390 x 844 with wrapped navigation.
- `05-public-vanguard-dark-mobile.png` - dark theme at 390 x 844.
- `06-public-vanguard-reduced-motion.png` - reduced-motion emulation at 390 x 844.
- `07-admin-composer-desktop.png` - Site Studio composer at 1440 x 900.
- `08-admin-composer-tablet.png` - Site Studio composer at 1024 x 800.
- `09-admin-composer-mobile.png` - Site Studio composer at 390 x 844.
- `tenant-site-composer-walkthrough.mp4` - 21.6 second review walkthrough of the public and admin states.
- `qa-state.json` - machine-readable viewport, theme, order, motion, parallax, navigation, and network assertions.

## Assertions

- Public and admin desktop, tablet, and mobile layouts had equal document/body/client widths.
- Theme controls exercised light, dark, and system modes.
- Navigation transitioned from `overlay` to `solid` after scroll.
- Hero media selection changed the admin preview image/alt text; nav contrast changed the staged preview label and public renderer exposes the selected contrast mode.
- Required section hide controls were disabled; optional hidden sections remained visible in the composer with a `Hidden` badge and a working show control.
- Reduced-motion emulation reported `prefers-reduced-motion: reduce` and a `none` hero transform.
- Vanguard order was hero, services, source-parity/about, ReversR order journey, fulfillment, then build request.
- Hero/body bounds did not overlap while parallax was active.
- Non-loopback application requests: 0.
- Public visible text contained none of `convexFunction`, `fixture-public-renderer`, `templateKey`, `reviewSource`, or `Public preview`.

## Capture command

```sh
node scripts/capture-kinflo-tenant-site-composer-qa.mjs
```

The capture harness requires the local Vite development fixture; it is not a hosted or production smoke test.
