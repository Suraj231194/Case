export type CaseVariant = "alpine" | "electric" | "minimal" | "blank";

/** A phone case drawn in CSS with a little depth: a back layer, the printed face and gloss. */
export function CaseFace({ variant, photo }: { variant: CaseVariant; photo?: string }) {
  return (
    <div className={"case3d " + variant} aria-hidden="true">
      <div className="case3d-back" />
      <div className="case3d-face" style={photo ? { backgroundImage: `url(${JSON.stringify(photo)})` } : undefined}>
        {variant === "minimal" && !photo && <span className="case3d-type">less,<br /><em>but me.</em></span>}
        <span className="case3d-camera"><i /><i /><i /></span>
        <span className="case3d-gloss" />
      </div>
    </div>
  );
}
