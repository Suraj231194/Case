# Case Studio — Made of your imagination

A local Next.js App Router project following the supplied eight-stage phone-case sublimation brief. The scroll presentation takes inspiration from https://sweety-sepia.vercel.app/ while keeping the turquoise identity and manufacturing sequence of the supplied reference.

## Run

Uses Node.js 26.x, matching the version selected for Vercel in `package.json`.

```sh
npm install
npm run dev
```

Open the URL printed by Next.js. To use port 3007: `npm run dev -- --port 3007`.

```sh
npm run typecheck
npm run build
npm start
```

## Deploy to Vercel

The project is configured for Vercel's Next.js framework preset. No environment variables, database, API keys, or external asset host configuration are required.

### From the project folder

```sh
npx vercel
```

Log in and follow the CLI prompts. Use the current directory as the project directory. This creates a preview deployment. To deploy to production:

```sh
npx vercel --prod
```

### From a Git repository

Push this project to your Git provider, then import the repository into Vercel. Select the directory containing this project's `package.json` and `vercel.json` as the **Root Directory**. If uploading the contents of `care` as their own repository, leave the root at `.`. If the repository includes the parent directories, select its relative path to `care`, for example `backend/care`.

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Node.js version | 26.x |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | Leave the Next.js default; do not set `out` or `dist` |
| Environment variables | None |

Commit `package-lock.json` and all referenced files in `public/assets`. `.vercelignore` excludes local build artifacts and QA screenshots from CLI uploads; `.gitignore` keeps Vercel account linkage local. The 3D scene runs in the browser, and all product photographs are served from `public`.

Deployment configuration is prepared locally; no Vercel project has been linked or published by this preparation step.

## Experience

- Responsive hero with pointer-responsive, layered 3D cases.
- Sticky eight-stage experience, synchronized to a GSAP ScrollTrigger timeline with scrub. Reverse scrolling reverses the scene.
- A connected 3D S-shaped turquoise pathway: top row 1 → 2 → 3 → 4; lower row 5 → 6 → 7 → 8, right to left.
- Scroll-driven camera travel, case rotations, printer paper movement, heat-press lid closure, and final artwork reveal.
- Keyboard-accessible numbered route map, skip-journey link, and mobile navigation.
- Features, three design directions, final CTA, and a browser-local design preview with photo upload and original-artwork download. No checkout or manufacturing API is connected.
- Lazy-loaded WebGL bundle, bounded device pixel ratio, offscreen render suspension, resource ownership through React Three Fiber, loading indicator, and WebGL failure fallback.
- Reduced-motion CSS disables entrance and decorative animations and shortens the scroll distance. The core manufacturing scene remains controlled by scroll.

## Files

- `components/Studio.tsx`: page sections, scroll timeline, navigation, and design-preview dialog.
- `components/ThreeDScene.tsx`: procedural product models, materials, lighting, camera, and animations.
- `components/process.ts`: the eight ordered stages and copy.
- `app/globals.css`: responsive visual system and reduced-motion rules.

## Assets and practical limits

The cover artwork in `public/assets/alpine-cover-hd.jpg` is a new 1440 ? 2790 HD photograph, framed for the phone-case proportions. It replaces the low-resolution infographic crop across the hero, manufacturing journey, gallery, fallback, and design preview. Source: [Smiling Woman in Pink Jacket Skiing ? Rockwell branding agency, Pexels](https://www.pexels.com/photo/smiling-woman-in-pink-jacket-skiing-20598491/). See [asset credits](public/assets/CREDITS.md).

Step 3 uses an actual transparent Epson L8058 product photograph with a separate scroll-controlled artwork layer on the output sheet. Step 5 uses a detailed mechanical 3D heat-press assembly: recessed chamber, metal tray, silicone gasket, hinge pins, casing seams, feet, vents and an illuminated control panel. Its film placement and lid closure follow scroll position. The heat press remains a custom model based on the supplied reference, not manufacturer CAD. Product components are in `components/ProductMachines.tsx`.

The abstract and typographic gallery options are illustrative design directions. The download button saves the source photo, not a production-ready case template. No unverified contact details, social accounts, or product performance claims are presented.

## Validation

Production build and TypeScript checks; browser checks at desktop and mobile sizes using Microsoft Edge, including all eight stage counters, scrolling forward/backward, modal open/close, upload/download, and horizontal overflow. Browser screenshots are kept in `qa/` when generated.
