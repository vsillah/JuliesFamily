# KinFlo Home Page: Fable 5.2 Cinematic Vision Prompt

## Brief

You are Claude Fable 5.2 acting as the visual and interaction author for the KinFlo public homepage.

Create a cutting-edge, breathtaking presentation of KinFlo's neutral multitenant front door: a platform that lets different organizations have distinct public sites while sharing a visible operating layer for requests, relationships, evidence, review, and delivery.

The homepage should make one idea immediately legible:

> The website is the front door. KinFlo is the layer that keeps the work behind the door moving.

This is a creative direction and implementation brief. The existing Claude-authored homepage UX and semantic structure are the source of truth. Do not translate, approximate, replace, or flatten that UX into a new architecture. Keep the current route and interaction contract intact, then make the existing experience feel authored, cinematic, alive, and unmistakably premium.

The main job is to organize the visual story and preserve the product goal. The Integration Captain will manage branches, review the exact artifact, validate the rendered result, and sequence any later deployment. Do not merge or deploy as part of this pass.

## Audience and first impression

I will open the build on a large screen and show it to a prospective client for 20–60 seconds. The first five seconds need to communicate the product without explanation:

- KinFlo is a multitenant platform, not one client's old website.
- A public site, an intake journey, and an operating workspace belong to one connected system.
- Each tenant can have its own front door without losing scope, ownership, or relationship context.

The page should feel like a product reveal, not a SaaS template, dashboard catalog, photo gallery, or marketing page assembled from interchangeable cards. Give the viewer a clear visual event to remember.

## Creative north star

Make the star of the page a living transformation from a public front door into an operating reality.

Begin with a calm, precise neutral field. Let several distinct front-door signals appear as separate worlds or entry points. One signal should become a real request, travel through a visible trace, and resolve into the operating layer: a scoped relationship, a review state, a decision, evidence, and a next action. The viewer should feel that the platform is routing meaning and responsibility, not merely storing pages.

Use the visual language of an editorial product film:

- deliberate camera movement, depth, scale, and rhythm;
- a restrained but memorable palette with a strong accent used for state and direction;
- tactile surfaces, fine rules, controlled texture, and typographic contrast;
- generous negative space around the important idea;
- a human sense of consequence beneath the precision;
- enough surprise to feel new, with enough restraint to remain credible.

Avoid a one-note dark navy application shell, generic gradients, ornamental blobs, stock-looking photography, fake logos, invented customer claims, and decorative 3D with no product meaning.

## Narrative sequence

Use 4–6 distinct scenes or sections. Preserve the existing information architecture and semantic anchors; compose each section as a different visual moment rather than repeating the same card grid.

### Scene 1: The front door

Open with the neutral KinFlo identity and a strong statement about the layer behind the public site. Establish the platform as a system of connected front doors, not as a single tenant brand. The hero must be visually alive at load and should reward the viewer before they scroll.

The hero can use an approved image, video, generated local visual, or a carefully authored canvas treatment already supported by the project. Use existing approved assets first. Do not replace a meaningful existing asset with random filler.

### Scene 2: Many front doors, one operating layer

Show several tenant-facing experiences as distinct signals with their own character. They should not read as three identical tiles. Use spatial separation, editorial framing, or a composed sequence so the viewer understands variety without losing the common platform beneath it.

The interaction should make the shared layer visible: a thread, route, trace, or current of information can move between front door and operating layer. The viewer should understand that tenant identity is preserved while the underlying system remains coherent.

### Scene 3: The request becomes a journey

Give the request a visible life. It should form, move, be reviewed, acquire context, and reach a meaningful next state. Use motion with a beginning, middle, and end: parallax, convergence, controlled camera movement, scale transitions, state changes, or spatial layers that reveal cause and effect.

Do not let this become a cross-fade slideshow. The motion must show forward action. Pointer response may provide a subtle magnetic, depth, or focus effect, but it must support the story rather than compete with it.

### Scene 4: The operating layer

Reveal the KinFlo workspace as the place where relationships, evidence, gates, ownership, and next actions become legible. It should feel like a control plane with human judgment in it, not a wall of dashboard widgets.

Use a small number of meaningful live-looking states. If charts, progress marks, or status pills appear, they must communicate an underlying read-only fixture or an explicit demo state. Do not invent live customer data or imply provider activity.

### Scene 5: The handoff

End with a clear, desirable next step: open the admin demo, explore the neutral multitenant layer, or inspect a tenant journey. The handoff should feel like entering the product, not submitting to a generic call-to-action. Preserve the existing demo and tenant route boundaries.

## Motion direction

Define motion beats before implementation. A useful starting rhythm is:

| Beat | Visual behavior | Purpose |
| --- | --- | --- |
| 0–2 seconds | quiet hold with a precise ambient movement | establish confidence and invite attention |
| 2–5 seconds | front-door signals separate, orbit, or come into focus | make multitenancy visible |
| 5–9 seconds | one signal becomes a request and travels along a trace | demonstrate forward action |
| 9–13 seconds | trace resolves into scoped operating context | reveal KinFlo's differentiator |
| 13+ seconds | controlled loop or settled state with a clear handoff | make the page pleasant to revisit |

