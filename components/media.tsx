export const ARTWORK = "/assets/alpine-cover-hd.jpg";
const HD = "/assets/hd/";

/** Large and compact sources for a photo name; "artwork" is the case artwork itself. */
export function photoSources(name: string) {
  if (name === "artwork") return { large: ARTWORK, small: ARTWORK };
  return { large: HD + name + ".webp", small: HD + name + "-sm.webp" };
}

export function Photo({
  name,
  alt,
  eager = false,
  className,
  sizes = "100vw",
}: {
  name: string;
  alt: string;
  eager?: boolean;
  className?: string;
  sizes?: string;
}) {
  const { large, small } = photoSources(name);
  const responsive = large !== small;
  return (
    <img
      className={className}
      src={large}
      srcSet={responsive ? `${small} 1080w, ${large} 2560w` : undefined}
      sizes={responsive ? sizes : undefined}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined}
      decoding="async"
      draggable={false}
    />
  );
}
