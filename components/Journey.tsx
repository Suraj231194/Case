"use client";

import { memo, useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";
import { steps } from "./process";

const count = steps.length;
export const number = (i: number) => String(i + 1).padStart(2, "0");
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (v: number) => {
  const t = clamp(v, 0, 1);
  return t * t * (3 - 2 * t);
};

/*
 * Product photographs with their backgrounds removed (WebP with alpha). Step 3 is the
 * workshop's own open heat press, cut out of the supplied photograph 54a5b283…; steps 1, 4
 * and 8 are HD renders of the case artwork; the rest come from the reference infographic.
 */
const images: { src: string; w: number; h: number }[] = [
  ["1-app", 626, 1280],
  ["2-paper", 257, 449],
  ["3-press-photo", 1280, 898],
  ["4-film", 904, 1280],
  ["5-press", 544, 442],
  ["6-mould", 200, 502],
  ["7-blank", 243, 541],
  ["8-final", 651, 1280],
].map(([name, w, h]) => ({ src: `/assets/journey/${name}.webp`, w: w as number, h: h as number }));

/** Step names as the reference words them. */
const labels = [
  "Design App",
  "Sublimation paper (white paper)",
  "L8058 printer",
  "Sublimation film (with design)",
  "Sublimation heat press",
  "Universal mould",
  "Blank phone case",
  "Customized phone case",
];
const short = ["App", "Paper", "Printer", "Film", "Press", "Mould", "Blank", "Final"];

/*
 * Scroll position x runs 0 → 8; screen i owns x ∈ [i, i + 1).
 * A screen plays in over [i − 0.05, i + 0.25] and out over [i + 0.75, i + 1],
 * so only one step is on screen at a time, with a short overlap between them.
 */
const playIn = (x: number, i: number) => (i === 0 ? 1 : smooth((x - i + 0.05) / 0.3));
const playOut = (x: number, i: number) => (i === count - 1 ? 0 : smooth((x - i - 0.75) / 0.25));

type Parts = {
  scene: HTMLElement;
  shot: HTMLElement | null;
  copy: HTMLElement | null;
  big: HTMLElement | null;
  sheet: HTMLElement | null;
  shadow: HTMLElement | null;
  shown: boolean;
};

/** Step 3: the white sheet from step 2 is placed into the open press. t runs 0 → 1 while the step holds. */
const SHEET_STEP = 2;
function placeSheet(sheet: HTMLElement, shadow: HTMLElement | null, t: number) {
  const e = t * t * (3 - 2 * t);
  // Offsets are in container-width units (cqw) of the press image, so they scale with it.
  const dx = (1 - e) * 30;
  const dy = (1 - e) * -64 + Math.sin(e * Math.PI) * -6;
  const rz = -8 + e * -82;
  const rx = e * 60;
  const scale = 1.3 - 0.3 * e;
  sheet.style.opacity = Math.min(1, t * 5).toFixed(3);
  sheet.style.transform =
    `translate(-50%, -50%) translate3d(${dx.toFixed(2)}cqw, ${dy.toFixed(2)}cqw, 0) ` +
    `rotateX(${rx.toFixed(1)}deg) rotateZ(${rz.toFixed(1)}deg) scale(${scale.toFixed(3)})`;
  if (shadow) {
    shadow.style.opacity = (e * 0.9).toFixed(3);
    shadow.style.transform = `translate(-50%, -50%) scale(${(0.5 + 0.5 * e).toFixed(3)})`;
  }
}

function Journey({
  lenis,
  onDesign,
  onActiveChange,
}: {
  lenis: RefObject<Lenis | null>;
  onDesign: () => void;
  onActiveChange?: (inView: boolean) => void;
}) {
  const section = useRef<HTMLElement>(null);
  const pin = useRef<HTMLDivElement>(null);
  const scenes = useRef<(HTMLElement | null)[]>([]);
  const rail = useRef<HTMLElement>(null);
  const progress = useRef({ value: 0 });
  const activeRef = useRef(0);
  const inView = useRef(false);
  const notify = useRef(onActiveChange);
  const [active, setActive] = useState(0);

  useEffect(() => {
    notify.current = onActiveChange;
  }, [onActiveChange]);

  // Decode every step image before the section arrives, so no step stalls on first paint.
  useEffect(() => {
    const node = section.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      node.querySelectorAll<HTMLImageElement>(".j-shot img").forEach((img) => {
        img.decode?.().catch(() => {});
      });
    }, { rootMargin: "1600px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const journey = section.current;
    const frame = pin.current;
    if (!journey || !frame) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    // Look the moving parts up once, not on every frame.
    const parts: Parts[] = scenes.current.map((scene, i) => ({
      scene: scene!,
      shot: scene!.querySelector<HTMLElement>(".j-shot"),
      copy: scene!.querySelector<HTMLElement>(".j-copy"),
      big: scene!.querySelector<HTMLElement>(".j-big"),
      sheet: scene!.querySelector<HTMLElement>(".j-sheet"),
      shadow: scene!.querySelector<HTMLElement>(".j-sheet-shadow"),
      shown: i === 0,
    }));

    media.add({ full: "(prefers-reduced-motion: no-preference)", still: "(prefers-reduced-motion: reduce)" }, ({ conditions }) => {
      const full = !!conditions?.full;
      let lastX = -1;
      const paint = (value: number) => {
        const x = clamp(value, 0, 1) * count;
        if (Math.abs(x - lastX) < 0.0005) return;
        lastX = x;
        parts.forEach((p, i) => {
          let enter = playIn(x, i);
          let leave = playOut(x, i);
          if (!full) {
            enter = i === 0 || x >= i ? 1 : 0;
            leave = i < count - 1 && x >= i + 1 ? 1 : 0;
          }
          const shown = enter * (1 - leave);
          const visible = shown > 0.001;
          // Screens far from the scroll position are skipped once they are hidden.
          if (!visible && !p.shown) return;
          p.shown = visible;
          p.scene.style.opacity = shown.toFixed(3);
          p.scene.style.visibility = visible ? "visible" : "hidden";
          if (p.sheet) placeSheet(p.sheet, p.shadow, full ? clamp((x - i - 0.18) / 0.47, 0, 1) : 1);
          if (!full || !visible) return;
          const hold = clamp((x - i - 0.25) / 0.5, 0, 1);
          const away = 1 - enter + leave;
          if (p.shot) {
            p.shot.style.transform =
              `translate3d(${(1 - enter) * 48 - leave * 48}%, ${(1 - enter) * 5 - leave * 5}%, 0) ` +
              `rotateY(${(1 - enter) * -30 + leave * 30}deg) rotateZ(${(1 - enter) * 5 - leave * 5}deg) ` +
              `scale(${0.86 + 0.14 * (1 - away) + 0.035 * hold})`;
          }
          if (p.copy) p.copy.style.transform = `translate3d(0, ${(1 - enter) * 60 - leave * 60}px, 0)`;
          if (p.big) p.big.style.transform = `translate3d(${(1 - enter) * -26 + leave * 26 - hold * 4}%, 0, 0)`;
        });
        // Set on the fill itself: a custom property on the pin would restyle all eight screens.
        if (rail.current) rail.current.style.transform = `scaleX(${clamp((x - 0.5) / (count - 1), 0, 1).toFixed(4)})`;
        const next = clamp(Math.floor(x), 0, count - 1);
        if (next !== activeRef.current) {
          activeRef.current = next;
          setActive(next);
        }
      };
      paint(progress.current.value);
      const tween = gsap.to(progress.current, {
        value: 1,
        ease: "none",
        scrollTrigger: {
          trigger: journey,
          start: "top top",
          end: () => "+=" + (journey.offsetHeight - frame.offsetHeight),
          scrub: full ? 0.4 : true,
          invalidateOnRefresh: true,
          onToggle: (self) => {
            inView.current = self.isActive;
            notify.current?.(self.isActive);
          },
        },
        onUpdate: () => paint(progress.current.value),
      });
      return () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    });
    return () => media.revert();
  }, []);

  function goToStep(index: number) {
    const journey = section.current;
    const frame = pin.current;
    if (!journey || !frame) return;
    const top = journey.getBoundingClientRect().top + window.scrollY;
    const y = top + ((journey.offsetHeight - frame.offsetHeight) * (clamp(index, 0, count - 1) + 0.5)) / count;
    if (lenis.current) lenis.current.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: "instant" });
  }

  function continueOn() {
    const next = document.getElementById("designs");
    if (!next) return;
    if (lenis.current) lenis.current.scrollTo(next, { duration: 1.2 });
    else next.scrollIntoView();
  }

  // Left and right arrow keys step through the film while it is on screen.
  const step = useRef({ goToStep, continueOn });
  useEffect(() => {
    step.current = { goToStep, continueOn };
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!inView.current || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, dialog[open]")) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (activeRef.current < count - 1) step.current.goToStep(activeRef.current + 1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (activeRef.current > 0) step.current.goToStep(activeRef.current - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const last = active === count - 1;

  return (
    <section className="journey" id="process" ref={section} aria-labelledby="journey-title">
      <div className="journey-pin" ref={pin} data-stage={active}>
        <header className="j-top">
          <div>
            <p className="eyebrow"><i /> How it&rsquo;s made</p>
            <h2 id="journey-title">Customize your exclusive phone case</h2>
          </div>
          <p className="j-count" aria-hidden="true">
            <span className="j-count-now" key={active}>{number(active)}</span>
            <span className="j-count-all">/ {number(count - 1)}</span>
          </p>
        </header>

        <div className="j-stage">
          {steps.map((s, i) => (
            <article
              key={s.title}
              className="j-scene"
              ref={(el) => { scenes.current[i] = el; }}
              aria-hidden={i !== active}
              data-on={i === active || undefined}
              style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" } as CSSProperties}
            >
              <span className="j-big" aria-hidden="true">{number(i)}</span>
              <div className="j-copy">
                <p className="j-chapter"><span>Step {number(i)}</span> {labels[i]}</p>
                <h3>{s.headline.replace("\n", " ")}</h3>
                <p className="j-desc">{s.description}</p>
                {i === count - 1 && (
                  <button className="btn btn-teal j-cta" onClick={onDesign} tabIndex={i === active ? 0 : -1}>
                    Design your case <ArrowUpRight size={16} />
                  </button>
                )}
              </div>
              <figure className="j-shot">
                <span className="j-halo" aria-hidden="true"><i className="j-shine" /></span>
                {i === SHEET_STEP ? (
                  <span className="j-fit">
                    <span className="j-fitbox" style={{ aspectRatio: `${images[i].w} / ${images[i].h}` } as CSSProperties}>
                      <img src={images[i].src} width={images[i].w} height={images[i].h} alt={labels[i]} decoding="async" fetchPriority="low" draggable={false} />
                      <span className="j-sheet-shadow" aria-hidden="true" />
                      <img className="j-sheet" src={images[1].src} width={images[1].w} height={images[1].h} alt="" decoding="async" draggable={false} />
                    </span>
                  </span>
                ) : (
                  <img
                    src={images[i].src}
                    width={images[i].w}
                    height={images[i].h}
                    alt={labels[i]}
                    decoding="async"
                    fetchPriority={i === 0 ? "high" : "low"}
                    draggable={false}
                  />
                )}
                <span className="j-floor" aria-hidden="true" />
              </figure>
            </article>
          ))}
          <p className="sr-only" aria-live="polite">Step {active + 1} of {count}: {labels[active]}</p>
        </div>

        <div className="j-track">
          <button className="round" aria-label="Previous step" disabled={active === 0} onClick={() => goToStep(active - 1)}><ArrowLeft size={17} /></button>
          <nav className="j-rail" aria-label="Manufacturing steps">
            <span className="j-rail-line" aria-hidden="true"><i ref={rail} /></span>
            {steps.map((s, i) => (
              <button
                key={s.title}
                className="j-node"
                data-state={i === active ? "active" : i < active ? "done" : "next"}
                aria-label={`Step ${i + 1}: ${labels[i]}`}
                aria-current={i === active ? "step" : undefined}
                onClick={() => goToStep(i)}
              >
                <b>{i + 1}</b>
                <small>{short[i]}</small>
              </button>
            ))}
          </nav>
          <button className="round" aria-label={last ? "Continue to the designs" : "Next step"} onClick={() => (last ? continueOn() : goToStep(active + 1))}>
            {last ? <ArrowDown size={17} /> : <ArrowRight size={17} />}
          </button>
        </div>
      </div>
    </section>
  );
}

/** Memoised: header and navigation state changes in the page must not re-render the film. */
export default memo(Journey);
