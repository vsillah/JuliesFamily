# Vanguard logo QA evidence

## Scope

- Public route: `/kinflo-sites/vanguard-enterprises`
- Admin evidence route: `/admin/kinflo-os?tab=site-studio&studioSite=vanguard-enterprises&studioLane=workbench&studioStage=sites`
- Local fixture server: `PORT=5190 npm run kinflo:serve-local-admin-smoke`

## Source evidence

- Public source: `http://www.vanguardenterprises.com/image/80076569.jpg`
- Local asset: `attached_assets/vanguard-enterprises-logo.jpg`
- Source dimensions: 356 x 138 pixels
- SHA-256: `30d17af6df43c14e6510e6cd0abc40d04064c74c8e0d6e167821b6bdf485eb02`
- Accessible alt text: `Vanguard Enterprises`

## Hero image provenance

- Local asset: `attached_assets/generated_images/Vanguard_industrial_welding_fabrication_hero.png`
- Generation mode: built-in OpenAI image-generation tool
- Dimensions: 1672 x 941 pixels
- SHA-256: `e519b4eb29d01ed13fd4ca38e7ba7cc9508abbad23ba907e29bc602ebabd2002`
- Prompt intent: photorealistic industrial fabrication shop with protected welders and structural-steel work on the right; darker negative space on the left for the existing headline and calls to action; no readable text, logo, watermark, private source, or customer material

## Screenshots

- `vanguard-logo-desktop.png`: true PNG, 1280 x 720 public-route viewport. The logo is 123.82 x 48 rendered pixels and preserves the source aspect ratio.
- `vanguard-logo-mobile-390x844.png`: true PNG, 390 x 844 public-route viewport. The logo is 103.19 x 40 rendered pixels; body client width and scroll width both equal 390 pixels.
- `vanguard-logo-admin-brand-evidence.png`: true PNG, 1280 x 720 Site Studio view showing the local logo, source dimensions, checksum evidence, and gated fulfillment controls.

## Result

- Public desktop and mobile logo placement: pass
- Welding/fabrication hero composition and copy readability: pass
- Public logo link stays on `/kinflo-sites/vanguard-enterprises`: pass
- Accessible logo description: pass
- Horizontal overflow at 1280 and 390 pixels: none
- Public-route console warnings or errors: none
- Admin brand evidence visible: pass
- Admin-route console warnings or errors: none
- External writes, provider calls, live Convex execution, codegen, and production activation: none
