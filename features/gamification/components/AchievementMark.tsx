"use client";

import type { LucideIcon } from "lucide-react";
import { RycinaEmblem } from "@/features/shared/components/RycinaEmblem";
import { achievementRycinaId } from "@/features/shared/lib/rycinaCatalog";
import { cn } from "@/lib/utils";

export function AchievementMark({
  achievementId,
  Fallback,
  className,
  size = 32,
}: {
  achievementId: string;
  Fallback: LucideIcon;
  className?: string;
  size?: number;
}) {
  const rycinaId = achievementRycinaId(achievementId);
  if (rycinaId) {
    return <RycinaEmblem id={rycinaId} size={size} className={className} />;
  }
  return <Fallback className={cn("shrink-0", className)} style={{ width: size, height: size }} aria-hidden />;
}
