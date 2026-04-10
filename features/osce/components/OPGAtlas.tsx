"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import { Root as SwitchRoot, Thumb as SwitchThumb } from "@radix-ui/react-switch";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { OpgAtlasHotspot, OpgAtlasPanorama } from "@/features/osce/types";
import { usePinchZoom } from "@/hooks/usePinchZoom";
import { cn } from "@/lib/utils";

type OPGAtlasProps = {
  panoramas: OpgAtlasPanorama[];
};

function HotspotMarker({
  hotspot,
  index,
  showNames,
  wrapperSize,
  onOpen,
}: {
  hotspot: OpgAtlasHotspot;
  index: number;
  showNames: boolean;
  wrapperSize: { w: number; h: number };
  onOpen: () => void;
}) {
  const dimPct = Math.min(100, hotspot.radius_percent * 2);
  const minPx = 44;
  const sizeStyle =
    wrapperSize.w > 0
      ? {
          width: `${Math.max(minPx, (dimPct / 100) * wrapperSize.w)}px`,
          height: `${Math.max(minPx, (dimPct / 100) * wrapperSize.w)}px`,
        }
      : {
          width: `max(44px, ${dimPct}%)`,
          height: `max(44px, ${dimPct}%)`,
        };

  return (
    <div
      className="pointer-events-none absolute flex flex-col items-center"
      style={{
        left: `${hotspot.x_percent}%`,
        top: `${hotspot.y_percent}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 10 + index,
      }}
    >
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className="pointer-events-auto flex size-full min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 border-dashed border-brand-gold/80 bg-brand-gold/15 shadow-[0_0_0_4px_rgba(201,168,76,0.15)] animate-pulse outline-none transition hover:bg-brand-gold/25 focus-visible:ring-2 focus-visible:ring-brand-gold"
        style={sizeStyle}
        aria-label={`Struktura ${index + 1}: ${hotspot.name}`}
      >
        <span className="font-body text-sm font-semibold tabular-nums text-brand-gold">
          {index + 1}
        </span>
      </button>
      {showNames ? (
        <span
          className={cn(
            "pointer-events-none mt-1 max-w-[min(12rem,40vw)] text-center font-body text-body-xs leading-tight text-brand-gold",
            "drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]",
          )}
        >
          {hotspot.name}
        </span>
      ) : null}
    </div>
  );
}

function PanoramaViewer({
  panorama,
  showNames,
  onShowNamesChange,
  onClose,
}: {
  panorama: OpgAtlasPanorama;
  showNames: boolean;
  onShowNamesChange: (v: boolean) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const { containerRef, contentRef, contentStyle, resetView } = usePinchZoom({
    minScale: 1,
    maxScale: 4,
    doubleTapScale: 2,
    doubleTapDelayMs: 380,
  });

  const imageWrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperSize, setWrapperSize] = useState({ w: 0, h: 0 });
  const [popupHotspot, setPopupHotspot] = useState<OpgAtlasHotspot | null>(null);

  const sorted = useMemo(
    () => [...panorama.hotspots].sort((a, b) => a.id.localeCompare(b.id, "pl")),
    [panorama.hotspots],
  );

  useEffect(() => {
    resetView();
    setPopupHotspot(null);
  }, [panorama.id, resetView]);

  useEffect(() => {
    const el = imageWrapperRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setWrapperSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    setWrapperSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [panorama.id, panorama.imageUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (popupHotspot) setPopupHotspot(null);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, popupHotspot]);

  return (
    <motion.div
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="fixed inset-0 z-[80] flex flex-col bg-background"
    >
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-2 rounded-btn border border-brand-sage/40 px-3 py-2 font-body text-body-sm text-brand-sage transition hover:bg-brand-sage/10"
        >
          <ArrowLeft className="size-4 shrink-0" aria-hidden />
          Lista panoram
        </button>
        <h2 id={titleId} className="min-w-0 flex-1 font-heading text-heading-sm text-primary">
          {panorama.title}
        </h2>
        <div className="flex w-full shrink-0 items-center justify-end gap-3 sm:w-auto">
          <span className="font-body text-body-xs text-secondary">
            {showNames ? "Ukryj nazwy" : "Pokaż wszystkie nazwy"}
          </span>
          <SwitchRoot
            checked={showNames}
            onCheckedChange={onShowNamesChange}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors",
              "bg-[rgba(255,255,255,0.1)] data-[state=checked]:bg-brand-gold",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]",
            )}
            aria-label={showNames ? "Ukryj nazwy struktur" : "Pokaż wszystkie nazwy"}
          >
            <SwitchThumb
              className={cn(
                "block size-5 rounded-full bg-white shadow transition-transform duration-200",
                "translate-x-0 will-change-transform data-[state=checked]:translate-x-[22px]",
              )}
            />
          </SwitchRoot>
          <span className="hidden font-body text-body-xs text-muted sm:inline">
            {showNames ? "Tryb nauki" : "Tryb sprawdzania"}
          </span>
        </div>
      </header>

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden select-none"
        style={{ touchAction: "none" }}
      >
        <div
          ref={contentRef}
          style={contentStyle}
          className="flex h-full min-h-[200px] w-full items-center justify-center p-2"
        >
          <div ref={imageWrapperRef} className="relative inline-block max-h-full max-w-full">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element -- URL z Supabase / zewnętrzne */}
              <img
                src={panorama.imageUrl}
                alt=""
                className="pointer-events-none block max-h-[min(78dvh,900px)] w-auto max-w-full object-contain"
                draggable={false}
              />
              {sorted.map((h, i) => (
                <HotspotMarker
                  key={h.id}
                  hotspot={h}
                  index={i}
                  showNames={showNames}
                  wrapperSize={wrapperSize}
                  onOpen={() => setPopupHotspot(h)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <p className="shrink-0 px-4 py-2 font-body text-body-xs text-muted">
        Szczypanie: powiększenie. Podwójne tapnięcie: zoom / reset. Kliknij numer, aby zobaczyć opis.
      </p>

      <AnimatePresence>
        {popupHotspot ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[85] bg-black/55"
              aria-label="Zamknij panel"
              onClick={() => setPopupHotspot(null)}
            />
            <motion.div
              role="document"
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="fixed inset-x-0 bottom-0 z-[90] max-h-[min(70dvh,520px)] overflow-y-auto rounded-t-card border border-white/[0.08] bg-card p-5 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-heading text-heading-sm text-brand-gold">{popupHotspot.name}</p>
                  <p className="mt-3 font-body text-body-sm leading-relaxed text-secondary">
                    {popupHotspot.description}
                  </p>
                  {popupHotspot.clinicalSignificance ? (
                    <div className="mt-4 rounded-btn border border-white/[0.06] bg-background/80 p-4">
                      <p className="font-body text-body-xs font-medium uppercase tracking-wide text-muted">
                        Znaczenie kliniczne
                      </p>
                      <p className="mt-2 font-body text-body-sm leading-relaxed text-secondary">
                        {popupHotspot.clinicalSignificance}
                      </p>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setPopupHotspot(null)}
                  className="shrink-0 rounded-btn border border-white/[0.1] p-2 text-secondary hover:bg-white/[0.06]"
                  aria-label="Zamknij"
                >
                  <X className="size-5" />
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

export function OPGAtlas({ panoramas }: OPGAtlasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNames, setShowNames] = useState(true);

  const selected = useMemo(
    () => panoramas.find((p) => p.id === selectedId) ?? null,
    [panoramas, selectedId],
  );

  useEffect(() => {
    if (selectedId) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return undefined;
  }, [selectedId]);

  if (panoramas.length === 0) {
    return (
      <p className="font-body text-body-md text-secondary">
        Brak panoram w atlasie. Dodaj pytania typu „image_identify” w temacie morfologii OPG lub skontaktuj się z administratorem.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-6 font-body text-body-sm text-secondary">
        Wybierz panoramę, aby przejść do widoku z hotspotami. W panoramie możesz przełączać widoczność nazw oraz powiększać obraz gestem szczypania.
      </p>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {panoramas.map((p) => (
          <li key={p.id} className="list-none">
            <button
              type="button"
              onClick={() => setSelectedId(p.id)}
              className="group w-full overflow-hidden rounded-card border border-border bg-card text-left transition hover:border-brand-sage/50 hover:bg-card-hover"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt=""
                  className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.02]"
                />
              </div>
              <div className="p-4">
                <p className="font-heading text-heading-sm text-primary group-hover:text-brand-gold">
                  {p.title}
                </p>
                <p className="mt-1 font-body text-body-xs text-muted">
                  Liczba punktów: {p.hotspots.length}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {selected ? (
          <PanoramaViewer
            key={selected.id}
            panorama={selected}
            showNames={showNames}
            onShowNamesChange={setShowNames}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
