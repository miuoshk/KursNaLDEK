"use client";

import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  field: string;
  currentSortBy?: string;
  currentSortDir?: "asc" | "desc";
  className?: string;
};

export function AdminSortableHeader({
  label,
  field,
  currentSortBy,
  currentSortDir,
  className,
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isActive = currentSortBy === field;
  const nextDir: "asc" | "desc" = isActive && currentSortDir === "asc" ? "desc" : "asc";

  const next = new URLSearchParams(searchParams?.toString() ?? "");
  next.set("sortBy", field);
  next.set("sortDir", isActive && currentSortDir === "asc" ? "desc" : isActive && currentSortDir === "desc" ? "asc" : nextDir);

  const href = `${pathname}?${next.toString()}`;

  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1 font-body text-body-xs uppercase tracking-widest transition-colors",
        isActive ? "text-primary" : "text-muted hover:text-secondary",
        className,
      )}
      aria-sort={isActive ? (currentSortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span>{label}</span>
      {isActive ? (
        currentSortDir === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
      )}
    </Link>
  );
}
