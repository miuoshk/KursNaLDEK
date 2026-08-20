"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TopBar } from "@/features/shared/components/TopBar";
import { cn } from "@/lib/utils";

export function DashboardContentArea({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSessionStudy = /^\/sesja\/[^/]+$/.test(pathname ?? "");

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      {!isSessionStudy ? <TopBar /> : null}
      <main
        className={cn(
          "min-h-0 min-w-0 flex-1 bg-background",
          !isSessionStudy &&
            "overflow-x-hidden overflow-y-auto overscroll-x-none p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-6 lg:p-8",
          isSessionStudy && "flex min-h-0 flex-1 flex-col overflow-hidden p-0",
        )}
      >
        {!isSessionStudy ? (
          <div className="animate-fade-in mx-auto min-w-0 max-w-[1400px]">{children}</div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
