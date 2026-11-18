/** Share of each stage spent travelling to it; the rest of the stage holds on it. */
export const TRAVEL = 0.36;

/** The eight ordered stages of the journey, with the photograph and accent each one uses. */
export const steps = [
  {
    title: "Design App",
    chapter: "Create",
    headline: "A little imagination.\nA world of possibility.",
    description:
      "Start with a memory, a photograph, or something entirely you. Compose your design in the design app.",
    tag: "Your idea starts here",
    photo: "artwork",
    photoAlt: "Skier in a pink jacket against the snowy Alps, the artwork used for the case",
    caption: "The original image",
    accent: "#f4a6c6",
  },
  {
    title: "Sublimation Paper",
    chapter: "Prepare",
    headline: "Every great design\nstarts with a blank.",
    description:
      "A clean sublimation sheet becomes the canvas for your personal design, ready for the next stage.",
    tag: "Room for possibility",
    photo: "press-lid",
    photoAlt: "The white silicone gasket framing the heating plate inside the press lid",
    caption: "A clean, white frame",
    accent: "#f1ece2",
  },
  {
    title: "L8058 Printer",
    chapter: "Print",
    headline: "From pixels\nto something tangible.",
    description:
      "The L8058 printer brings your artwork onto sublimation paper. Watch your design emerge, one detail at a time.",
    tag: "Imagination, in colour",
    photo: "press-front",
    photoAlt: "The closed press on the workbench with the printer beside it",
    caption: "The printer, beside the press",
    accent: "#93b8ff",
  },
  {
    title: "Sublimation Film",
    chapter: "Reveal",
    headline: "Your story.\nReady to transfer.",
    description:
      "Your printed artwork is prepared for the heat-transfer stage, keeping the composition you made your own.",
    tag: "A memory takes shape",
    photo: "press-open",
    photoAlt: "The heat press opened, its chamber ready for the printed film",
    caption: "The chamber, open and waiting",
    accent: "#ffb48a",
  },
  {
    title: "Sublimation Heat Press",
    chapter: "Transfer",
    headline: "A little heat.\nA beautiful transformation.",
    description:
      "The turquoise heat press brings the film and case together. Its lid closes as the transfer takes place.",
    tag: "Where it comes together",
    photo: "press-in-use",
    photoAlt: "A gloved hand closing the turquoise heat press",
    caption: "The lid comes down",
    accent: "#7fe0d2",
  },
  {
    title: "Universal Mould",
    chapter: "Shape",
    headline: "The shape\nof a perfect fit.",
    description:
      "The universal mould supports the case during the transfer, giving your design a carefully formed foundation.",
    tag: "Designed in every dimension",
    photo: "mould",
    photoAlt: "The aluminium universal mould seated in the press chamber, seen from above",
    caption: "The universal mould",
    accent: "#c9d3d6",
  },
  {
    title: "Blank Phone Case",
    chapter: "Prime",
    headline: "The everyday.\nAbout to be extraordinary.",
    description:
      "A white phone case, with its precisely shaped camera opening, is ready to become something personal.",
    tag: "One last transformation",
    photo: "blank-shell",
    photoAlt: "A blank white phone case on the mould inside the open press",
    caption: "The blank shell",
    accent: "#ece6da",
  },
  {
    title: "Customized Phone Case",
    chapter: "Own",
    headline: "Customize your\nexclusive phone case.",
    description:
      "From your imagination to a beautifully personalized phone case. Your memory, made to go everywhere.",
    tag: "Made of your imagination",
    photo: "case-samples",
    photoAlt: "A row of finished, fully printed phone cases",
    caption: "Finished cases",
    accent: "#e6c897",
  },
] as const;

export type Step = (typeof steps)[number];
