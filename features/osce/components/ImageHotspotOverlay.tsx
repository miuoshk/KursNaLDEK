"use client";

import { useMemo } from "react";
import type { ImageIdentifyHotspot } from "@/features/osce/components/ImageIdentifyQuestion";
import { cn } from "@/lib/utils";

export type ImageHotspotOverlayProps = {
  hotspots: ImageIdentifyHotspot[];
  wrapperSize: { w: number; h: number };
  checked: boolean;
  identifySelections: Record<string, string>;
  labelOutcome: Record<string, boolean>;
  mode: "identify" | "label";
  labelStep: number;
};

function isCorrectAt(
  hid: string,
  hotspotList: ImageIdentifyHotspot[],
  mode: "identify" | "label",
  identifySelections: Record<string, string>,
  labelOutcome: Record<string, boolean>,
): boolean {
  const h = hotspotList.find((x) => x.id === hid);
  if (!h) return false;
  if (mode === "identify") {
    return identifySelections[hid]?.trim() === h.correct_label;
  }
  return Boolean(labelOutcome[hid]);
}

export function ImageHotspotOverlay({
  hotspots,
  wrapperSize,
  checked,
  identifySelections,
  labelOutcome,
  mode,
  labelStep: _labelStep,
}: ImageHotspotOverlayProps) {
  const sortedHotspots = useMemo(
    () => [...hotspots].sort((a, b) => a.id.localeCompare(b.id)),
    [hotspots],
  );

  return (
    <>
      {sortedHotspots.map((h, i) => {
        const showNum = true;
        const correct = checked
          ? isCorrectAt(h.id, hotspots, mode, identifySelections, labelOutcome)
          : null;
        const dimPct = Math.min(100, h.radius_percent * 2);
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
            key={h.id}
            className="pointer-events-none absolute flex items-center justify-center"
            style={{
              left: `${h.x_percent}%`,
              top: `${h.y_percent}%`,
              transform: "translate(-50%, -50%)",
              ...sizeStyle,
            }}
          >
            <div
              className={cn(
                "flex size-full items-center justify-center rounded-full border-2 border-dashed border-brand-gold/70 bg-brand-gold/10",
                "animate-pulse shadow-[0_0_0_4px_rgba(201,168,76,0.12)]",
                checked &&
                  correct === true &&
                  "border-success bg-success/15 shadow-[0_0_0_4px_rgba(74,222,128,0.2)]",
                checked &&
                  correct === false &&
                  "border-error bg-error/15 shadow-[0_0_0_4px_rgba(248,113,113,0.2)]",
              )}
            >
              {showNum ? (
                <span className="font-body text-sm font-semibold tabular-nums text-brand-gold">
                  {i + 1}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </>
  );
}
