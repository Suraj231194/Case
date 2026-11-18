"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowDown, ArrowUpRight, Check, Menu, Upload, X } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Journey, { number } from "./Journey";
import { steps } from "./process";
import { ARTWORK, Photo } from "./media";
import { CaseFace } from "./CaseArt";

const designs = [
  { name: "Alpine memories", style: "alpine", type: "Photography", note: "Your photo, edge to edge." },
  { name: "Electric daydream", style: "electric", type: "Colour", note: "A field of moving colour." },
  { name: "Less, but you", style: "minimal", type: "Typography", note: "Quiet type, one line." },
] as const;

function CasePreview({ index, photo }: { index: number; photo?: string }) {
  return <CaseFace variant={designs[index].style} photo={photo} />;
}

function tilt(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = event.currentTarget;
  const b = el.getBoundingClientRect();
  const x = (event.clientX - b.left) / b.width;
  const y = (event.clientY - b.top) / b.height;
  el.style.setProperty("--rx", `${(0.5 - y) * 16}deg`);
  el.style.setProperty("--ry", `${(x - 0.5) * 22}deg`);
  el.style.setProperty("--mx", `${x * 100}%`);
  el.style.setProperty("--my", `${y * 100}%`);
}

function resetTilt(event: PointerEvent<HTMLElement>) {
  for (const p of ["--rx", "--ry", "--mx", "--my"]) event.currentTarget.style.removeProperty(p);
}

