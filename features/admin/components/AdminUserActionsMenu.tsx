"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Ban,
  CircleOff,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  ShieldOff,
  Trash2,
} from "lucide-react";
import type { AdminUserRow } from "@/features/admin/server/loadAdminUsers";
import { cn } from "@/lib/utils";

type AdminUserActionsMenuProps = {
  user: AdminUserRow;
  isSelf: boolean;
  isUpdating: boolean;
  onBanToggle: (user: AdminUserRow) => void;
  onAccessToggle: (user: AdminUserRow) => void;
  onDelete: (user: AdminUserRow) => void;
};

export function AdminUserActionsMenu({
  user,
  isSelf,
  isUpdating,
  onBanToggle,
  onAccessToggle,
  onDelete,
}: AdminUserActionsMenuProps) {
  const disabled = isSelf || isUpdating;
  const accessDisabled = disabled || user.isBanned;
  const deleteDisabled =
    disabled || user.role === "admin" || user.role === "moderator";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          disabled={isUpdating}
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-btn border border-border",
            "text-secondary transition-colors hover:border-brand-sage/40 hover:bg-white/[0.04] hover:text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage/50",
            isUpdating && "cursor-not-allowed opacity-60",
          )}
          aria-label={`Akcje dla ${user.displayName}`}
        >
          {isUpdating ? (
            <Loader2 className="size-4 animate-spin text-brand-gold" aria-hidden />
          ) : (
            <MoreHorizontal className="size-4" aria-hidden />
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className={cn(
            "z-50 min-w-[210px] overflow-hidden rounded-card border border-border bg-card p-1 shadow-xl",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
        >
          <DropdownMenu.Item
            disabled={disabled}
            onSelect={() => onBanToggle(user)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-btn px-3 py-2 font-body text-body-sm outline-none",
              "transition-colors focus:bg-white/[0.06] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
              user.isBanned ? "text-brand-sage" : "text-error",
            )}
          >
            {user.isBanned ? (
              <>
                <ShieldOff className="size-4 shrink-0" aria-hidden />
                Odbanuj użytkownika
              </>
            ) : (
              <>
                <Ban className="size-4 shrink-0" aria-hidden />
                Zbanuj użytkownika
              </>
            )}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            disabled={accessDisabled}
            onSelect={() => onAccessToggle(user)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-btn px-3 py-2 font-body text-body-sm outline-none",
              "transition-colors focus:bg-white/[0.06] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
              user.accessRevoked ? "text-brand-sage" : "text-brand-gold",
            )}
          >
            {user.accessRevoked ? (
              <>
                <RotateCcw className="size-4 shrink-0" aria-hidden />
                Przywróć dostęp
              </>
            ) : (
              <>
                <CircleOff className="size-4 shrink-0" aria-hidden />
                Odbierz dostęp
              </>
            )}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-border" />

          <DropdownMenu.Item
            disabled={deleteDisabled}
            onSelect={() => onDelete(user)}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-btn px-3 py-2 font-body text-body-sm text-error outline-none",
              "transition-colors focus:bg-error/10 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
            )}
          >
            <Trash2 className="size-4 shrink-0" aria-hidden />
            Usuń konto
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
