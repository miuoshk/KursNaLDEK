import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely — handles conflicts like
 * cn("px-4", "px-6") → "px-6" (not "px-4 px-6")
 *
 * Usage: <div className={cn("base-class", condition && "conditional-class")} />
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