/** Primary buttons lean a little toward the pointer. */
function magnet(event: PointerEvent<HTMLElement>) {
  if (event.pointerType !== "mouse") return;
  const el = event.currentTarget;
  const b = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${((event.clientX - b.left) / b.width - 0.5) * 14}px`);
  el.style.setProperty("--my", `${((event.clientY - b.top) / b.height - 0.5) * 10}px`);
}

function unmagnet(event: PointerEvent<HTMLElement>) {
  event.currentTarget.style.removeProperty("--mx");
  event.currentTarget.style.removeProperty("--my");
}

const magnetic = { onPointerMove: magnet, onPointerLeave: unmagnet, "data-magnetic": true } as const;

export default function Studio() {
  const lenisRef = useRef<Lenis | null>(null);
  const hero = useRef<HTMLElement>(null);
  const finale = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [inJourney, setInJourney] = useState(false);
  const [section, setSection] = useState("");
  const [selected, setSelected] = useState(0);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!photo) {
      setPhotoUrl("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  // Header state and the page progress line, driven by native scroll (Lenis scrolls the window too).
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
        setScrolled(window.scrollY > 40);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // The navigation marks the section that fills the middle of the screen.
  useEffect(() => {
    const ids = ["process", "designs"];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setSection(entry.target.id);
        else setSection((current) => (current === entry.target.id ? "" : current));
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Section headings and cards fade up once as they enter the screen.
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-rise]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("menu-open", menu);
    if (menu) lenisRef.current?.stop();
    else if (!dialog.current?.open) lenisRef.current?.start();
  }, [menu]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ lerp: 0.085, anchors: true, wheelMultiplier: 0.9 });
      lenisRef.current = lenis;
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      lenis.on("scroll", ScrollTrigger.update);

      // Hero: the photograph sinks and the case rises as the page scrolls away.
      const h = { trigger: hero.current, start: "top top", end: "bottom top", scrub: true };
      gsap.to(".hero-bg img", { yPercent: 16, scale: 1.18, ease: "none", scrollTrigger: h });
      gsap.to(".hero-inner", { yPercent: -22, opacity: 0, ease: "none", scrollTrigger: h });
      gsap.to(".hero-object", { yPercent: -34, rotate: -6, ease: "none", scrollTrigger: h });

      // Finale: a framed photograph opens out to fill the screen.
      const f = { trigger: finale.current, start: "top bottom", end: "bottom bottom", scrub: true };
      // Scaling a rounded frame stays on the GPU; animating clip-path repaints every frame.
      gsap.fromTo(".finale-media", { scale: 0.62 }, { scale: 1, ease: "none", scrollTrigger: f });
      gsap.fromTo(".finale-media img", { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: f });
      gsap.fromTo(".finale-copy", { y: 80, opacity: 0 }, { y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: finale.current, start: "center bottom", end: "bottom bottom", scrub: true } });

      return () => {
        gsap.ticker.remove(raf);
        lenis.destroy();
        lenisRef.current = null;
      };
    });

    return () => media.revert();
  }, []);

  const onJourney = useCallback((on: boolean) => setInJourney(on), []);
  // Stable, so the memoised film does not re-render; openStudio only uses refs and state setters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const openFromJourney = useCallback(() => openStudio(), []);

  function openStudio(index?: number) {
    if (index !== undefined) {
      setSelected(index);
      setPhoto(null);
    }
    setSaved(false);
    setMenu(false);
    if (!dialog.current?.open) {
      dialog.current?.showModal();
      lenisRef.current?.stop();
    }
  }

  function download() {
    const link = document.createElement("a");
    link.href = photoUrl || ARTWORK;
    link.download = photo?.name || "my-case-design.jpg";
    link.click();
    setSaved(true);
  }

  const headerClass = ["site-header", scrolled && "is-scrolled", inJourney && !menu && "is-hidden", menu && "is-open"].filter(Boolean).join(" ");

  return (
    <>
      <a className="skip-link" href="#process">Skip to the process</a>
      <div className="grain" aria-hidden="true" />
      <div className="page-progress" aria-hidden="true"><i ref={bar} /></div>

      <header className={headerClass} id="top">
        <a className="wordmark" href="#top" aria-label="Case Studio home" onClick={() => setMenu(false)}>
          <i aria-hidden="true" /><span>Case</span><em>Studio</em>
        </a>
        <nav className="site-nav" id="site-nav" aria-label="Main">
          <a href="#process" aria-current={section === "process" ? "true" : undefined} onClick={() => setMenu(false)}><small>01</small>The process</a>
          <a href="#designs" aria-current={section === "designs" ? "true" : undefined} onClick={() => setMenu(false)}><small>02</small>Designs</a>
          <button className="btn btn-gold nav-cta" onClick={() => openStudio()}>Design your case <ArrowUpRight size={16} /></button>
        </nav>
        <button className="btn btn-glass header-cta" onClick={() => openStudio()} {...magnetic}>Design your case <ArrowUpRight size={15} /></button>
        <button className="round menu-toggle" aria-controls="site-nav" aria-expanded={menu} aria-label={menu ? "Close navigation" : "Open navigation"} onClick={() => setMenu(!menu)}>
          {menu ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      <main>
        <section className="hero" ref={hero}>
          <div className="hero-bg" aria-hidden="true">
            <Photo name="press-open" alt="" eager />
          </div>
          <div className="hero-grade" aria-hidden="true" />
          <div className="hero-inner">
            <p className="eyebrow intro" style={{ "--d": "0.15s" } as CSSProperties}><i /> Personal phone cases, pressed by hand</p>
            <h1 className="hero-title">
              <span className="line"><span style={{ "--d": "0.25s" } as CSSProperties}>Made of</span></span>
              <span className="line"><em style={{ "--d": "0.4s" } as CSSProperties}>your imagination.</em></span>
            </h1>
            <p className="hero-lede intro" style={{ "--d": "0.65s" } as CSSProperties}>
              Turn a favourite photograph into the case you carry. Follow it from screen to shell in eight stages.
            </p>
            <div className="hero-actions intro" style={{ "--d": "0.8s" } as CSSProperties}>
              <a className="btn btn-gold" href="#process" {...magnetic}>Begin the journey <ArrowDown size={17} /></a>
              <button className="btn btn-glass" onClick={() => openStudio()} {...magnetic}>Open the studio <ArrowUpRight size={16} /></button>
            </div>
          </div>
          <div className="hero-object intro" style={{ "--d": "0.5s" } as CSSProperties}>
            <div className="hero-orbit" aria-hidden="true"><i /><i /></div>
            <div className="tilt hero-case" onPointerMove={tilt} onPointerLeave={resetTilt}>
              <CasePreview index={0} />
            </div>
            <p className="hero-badge"><b>01 — 08</b> From a photo to the press</p>
          </div>
          <div className="hero-foot" aria-hidden="true">
            <span className="scroll-cue"><i /> Scroll</span>
            <span>Heat · Ink · Shell</span>
          </div>
        </section>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map((r) => (
              <div className="marquee-run" key={r}>
                {steps.map((s, i) => (
                  <span key={s.title}><b>{number(i)}</b>{s.title}<i>✦</i></span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="tone tone-in" aria-hidden="true" />
        <Journey lenis={lenisRef} onDesign={openFromJourney} onActiveChange={onJourney} />
        <div className="tone tone-out" aria-hidden="true" />

        <section className="library shell" id="designs" aria-labelledby="designs-title">
          <div className="section-head" data-rise>
            <p className="eyebrow"><i /> Design library</p>
            <h2 id="designs-title">Find your <em>starting point.</em></h2>
            <p>Choose a design to preview on your case, or upload a photograph of your own.</p>
          </div>
          <div className="library-grid">
            {designs.map((d, i) => (
              <button key={d.name} className={"design-card tilt " + d.style} onClick={() => openStudio(i)} onPointerMove={tilt} onPointerLeave={resetTilt} data-rise style={{ "--i": i } as CSSProperties}>
                <span className="design-glare" aria-hidden="true" />
                <span className="design-type">{String(i + 1).padStart(2, "0")} · {d.type}</span>
                <CasePreview index={i} />
                <span className="design-name">{d.name}<ArrowUpRight size={20} /></span>
                <span className="design-note">{d.note}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="finale" ref={finale} aria-labelledby="finale-title">
          <div className="finale-pin">
            <div className="finale-media"><Photo name="press-plate" alt="The turquoise heat press with its clear lid raised" /></div>
            <div className="finale-shade" aria-hidden="true" />
            <div className="finale-copy">
              <p className="eyebrow"><i /> Your turn</p>
              <h2 id="finale-title">Put a memory<br /><em>in your pocket.</em></h2>
              <button className="btn btn-gold" onClick={() => openStudio()} {...magnetic}>Open the design studio <ArrowUpRight size={18} /></button>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top shell" data-rise>
          <p>From a photograph to a pressed, personal case, in eight stages.</p>
          <nav aria-label="Footer">
            <a href="#process">The process</a>
            <a href="#designs">Designs</a>
            <button onClick={() => openStudio()}>Design studio <ArrowUpRight size={14} /></button>
          </nav>
        </div>
        <a className="footer-mark" href="#top" aria-label="Back to top">Case <em>Studio</em></a>
        <div className="footer-base shell">
          <span>Made of your imagination</span>
          <a href="#top">Back to top ↑</a>
        </div>
      </footer>

      <dialog
        ref={dialog}
        className="customizer"
        aria-labelledby="customizer-title"
        data-lenis-prevent
        onClose={() => { if (!menu) lenisRef.current?.start(); }}
        onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}
      >
        <div className="dialog-grid">
          <div className={"dialog-preview " + designs[selected].style}>
            <div className="tilt dialog-case" onPointerMove={tilt} onPointerLeave={resetTilt}>
              <CasePreview index={selected} photo={photoUrl} />
            </div>
            <span className="dialog-caption">Live preview · {photo ? "Your photo" : designs[selected].name}</span>
          </div>
          <div className="dialog-content">
            <button className="round close-dialog" aria-label="Close design studio" onClick={() => dialog.current?.close()} autoFocus><X size={18} /></button>
            <p className="eyebrow"><i /> Design studio</p>
            <h2 id="customizer-title">Make it <em>personal.</em></h2>
            <p className="dialog-lede">Pick a design or upload a photo to preview it on your case.</p>
            <div className="design-options" role="group" aria-label="Choose a design">
              {designs.map((d, i) => (
                <button
                  key={d.name}
                  aria-pressed={selected === i && !photo}
                  onClick={() => { setSelected(i); setPhoto(null); setSaved(false); }}
                >
                  <span className={"swatch " + d.style} aria-hidden="true" />
                  <span>{d.name}<small>{d.type}</small></span>
                  {selected === i && !photo && <Check size={16} />}
                </button>
              ))}
            </div>
            <label className="upload">
              <Upload size={17} /> {photo ? "Replace photo" : "Upload a photo"}
              <input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) { setPhoto(file); setSaved(false); }
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {photo && <p className="photo-name">{photo.name}</p>}
            <button className="btn btn-gold save" disabled={!photoUrl && (selected !== 0 || !!photo)} onClick={download}>
              {saved ? "Artwork saved" : "Save artwork"} {saved ? <Check size={16} /> : <ArrowDown size={16} />}
            </button>
            <small className="dialog-note">
              {selected !== 0 && !photo ? "Upload a photo to enable downloads for this design." : "Photos stay in your browser. The download contains the original image."}
            </small>
          </div>
        </div>
      </dialog>
    </>
  );
}
