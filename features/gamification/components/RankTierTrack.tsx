"use client";

import { motion } from "framer-motion";
import { Fragment } from "react";
import { RANK_TIERS, getCurrentRank } from "@/features/gamification/lib/ranks";
import { cn } from "@/lib/utils";

export function RankTierTrack({ xp }: { xp: number }) {
  const cur = getCurrentRank(xp);
  const idx = RANK_TIERS.findIndex((r) => r.id === cur.id);

  // 11 tierów wymaga szerszego kontenera niż wcześniej (było 7). Zwiększamy
  // min-width tak, by labelki nie nachodziły na siebie na desktopie, ale na
  // mobile/tablecie scroll-x dalej trzyma layout w ryzach.
  const tierWidth = Math.max(72, Math.round(960 / RANK_TIERS.length));
  const trackWidth = Math.max(640, tierWidth * RANK_TIERS.length);

  // Symbol w kropce: dla prestige Mistrz LDEK pokazujemy "M·N°" dla rozróżnienia.
  function tierBadge(r: (typeof RANK_TIERS)[number]): string {
    if (r.id.startsWith("mistrz-")) {
      const n = r.id.split("-")[1] ?? "";
      return `M${n}`;
    }
    return r.name.charAt(0);
  }

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div
        className="flex items-center px-2"
        style={{ minWidth: `${trackWidth}px` }}
      >
        {RANK_TIERS.map((r, i) => (
          <Fragment key={r.id}>
            {i > 0 ? (
              <div
                className={cn(
                  "h-0.5 min-w-[12px] flex-1",
                  idx >= i ? "bg-brand-gold" : "bg-[rgba(255,255,255,0.08)]",
                )}
              />
            ) : null}
            <motion.div
              className={cn(
                "relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-full border-2 font-body text-[10px] font-semibold",
                i < idx && "border-brand-gold bg-brand-gold/20 text-brand-gold",
                i === idx &&
                  "border-brand-gold bg-brand-gold/30 text-brand-gold shadow-[0_0_12px_rgba(201,168,76,0.35)]",
                i > idx && "border-[rgba(255,255,255,0.15)] text-muted opacity-40",
              )}
              animate={i === idx ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 2, repeat: i === idx ? Infinity : 0, ease: "easeOut" }}
            >
              {tierBadge(r)}
            </motion.div>
          </Fragment>
        ))}
      </div>
      <div
        className="mt-3 flex justify-between px-0"
        style={{ minWidth: `${trackWidth}px` }}
      >
        {RANK_TIERS.map((r) => (
          <div
            key={r.id}
            className="text-center"
            style={{ width: `${tierWidth}px` }}
          >
            <p className="line-clamp-1 font-body text-[11px] text-secondary">{r.name}</p>
            <p className="mt-0.5 font-body text-[10px] text-muted">
              {r.maxXp === Number.POSITIVE_INFINITY
                ? `${r.minXp}+`
                : `${r.minXp}–${r.maxXp}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
