"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AchievementMark({
  Fallback,
  className,
  size = 32,
}: {
  achievementId: string;
  Fallback: LucideIcon;
  className?: string;
  size?: number;
}) {
  return (
    <Fallback
      className={cn("shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
