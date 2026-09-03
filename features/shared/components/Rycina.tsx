import Image from "next/image";
import { cn } from "@/lib/utils";

export type RycinaMask =
  | "radial"
  | "fade-left"
  | "fade-right"
  | "fade-y"
  | "corner"
  | "edge-right"
  | "edge-left"
  | "none";

type RycinaProps = {
  /** Nazwa pliku z `public/img/ryciny/` bez rozszerzenia, np. `hero-ldek-palate`. */
  id: string;
  /** Pozycjonowanie i rozmiar kontenera (absolute względem rodzica). */
  className?: string;
  /**
   * 0.28–0.38 za tekstem · 0.16–0.28 tło karty · 0.50–0.65 samodzielna figura.
   * Pomiń, gdy opacity sterujesz responsywnie klasami (`opacity-[0.18] lg:opacity-[0.34]`).
   */
  opacity?: number;
  mask?: RycinaMask;
  /** Hero: ładuj od razu. Reszta leniwie. */
  priority?: boolean;
  /** `cover` wypełnia kontener; default `contain` nie przycina rysunku. */
  fit?: "contain" | "cover";
  /**
   * `sage` nadpisuje kreskę z pliku na `#7FA697` (płyty pulpitu).
   * Default zostawia gold/sage zaszyte w SVG.
   */
  ink?: "file" | "sage";
};

const RYCINA_SAGE = "#7FA697";

const MASK_CLASS: Record<RycinaMask, string | undefined> = {
  radial: "rycina-mask-radial",
  "fade-left": "rycina-mask-fade-left",
  "fade-right": "rycina-mask-fade-right",
  "fade-y": "rycina-mask-fade-y",
  corner: "rycina-mask-corner",
  /** Rycina przy prawej krawędzi sekcji (zanika w lewo, ku treści). */
  "edge-right": "rycina-mask-edge-right",
  /** Rycina przy lewej krawędzi sekcji (zanika w prawo, ku treści). */
  "edge-left": "rycina-mask-edge-left",
  none: undefined,
};

/**
 * Dekoracyjna rycina z atlasu (SVG z zaszytym kolorem gold/sage).
 * Zawsze `aria-hidden`, zawsze z maską, kolor kreski jest w pliku.
 */
export function Rycina({
  id,
  className,
  opacity,
  mask = "radial",
  priority = false,
  fit = "contain",
  ink = "file",
}: RycinaProps) {
  const src = `/img/ryciny/${id}.svg`;
  const maskFit = fit === "cover" ? "cover" : "contain";

  if (ink === "sage") {
    return (
      <div
        aria-hidden="true"
        className={cn("pointer-events-none absolute select-none", MASK_CLASS[mask], className)}
        style={{
          backgroundColor: RYCINA_SAGE,
          opacity,
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: maskFit,
          maskSize: maskFit,
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute select-none", MASK_CLASS[mask], className)}
      style={opacity === undefined ? undefined : { opacity }}
    >
      <Image
        src={src}
        alt=""
        fill
        unoptimized
        priority={priority}
        draggable={false}
        className={fit === "cover" ? "object-cover" : "object-contain"}
      />
    </div>
  );
}

/** Subtle full-width plate — same treatment as the pulpit globe. */
export function DashboardPagePlate({ id }: { id: string }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0">
      <Rycina
        id={id}
        mask="fade-y"
        fit="contain"
        className="left-1/2 top-0 aspect-square w-full -translate-x-1/2 opacity-[0.10]"
      />
    </div>
  );
}
