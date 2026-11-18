# Case Studio — Made of your imagination

Case Studio is a Next.js App Router project that follows eight stages of phone-case sublimation, from the first design to the finished shell.

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

Push this project to your Git provider, then import the repository into Vercel. Select the directory containing this project's `package.json` and `vercel.json` as the **Root Directory**. If uploading the contents of `Case-main` as their own repository, leave the root at `.`. If the repository includes the parent directories, select its relative path to `care`, for example `backend/Case-main`.

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

A "midnight atelier" look: near-black backdrop, porcelain type, champagne accents and the press's turquoise as glow. Display type is Instrument Serif, text is Manrope (both self-hosted through `next/font`).

- **Hero**: a full-bleed photograph of the open press with a scroll-driven zoom, a word-by-word headline reveal, and a pointer-tilted 3D case with orbiting light rings.
- **The eight stages** (`#process`): one step per screen, played like a film. The section is pinned on a light aqua stage (`#e7ffff`, accents `#00cccb`). As you scroll, the current step slides, turns and blurs out and the next one comes in: step 1, then 2, then 3, up to 8. Only one step is on screen at a time, with a brief overlap at each hand-over. Each screen shows the step number pill, its name, a headline, a description, a large faint step number and the product on a soft halo. Step 8 offers "Design your case". A numbered track at the bottom fills as you go; its nodes and the previous/next buttons jump to a step. Scrolling back plays it in reverse. On phones the product sits above the text.
- Step images: all eight are the real product photographs from the supplied reference infographic, with its flat `#e7ffff` background keyed out (`public/assets/journey/1-app.webp` … `8-final.webp`).
- **Design library**: three cards with a 3D tilt and pointer glare. Each opens the design studio.
- **Finale**: a framed photograph opens out to fill the screen as you scroll.
- **Design studio dialog**: preview three designs or a local photo upload. The Save button downloads the original image. Photos stay in the browser.
- Reduced motion turns off smooth scrolling, scrubbed effects and loops; the steps still follow the scroll position.

## Performance

Measured with Playwright on a production build, scrolling the whole page with 4x CPU throttling (about a mid-range phone): 60 fps in every section, 0.1% of frames over 33 ms. Image downloads are about 1.5 MB, down from 8.4 MB.

Rules that keep it that way:

- Animate only `transform` and `opacity` while scrolling. No `backdrop-filter` on anything that sits over moving content (the header, buttons and badges use a solid tint), no scroll-driven `filter` or `clip-path`. The finale reveal scales a rounded frame instead of animating `clip-path`.
- Never set a CSS custom property on a large container per frame: it restyles everything inside it. The step film writes `transform` straight onto the elements it moves, and caches them once.
- The step film updates only the screens around the scroll position, gives each screen its own layer (`will-change: opacity`), pauses idle loops on hidden screens, and decodes all eight images before the section reaches the screen.
- Step images are WebP with alpha, at most 1280 px on the long side, with explicit `width`/`height`. Keep new ones the same way.
- Section reveals use an IntersectionObserver and a CSS transition (`[data-rise]`), not per-element scroll triggers.
- The film grain is a static, viewport-sized layer.

## Premium details

- Gold progress line across the top of the page.
- Gradient bridges (`.tone-in`, `.tone-out`) between the dark page and the aqua step film.
- A band of light sweeps behind each product as its step arrives; the step counter rolls in.
- Primary buttons lean slightly toward the pointer (`data-magnetic`).
- Left and right arrow keys move through the steps while the film is on screen.
- Step 3: the white sheet from step 2 flies in and settles onto the mould inside the open press, driven by scroll (`placeSheet` in `components/Journey.tsx`; offsets are in `cqw` of the press image, so it lands in the same place at every size).
- The navigation underlines the section in the middle of the screen; headings use balanced line breaks. After the last step, the film fades straight into the design library.
- The film component is memoised, so header and navigation state changes never re-render it mid-scroll.
- Shared type and spacing tokens in `:root` (`--fs-display`, `--fs-h2`, `--fs-h3`, `--fs-lede`, `--fs-eyebrow`, `--section-y`).
- Social sharing: `app/opengraph-image.jpg`, `app/twitter-image.jpg`, `app/apple-icon.png`, and Open Graph / Twitter metadata in `app/layout.tsx`.

## Files

- `components/Studio.tsx`: header, hero, marquee, design library, finale, footer and the design-studio dialog. Also sets up smooth scrolling (Lenis) and the GSAP scroll effects.
- `components/Journey.tsx`: the pinned eight-step film: scroll progress, per-step enter/exit animation, step text, bottom track.
- `components/CaseArt.tsx`: the CSS phone case used in the hero, journey, library and dialog.
- `components/ThreeDScene.tsx`, `Models.tsx`, `ProductMachines.tsx`: the earlier WebGL showroom. No longer imported; kept for reference.
- `components/process.ts`: the eight ordered stages: copy, photograph, caption and accent colour.
- `components/media.tsx`: photograph paths and the responsive `<Photo>` element.
- `app/globals.css`: tokens, layout, responsive rules and reduced-motion rules.

## Assets

The nine supplied reference photographs are in `public/assets/hd/` as 2× WebP derivatives (2560 px on the long side, Lanczos upscale with light denoise and sharpening), plus a `-sm` 1080 px version for phones. The product-collage photograph is cropped to its row of finished cases, so the third-party logo in the original never appears. Upscaling is interpolation: it gives smoother edges at large sizes but does not invent detail.

`public/assets/alpine-cover-hd.jpg` is the case artwork. `hd/printer-real.webp` is the printer, cropped from a supplied photograph, on the step 3 card. The step 3 3D printer is modelled on that photograph. No manufacturer product image is used. See [asset credits](public/assets/CREDITS.md). The older `public/assets/workshop/` derivatives, `l8058-product-source.png`, `heat-press.jpg`, `printer.jpg`, `alpine-memory.jpg`, `alpine-hd.jpg`, `alpine-ski-hd.jpg` and the `qa/` screenshots belong to the previous design and are no longer referenced.

The design-library options are illustrative design directions. The download saves the source photo, not a production-ready case template. No unverified contact details, social accounts or product performance claims are presented.

## Validation

Run the production build and TypeScript checks with the commands above. Browser verification covers the eight step controls, reverse scrolling, reduced motion, the design dialog, photo upload and download, and responsive layouts. The `qa/` directory contains screenshots of an earlier design.
