"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  type Variants,
} from "framer-motion";
import {
  ArrowUpRight,
  ArrowDown,
  ArrowRight,
  Sparkles,
  Layers3,
  Fingerprint,
  Palette,
  X,
  Menu,
  Check,
  Upload,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { steps } from "./process";
const ThreeDScene = dynamic(() => import("./ThreeDScene"), {
  ssr: false,
  loading: () => (
    <div className="scene-loading">
      <i />
      Preparing your experience
    </div>
  ),
});
const designs = [
  {
    name: "Alpine memories",
    category: "THE PHOTO COLLECTION",
    className: "alpine",
  },
  {
    name: "Electric daydream",
    category: "THE COLOUR COLLECTION",
    className: "electric",
  },
  {
    name: "Less, but you",
    category: "THE MINIMAL COLLECTION",
    className: "minimal",
  },
];
const STAGES = 8;
/** Process progress (0–1) at which stage i has settled: camera arrived, copy shown. */
const stageRest = (i: number) => (i + 0.55) / STAGES;
/** Where each numbered node sits along the route-map path, as a fraction of its length. */
const NODE_AT = [0, 0.1495, 0.2991, 0.4486, 0.5514, 0.7009, 0.8505, 1];
const routeFill = (p: number) => {
  const f = gsap.utils.clamp(0, STAGES - 1, p * STAGES - 0.55);
  const i = Math.min(STAGES - 2, Math.floor(f));
  return NODE_AT[i] + (NODE_AT[i + 1] - NODE_AT[i]) * (f - i);
};
const easeOut = [0.22, 1, 0.36, 1] as const;
/** Splits a headline into masked lines for the line-by-line reveals. */
function Lines({ text, accentFrom }: { text: string[]; accentFrom?: number }) {
  return (
    <>
      {text.map((line, i) => (
        <span
          className={
            "line" +
            (accentFrom !== undefined && i >= accentFrom ? " accent" : "")
          }
          key={i}
        >
          <span className="line-inner" style={{ ["--i" as string]: i }}>
            {line}
          </span>
        </span>
      ))}
    </>
  );
}
export default function Studio() {
  const progress = useRef({ value: 0 });
  const heroScroll = useRef({ value: 0 });
  const section = useRef<HTMLElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const activeRef = useRef(0);
  const dirRef = useRef(1);
  const barRef = useRef<HTMLSpanElement>(null);
  const routeRef = useRef<SVGPathElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [nav, setNav] = useState<"top" | "shown" | "hidden">("top");
  const [menu, setMenu] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [selected, setSelected] = useState(0);
  const [photo, setPhoto] = useState("");
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // The manufacturing scene. Writes the bar and route directly so a scroll
      // tick only re-renders React when the stage actually changes.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.5,
            invalidateOnRefresh: true,
          },
          onUpdate() {
            const p = progress.current.value;
            const next = Math.min(STAGES - 1, Math.floor(p * STAGES));
            if (next !== activeRef.current) {
              dirRef.current = next > activeRef.current ? 1 : -1;
              activeRef.current = next;
              setActive(next);
            }
            if (barRef.current) barRef.current.style.transform = `scaleX(${p})`;
            if (routeRef.current)
              routeRef.current.style.strokeDashoffset = String(
                1 - routeFill(p),
              );
          },
        })
        .to(progress.current, { value: 1, duration: 8, ease: "none" });
      // Navigation: transparent at the top, hides while scrolling down and inside
      // the pinned journey (which has its own header), returns on scroll up.
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate(self) {
          const y = self.scroll();
          const el = section.current;
          const inJourney =
            !!el &&
            y >= el.offsetTop - 2 &&
            y < el.offsetTop + el.offsetHeight - window.innerHeight;
          const next =
            y < 60
              ? "top"
              : inJourney || self.direction === 1
                ? "hidden"
                : "shown";
          setNav((prev) => (prev === next ? prev : next));
        },
      });
    });
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lenis = new Lenis({ lerp: 0.085, anchors: true });
      lenisRef.current = lenis;
      const raf = (time: number) => lenis.raf(time * 1000);
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      // Settle on a stage once scrolling stops. Moving more than a nudge past a
      // stage carries on to the next one in that direction; a nudge springs back.
      let idle = 0;
      const settle = () => {
        const el = section.current;
        if (!el || lenis.isStopped) return;
        const span = el.offsetHeight - window.innerHeight;
        const p = (lenis.scroll - el.offsetTop) / span;
        if (p <= stageRest(0) || p >= stageRest(STAGES - 1)) return;
        const f = p * STAGES - 0.55;
        const base = Math.floor(f);
        const along = f - base;
        const i =
          lenis.direction >= 0
            ? along > 0.12
              ? base + 1
              : base
            : along < 0.88
              ? base
              : base + 1;
        const y = el.offsetTop + span * stageRest(i);
        if (Math.abs(y - lenis.scroll) > 2)
          lenis.scrollTo(y, {
            duration: 0.95,
            easing: (t) => 1 - Math.pow(1 - t, 4),
          });
      };
      const onScroll = () => {
        window.clearTimeout(idle);
        idle = window.setTimeout(settle, 170);
      };
      lenis.on("scroll", onScroll);
      // Hero exit: copy lifts and fades, the art sinks, orbits open up, and the
      // 3D cases turn with the page.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              heroScroll.current.value = self.progress;
            },
          },
        })
        .to(".hero-copy", { yPercent: -22, autoAlpha: 0.1, ease: "none" }, 0)
        .to(".hero-art", { y: 140, ease: "none" }, 0)
        .to(".orbit-one", { rotation: -14, scale: 1.14, ease: "none" }, 0)
        .to(".orbit-two", { rotation: -52, scale: 0.9, ease: "none" }, 0)
        .to(".hero-bottom", { autoAlpha: 0, y: -24, duration: 0.25 }, 0);
      // Marquee keeps drifting, follows the scroll direction, and surges with
      // scroll speed before easing back.
      const loop = gsap.to(marqueeRef.current, {
        xPercent: -50,
        duration: 36,
        ease: "none",
        repeat: -1,
      });
      loop.totalTime(loop.duration() * 100);
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate(self) {
          const boost = gsap.utils.clamp(
            1,
            7,
            1 + Math.abs(self.getVelocity()) / 260,
          );
          const dir = self.direction;
          gsap.to(loop, {
            timeScale: dir * boost,
            duration: 0.2,
            overwrite: true,
            onComplete: () => {
              gsap.to(loop, {
                timeScale: dir,
                duration: 1.4,
                ease: "power2.out",
              });
            },
          });
        },
      });
      // Headlines below the journey rise line by line as they enter.
      gsap.utils.toArray<HTMLElement>("[data-lines]").forEach((el) => {
        gsap.from(el.querySelectorAll(".line-inner"), {
          yPercent: 110,
          duration: 1.25,
          ease: "expo.out",
          stagger: 0.09,
          scrollTrigger: { trigger: el, start: "top 86%", once: true },
        });
      });
      // Cards and supporting copy arrive in staggered groups.
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
      items.forEach((el) => el.classList.add("reveal-pending"));
      gsap.set(items, { autoAlpha: 0, y: 60 });
      ScrollTrigger.batch(items, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 1.15,
            ease: "expo.out",
            stagger: 0.1,
            onComplete: () => {
              gsap.set(batch, { clearProps: "transform,opacity,visibility" });
              batch.forEach((el) => el.classList.remove("reveal-pending"));
            },
          }),
      });
      gsap.fromTo(
        ".cta-star",
        { rotation: -40 },
        {
          rotation: 140,
          ease: "none",
          scrollTrigger: {
            trigger: ".final-cta",
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
      return () => {
        window.clearTimeout(idle);
        items.forEach((el) => el.classList.remove("reveal-pending"));
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
        lenisRef.current = null;
      };
    });
    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);
  useEffect(() => {
    if (!customize) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    lenisRef.current?.stop();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCustomize(false);
      if (e.key === "Tab") {
        const items = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".customizer button,.customizer input",
          ),
        );
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    document.querySelector<HTMLButtonElement>(".close-modal")?.focus();
    return () => {
      document.body.style.overflow = before;
      lenisRef.current?.start();
      document.removeEventListener("keydown", handler);
    };
  }, [customize]);
  useEffect(
    () => () => {
      if (photo) URL.revokeObjectURL(photo);
    },
    [photo],
  );
  const goToStep = (i: number) => {
    const el = section.current;
    if (!el) return;
    const y =
      el.offsetTop + (el.offsetHeight - window.innerHeight) * stageRest(i);
    if (lenisRef.current) lenisRef.current.scrollTo(y, { duration: 1.6 });
    else window.scrollTo({ top: y, behavior: "instant" });
  };
  function download() {
    const a = document.createElement("a");
    a.href = photo || "/assets/alpine-cover-hd.jpg";
    a.download = "my-case-design.jpg";
    a.click();
    setSaved(true);
  }
  // Direction is read when each animation starts, so leaving a stage and
  // entering the next both move the same way the page is scrolling.
  const lineVariants: Variants = {
    enter: () => ({ y: dirRef.current > 0 ? "108%" : "-108%" }),
    center: { y: "0%", transition: { duration: 0.8, ease: easeOut } },
    exit: () => ({
      y: dirRef.current > 0 ? "-108%" : "108%",
      transition: { duration: 0.32, ease: [0.55, 0, 1, 0.45] },
    }),
  };
  const fadeVariants: Variants = {
    enter: () => ({ opacity: 0, y: dirRef.current * 18 }),
    center: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
    exit: () => ({
      opacity: 0,
      y: dirRef.current * -12,
      transition: { duration: 0.25 },
    }),
  };
  const navClass =
    "navbar" + (menu ? " is-shown" : nav === "top" ? "" : ` is-${nav}`);
  return (
    <MotionConfig reducedMotion="user">
      <main id="top">
        <a className="skip-link" href="#process">
          Skip to the process
        </a>
        <nav className={navClass}>
          <a href="#top" className="logo" aria-label="Case Studio home">
            case<span>STUDIO</span>
          </a>
          <div className={menu ? "nav-links open" : "nav-links"}>
            <a href="#process" onClick={() => setMenu(false)}>
              The process
            </a>
            <a href="#possibilities" onClick={() => setMenu(false)}>
              Possibilities
            </a>
            <a href="#why" onClick={() => setMenu(false)}>
              Why Case Studio
            </a>
          </div>
          <button className="nav-cta" onClick={() => setCustomize(true)}>
            Make it yours <ArrowUpRight size={15} />
          </button>
          <button
            className="menu-toggle"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </nav>
        <section className="hero">
          <div className="hero-grid" />
          <div className="hero-copy">
            <div className="eyebrow intro" style={{ ["--d" as string]: 0 }}>
              <span className="status-dot" /> A LITTLE YOU. EVERYWHERE.
            </div>
            <h1>
              <Lines
                text={[
                  "Customize",
                  "your world.",
                  "Print your",
                  "imagination.",
                ]}
                accentFrom={2}
              />
            </h1>
            <p className="intro" style={{ ["--d" as string]: 5 }}>
              Turn the things you love into the case you carry.
              <br className="desktop-break" /> A personal story. A beautiful
              process. Entirely yours.
            </p>
            <a
              className="button dark intro"
              style={{ ["--d" as string]: 6 }}
              href="#process"
            >
              Explore the process <ArrowDown size={17} />
            </a>
            <div className="hero-note intro" style={{ ["--d" as string]: 7 }}>
              <span>✳</span> Your imagination. Our canvas.
            </div>
          </div>
          <div className="hero-art">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <span className="art-caption">
              DESIGNED BY YOU.
              <br />
              MADE FOR YOUR EVERYDAY.
            </span>
            <ThreeDScene hero scroll={heroScroll} />
            <div className="floating-tag">
              <span className="status-dot" /> One of a kind. Just like you.
            </div>
            <span className="vertical-label">
              Case Studio / PERSONAL EXPRESSION SERIES — 001
            </span>
          </div>
          <div className="hero-bottom">
            <span>SCROLL TO SEE HOW IT'S MADE</span>
            <span className="scroll-cue" aria-hidden="true">
              <ArrowDown size={16} />
            </span>
            <span>01 — 08 / FROM IDEA TO REALITY</span>
          </div>
        </section>
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track" ref={marqueeRef}>
            {[0, 1].map((copy) => (
              <div className="marquee-group" key={copy}>
                {[0, 1, 2].map((k) => (
                  <span className="marquee-phrase" key={k}>
                    YOUR MEMORIES. YOUR COLOURS. YOUR RULES. <span>✳</span>
                    MADE OF YOUR IMAGINATION. <span>✳</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <section id="process" ref={section} className="process-scroll">
          <div className="process-pin">
            <div className="process-top">
              <span className="eyebrow">THE ART OF MAKING IT YOURS</span>
              <span className="process-counter">
                <span className="sr-only">
                  Step {active + 1} of {STAGES}
                </span>
                <span aria-hidden="true">0</span>
                <span className="counter-roll" aria-hidden="true">
                  <span style={{ transform: `translateY(${-active * 12.5}%)` }}>
                    {steps.map((_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </span>
                </span>
                <span className="counter-total" aria-hidden="true">
                  {" "}
                  / 08
                </span>
              </span>
              <span className="process-progress" aria-hidden="true">
                <span ref={barRef} />
              </span>
            </div>
            <div className="process-copy" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  variants={{
                    center: { transition: { staggerChildren: 0.07 } },
                    exit: { transition: { staggerChildren: 0.03 } },
                  }}
                >
                  <motion.span className="eyebrow teal" variants={fadeVariants}>
                    {steps[active].detail}
                  </motion.span>
                  <h2>
                    {steps[active].headline.split("\n").map((line, i) => (
                      <span className="line" key={i}>
                        <motion.span
                          className="line-inner"
                          variants={lineVariants}
                        >
                          {line}
                        </motion.span>
                      </span>
                    ))}
                  </h2>
                  <motion.p variants={fadeVariants}>
                    {steps[active].description}
                  </motion.p>
                  <motion.div className="stage-tag" variants={fadeVariants}>
                    <span /> {steps[active].title}
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="process-scene">
              <ThreeDScene progress={progress} />
            </div>
            <div className="scene-caption">
              <span className="crosshair">+</span>
              <span className="caption-text" key={active}>
                {steps[active].tag}
              </span>
              <span className="crosshair">+</span>
            </div>
            <div className="process-bottom">
              <div className="path-map">
                <svg
                  viewBox="0 0 500 90"
                  role="img"
                  aria-label="Eight-step S-shaped manufacturing path"
                >
                  <path
                    d="M25 20H445C492 20 492 70 445 70H25"
                    fill="none"
                    stroke="#c5e8e4"
                    strokeWidth="3"
                  />
                  <path
                    ref={routeRef}
                    d="M25 20H445C492 20 492 70 445 70H25"
                    fill="none"
                    stroke="#08bfc0"
                    strokeWidth="3"
                    strokeLinecap="round"
                    pathLength="1"
                    strokeDasharray="1"
                    strokeDashoffset="1"
                  />
                  {steps.map((step, i) => {
                    const x = i < 4 ? 25 + i * 140 : 445 - (i - 4) * 140;
                    const y = i < 4 ? 20 : 70;
                    return (
                      <g
                        key={i}
                        className={
                          "map-step" + (i === active ? " current" : "")
                        }
                        role="button"
                        tabIndex={0}
                        aria-label={`Go to step ${i + 1}: ${step.title}`}
                        aria-current={i === active ? "step" : undefined}
                        onClick={() => goToStep(i)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            goToStep(i);
                          }
                        }}
                      >
                        {i === active && (
                          <circle className="map-pulse" cx={x} cy={y} r="12" />
                        )}
                        <circle
                          cx={x}
                          cy={y}
                          r="12"
                          fill={i <= active ? "#08bfc0" : "#e5f5f2"}
                        />
                        <text
                          x={x}
                          y={y + 4}
                          textAnchor="middle"
                          fill={i <= active ? "white" : "#667c79"}
                          fontSize="11"
                        >
                          {i + 1}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              <span className="scroll-instruction">
                {active === STAGES - 1 ? "CONTINUE" : "KEEP SCROLLING"}
                <br />
                <span className="scroll-cue">
                  <ArrowDown size={15} />
                </span>
              </span>
              <a href="#why" className="skip-process">
                Skip the journey <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </section>
        <section className="features section" id="why">
          <div className="section-heading">
            <div>
              <span className="eyebrow teal" data-reveal>
                THOUGHTFULLY MADE. PERSONALLY YOURS.
              </span>
              <h2 data-lines>
                <Lines text={["More than a case.", "A little piece of you."]} />
              </h2>
            </div>
            <p data-reveal>
              From the first spark to the final finish,
              <br />
              every step has a purpose.
            </p>
          </div>
          <div className="feature-grid">
            {[
              {
                icon: Palette,
                title: "Your creativity, unfiltered.",
                text: "A favourite photo. An unexpected colour. A design that could only be yours.",
              },
              {
                icon: Layers3,
                title: "A process with purpose.",
                text: "Eight connected stages bring your idea from the screen into your hands.",
              },
              {
                icon: Fingerprint,
                title: "Personal in every detail.",
                text: "Your composition wraps an everyday essential in something meaningful.",
              },
              {
                icon: Sparkles,
                title: "Made to make you smile.",
                text: "Keep a little reminder of your favourite people, places, and moments close.",
              },
            ].map((f, i) => (
              <article className="feature" key={f.title} data-reveal>
                <span className="feature-number">0{i + 1}</span>
                <div className="feature-icon">
                  <f.icon size={30} strokeWidth={1.3} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="gallery section" id="possibilities">
          <div className="section-heading">
            <div>
              <span className="eyebrow teal" data-reveal>
                NO TWO STORIES ARE THE SAME
              </span>
              <h2 data-lines>
                <span className="line">
                  <span className="line-inner">A case for</span>
                </span>
                <span className="line">
                  <span className="line-inner">
                    <em>every kind of you.</em>
                  </span>
                </span>
              </h2>
            </div>
            <button
              className="text-button"
              data-reveal
              onClick={() => setCustomize(true)}
            >
              Find your canvas <ArrowUpRight size={18} />
            </button>
          </div>
          <div className="gallery-grid">
            {designs.map((d, i) => (
              <button
                className={"product-card " + d.className}
                key={d.name}
                data-reveal
                onClick={() => {
                  setSelected(i);
                  setCustomize(true);
                  setSaved(false);
                }}
              >
                <div className="product-card-top">
                  <span>0{i + 1} / EXPRESSION SERIES</span>
                  <ArrowUpRight size={19} />
                </div>
                <div className={"css-case " + d.className}>
                  <div className="camera-hole" />
                  {i === 2 && (
                    <span>
                      less,
                      <br />
                      <i>but me.</i>
                    </span>
                  )}
                </div>
                <div className="product-card-bottom">
                  <span>{d.category}</span>
                  <h3>{d.name}</h3>
                </div>
              </button>
            ))}
          </div>
        </section>
        <section className="final-cta">
          <span className="eyebrow" data-reveal>
            LET'S MAKE SOMETHING PERSONAL
          </span>
          <h2 data-lines>
            <Lines
              text={["Your design.", "Your style.", "Your phone case."]}
              accentFrom={2}
            />
          </h2>
          <button
            className="button light"
            data-reveal
            onClick={() => setCustomize(true)}
          >
            Start customizing <ArrowUpRight size={19} />
          </button>
          <span className="cta-star" aria-hidden="true">
            ✳
          </span>
          <div className="cta-bottom">
            <span>FROM YOUR IMAGINATION, INTO YOUR HANDS.</span>
            <span>MADE YOUR WAY.</span>
          </div>
        </section>
        <footer>
          <a className="logo" href="#top">
            case<span>STUDIO</span>
          </a>
          <p>Made of your imagination.</p>
          <div>
            <a href="#process">The process</a>
            <a href="#possibilities">Possibilities</a>
            <button onClick={() => setCustomize(true)}>
              Design studio <ArrowUpRight size={13} />
            </button>
          </div>
          <span>
            © {new Date().getFullYear()} Case Studio · Concept experience
          </span>
        </footer>
        {customize && (
          <div
            className="modal-backdrop"
            data-lenis-prevent
            onClick={(e) => {
              if (e.target === e.currentTarget) setCustomize(false);
            }}
          >
            <section
              className="customizer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="customizer-title"
            >
              <button
                className="close-modal"
                aria-label="Close design studio"
                onClick={() => setCustomize(false)}
              >
                <X />
              </button>
              <div
                className={"customizer-preview " + designs[selected].className}
              >
                <div
                  className={"css-case " + designs[selected].className}
                  style={
                    photo
                      ? {
                          backgroundImage: `url("${photo}")`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  <div className="camera-hole" />
                  {selected === 2 && !photo && (
                    <span>
                      less,
                      <br />
                      <i>but me.</i>
                    </span>
                  )}
                </div>
                <span>YOUR EVERYDAY. REIMAGINED.</span>
              </div>
              <div className="customizer-content">
                <span className="eyebrow teal">YOUR DESIGN STUDIO</span>
                <h2 id="customizer-title">
                  Make room
                  <br />
                  for your story.
                </h2>
                <p>
                  Choose a starting point or upload your own photo to preview
                  your case. This is a design preview; no order is placed.
                </p>
                <div className="design-options">
                  {designs.map((d, i) => (
                    <button
                      key={d.name}
                      className={selected === i ? "selected" : ""}
                      onClick={() => {
                        setSelected(i);
                        setPhoto("");
                        setSaved(false);
                      }}
                    >
                      {d.name}
                      {selected === i && <Check size={14} />}
                    </button>
                  ))}
                </div>
                <label className="upload-label">
                  <Upload size={17} /> Upload your photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhoto(URL.createObjectURL(file));
                        setSaved(false);
                      }
                    }}
                  />
                </label>
                <button
                  className="button dark"
                  disabled={selected !== 0 && !photo}
                  onClick={download}
                >
                  {saved
                    ? "Artwork saved"
                    : selected !== 0 && !photo
                      ? "Upload a photo to save artwork"
                      : "Save your artwork"}
                  {saved ? <Check size={16} /> : <ArrowRight size={16} />}
                </button>
                <small>
                  Photos stay in your browser. Save downloads the original photo
                  artwork.
                </small>
              </div>
            </section>
          </div>
        )}
      </main>
    </MotionConfig>
  );
}
