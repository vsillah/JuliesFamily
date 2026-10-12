# Vanguard logo QA evidence

## Scope

- Public route: `/kinflo-sites/vanguard-enterprises`
- Admin evidence route: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`
- Local fixture server: `PORT=5190 npm run kinflo:serve-local-admin-smoke`

## Source evidence

- Public source: `http://www.vanguardenterprises.com/image/80076569.jpg`
- Local asset: `attached_assets/vanguard-enterprises-logo.jpg`
- Source dimensions: 356 × 138 pixels
- SHA-256: `30d17af6df43c14e6510e6cd0abc40d04064c74c8e0d6e167821b6bdf485eb02`
- Accessible alt text: `Vanguard Enterprises`

## Screenshots

- `vanguard-logo-desktop.png`: 1280 × 720 public-route viewport. The logo is 123.82 × 48 rendered pixels and preserves the source aspect ratio.
- `vanguard-logo-mobile-390x844.png`: 390 × 844 public-route viewport. The logo is 103.19 × 40 rendered pixels; body client width and scroll width both equal 390 pixels.
- `vanguard-logo-admin-brand-evidence.png`: 1280 × 720 Site Studio view showing the local logo, source dimensions, checksum evidence, and gated fulfillment controls.

## Result

- Public desktop and mobile logo placement: pass
- Accessible logo description: pass
- Horizontal overflow at 1280 and 390 pixels: none
- Public-route console warnings or errors: none
- Admin brand evidence visible: pass
- Admin-route console warnings or errors: none
- External writes, provider calls, live Convex execution, codegen, and production activation: none
