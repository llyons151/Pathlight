# Pathlight

A responsive landing page for an AI-assisted website analytics concept, visually inspired by the spacious typography and product-led presentation of https://chatgpt.com/codex/.

## Run

Requires Node.js 22 or newer. Run `npm install` once before starting.

```sh
npm run dev
```

Open http://localhost:5173. Use `npm run build` to create the static site in `dist/`, and `npm run preview` to serve it. The development server also accepts `--port 3000`.

## Preview behavior

- Reporting period selection changes illustrative metrics and the funnel.
- The insight button cycles through three sample findings.
- The question form returns clearly labeled preset responses for checkout, traffic, and returning-visitor questions.
- FAQ disclosures and section navigation work without JavaScript.

This is a landing page and product concept, not a connected analytics service. It does not collect events, submit questions to an AI provider, or register users until the new Supabase integration is configured. DM Sans loads from Google Fonts when available; Arial is the fallback.

## Fluid and glass background

`water.js` now implements dye advection, a pressure solve, and vorticity confinement, rendered through a refractive WebGL shader. Pointer movement and taps inject color and velocity; automatic streams keep the scene moving when idle. The hero and dashboard use translucent glass surfaces with backdrop blur and edge highlights. Rendering pauses offscreen, in hidden tabs, and via the pause button; reduced-motion preferences keep the fluid static. The existing gradient is the fallback if WebGL is unavailable.

Visual reference: [Pavel Dobryakov’s fluid demo](https://paveldogreat.github.io/WebGL-Fluid-Simulation/). The solver is an original implementation using the stable-fluid techniques described in [NVIDIA GPU Gems, chapter 38](https://developer.nvidia.com/gpugems/gpugems/part-vi-beyond-triangles/chapter-38-fast-fluid-dynamics-simulation-gpu); it does not embed or copy the reference demo.

The landing page features a canvas globe with rotating geographic land samples, visitor pins, and illustrative stories. Rotation pauses offscreen, when the tab is hidden, or with the globe pause control, and respects reduced-motion preferences. The interactive analytics preview expands below the globe. Land samples in `globe-land.js` are derived from the public-domain map at https://github.com/johan/world.geo.json.

## Accounts, contact, and legal pages

The site now includes login, signup, email confirmation, password recovery, an account page, contact, Terms, Privacy, Cookies, Acceptable Use, and a custom 404. Account actions use the bundled Supabase SDK. Configure the public project values and real business details in `site.config.json`; see [LAUNCH-SETUP.md](LAUNCH-SETUP.md) for activation and the outstanding legal review. No authentication provider or contact inbox is connected by default.

Run `npm test` for the build, account action tests, page/link checks, custom 404 status checks, and source-file protection checks. Restart an existing dev server to load the new routes. Static hosts should serve `dist/404.html` with status 404 for missing URLs.
