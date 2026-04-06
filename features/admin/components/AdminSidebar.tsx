"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, BarChart3, FileText, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/pytania", label: "Pytania", icon: FileText },
  { href: "/admin/bledy", label: "Zgłoszenia błędów", icon: AlertTriangle },
  { href: "/admin/uzytkownicy", label: "Użytkownicy", icon: Users },
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-[color:var(--border-subtle)] bg-brand-bg">
      <div className="flex h-14 shrink-0 items-center border-b border-[color:var(--border-subtle)] px-4">
        <p className="font-heading text-[15px] text-brand-gold">
          Kurs na LDEK — Admin
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-btn px-3 py-2.5 font-body text-body-sm transition-colors",
                active
                  ? "bg-white/[0.04] font-medium text-brand-gold"
                  : "text-secondary hover:bg-white/[0.04] hover:text-white",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-[color:var(--border-subtle)] px-4 py-3">
        <Link
          href="/pulpit"
          className="font-body text-body-xs text-muted transition-colors hover:text-white"
        >
          Wróć do aplikacji
        </Link>
      </div>
    </aside>
  );
}
