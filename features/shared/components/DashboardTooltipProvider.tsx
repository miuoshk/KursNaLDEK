"use client";

import { TooltipProvider } from "@radix-ui/react-tooltip";

export function DashboardTooltipProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={200} skipDelayDuration={200}>
      {children}
    </TooltipProvider>
  );
}