The exact timing can change, but each beat needs a purpose. Favor long, confident movement over nervous micro-animation. Use easing that feels physical. Keep the loop from snapping back to frame one; if a loop is necessary, design an exit and re-entry so the reset is difficult to notice.

Support `prefers-reduced-motion` with a complete, intentional still-state composition. A reduced-motion visitor must still understand the same story and reach the same actions.

## Visual and content rules

- Use real, specific KinFlo language. Avoid generic phrases such as “seamless solutions” or “unlock your potential.”
- Keep the copy concise enough to let the visual system carry the emotional weight.
- Let typography create hierarchy, pacing, and editorial character. Do not use oversized type as the only design move.
- Create contrast between the calm neutral homepage, the active request trace, and the operating layer.
- Use imagery as evidence of the world the platform serves, not as decoration.
- If a visual asset is generated, keep it local, reproducible, and clearly attributable in the handoff.
- Keep the neutral homepage separate from Julie's and Vanguard's tenant routes. Do not merge tenant-specific content into the KinFlo home page.
- Keep the existing theme system coherent in light and dark mode. Do not leave isolated navy, white, or low-contrast panels behind when the theme changes.
- The page must remain polished at 1440px, 1024px, and 390px. Composition may change responsively; it must not merely shrink.

## Technical boundaries

Work with the existing framework, component patterns, route structure, and asset pipeline. Do not introduce a new runtime, external CDN dependency, or large library only to create visual novelty.

Use Three.js, WebGL, shaders, or another canvas layer only if the current application can support it cleanly and the technique is directly serving the front-door-to-operating-layer story. A single well-directed canvas is preferable to several disconnected effects. The page must remain usable when the canvas is unavailable.

Preserve these semantic routes and boundaries:

- `/` — neutral KinFlo multitenant homepage
- `/kinflo-demo/admin?demo=1` — fixture-backed review/demo workspace
- `/kinflo-sites/:tenantSlug` — explicit tenant-facing site
- `/admin/kinflo-os` — operating/admin surface

This creative pass must not change authentication, provider configuration, CRM behavior, database data, fixture semantics, or deployment configuration. Do not invoke CRM/provider writes. Do not add live-data claims.

Optional QA controls may use query parameters such as `?t=<seconds>`, `?s=<0..1>`, or `?view=<name>` to make motion and scenes reproducible. Keep those controls out of the production-facing visual treatment.

## Iteration discipline

Build a first pass, then run at least four deliberate improvement rounds. For every round:

1. Capture the first viewport, a meaningful mid-scroll state, and the final handoff state at desktop; inspect mobile as well.
2. Test the actual pointer, hover, scroll, keyboard, theme, and reduced-motion behaviors that the design relies on.
3. Name the three weakest visual or experiential decisions.
4. Fix those three before adding new decoration.
5. Check composition, type fit, contrast, motion continuity, frame rate, and scroll boundaries.

Judge the page as a demanding art director and as a first-time prospective client. Ask:

- Is the product idea clear before the copy is read?
- Is there visible forward motion rather than a sequence of fades?
- Does each section have its own compositional reason to exist?
- Does the operating layer feel like the consequence of the public site?
- Does the page still feel intentional at 390px?
- Are the approved images and visual assets still recognizable and well framed?
- Is the final action obvious without becoming a loud sales button?

Stop iterating when the page is coherent, memorable, and technically calm. Do not polish by adding layers after the hierarchy is already working.

## Branch and handoff contract

If implementation is authorized after this brief, use a dedicated branch/worktree named `codex/kinflo-home-fable-cinematic`. Do not modify the integration captain's branch directly.

Claude is the visual author. Preserve Claude-authored structure and code as the source material; do not have another agent recreate the design from screenshots or paraphrase it into a different UX. The Integration Captain will:

- review the exact diff and asset provenance;
- verify the route and fixture boundaries;
- run checks and rendered browser QA at 1440px, 1024px, and 390px;
- inspect light/dark and reduced-motion states;
- verify no horizontal overflow, dead ends, stale assets, or duplicated layers;
- keep merge, deployment, and Human QA as separate gates.

Return a compact handoff containing:

- the branch and worktree;
- the exact commit;
- files changed and asset sources;
- screenshots or a short privacy-safe walkthrough of the actual interaction;
- checks run and viewport widths inspected;
- the three weakest things fixed during iteration;
- remaining risks or decisions for the Integration Captain.

Stop before merge, deployment, production promotion, provider activation, CRM writes, or real-data use.

## Final instruction

Make KinFlo feel like a new category of public-to-operational software: cinematic enough to be remembered, exact enough to be trusted, and human enough that a prospective client can see where their own front door would belong.

Let the visual system do the explaining.

Do not turn this into a generic landing page.
