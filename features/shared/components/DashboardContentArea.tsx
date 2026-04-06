"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TestModeBanner } from "@/features/shared/components/TestModeBanner";
import { TopBar } from "@/features/shared/components/TopBar";
import { cn } from "@/lib/utils";

export function DashboardContentArea({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSessionStudy =
    pathname.startsWith("/sesja") && !pathname.includes("/podsumowanie");

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {!isSessionStudy ? (
        <>
          <TopBar />
          <TestModeBanner />
        </>
      ) : null}
      <main
        className={cn(
          "min-h-0 flex-1 overflow-y-auto bg-brand-bg",
          !isSessionStudy && "p-4 md:p-6 lg:p-8",
          isSessionStudy && "flex min-h-0 flex-1 flex-col p-0",
        )}
      >
        {!isSessionStudy ? (
          <div className="animate-fade-in mx-auto max-w-[1400px]">{children}</div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
