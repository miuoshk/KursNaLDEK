"use client";

import { LogOut } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";
import { logoutAction } from "@/features/auth/actions";
import { cn } from "@/lib/utils";

export function LogoutButton() {
  return (
    <form action={logoutAction} className="inline">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="submit"
            className={cn(
              "flex shrink-0 items-center justify-center rounded-btn p-2 text-muted transition-colors duration-200 ease-out",
              "hover:text-error focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brand-gold)]",
            )}
            aria-label="Wyloguj się"
          >
            <LogOut className="size-4" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
          className={cn(
            "z-50 rounded-btn border border-[color:var(--border-subtle)] bg-brand-card-1 px-2 py-1",
            "font-body text-body-xs text-secondary shadow-lg",
          )}
        >
          Wyloguj się
        </TooltipContent>
      </Tooltip>
    </form>
  );
}
