# KinFlo tenant palette QA

This packet verifies the three approved palettes through the shared public renderer and the source-only Brand Theme Studio configuration path.

- `01-kinflo-default-desktop.png`: KinFlo Grounded on Julie's Family.
- `02-professional-neutral-desktop.png`: Professional Neutral on the advisor fixture.
- `03-reversr-vanguard-light-desktop.png`: ReversR Industrial on Vanguard in light mode.
- `04-reversr-vanguard-dark-mobile.png`: ReversR Industrial on Vanguard at 390×844 in dark mode.
- `05-admin-brand-theme-studio.png`: gated admin palette selection surface.
- `kinflo-tenant-palette-walkthrough.mp4`: playable visual walkthrough of the exact reviewed states.
- `network-evidence.json`: no non-loopback application requests and no external writes.

Run the capture against a local server started with `VITE_KINFLO_IDENTITY_MODE=local_fixture PORT=5177 npm run dev`.
