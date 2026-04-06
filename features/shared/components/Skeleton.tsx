import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: "text" | "card" | "circle";
};

export function Skeleton({
  className,
  width,
  height,
  variant = "text",
}: SkeletonProps) {
  const style: CSSProperties = {};
  if (width != null) style.width = typeof width === "number" ? `${width}px` : width;
  if (height != null) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={cn(
        "animate-pulse bg-[rgba(255,255,255,0.04)]",
        variant === "text" && "h-3 rounded-sm",
        variant === "card" && "min-h-[120px] rounded-card",
        variant === "circle" && "rounded-full",
        className,
      )}
      style={style}
      aria-hidden
    />
  );
}
