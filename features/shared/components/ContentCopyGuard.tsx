"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const GUARD_ATTR = "data-copy-guard";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  const el = target.closest("input, textarea, select, [contenteditable='true']");
  if (!el) return false;
  if (el instanceof HTMLInputElement) {
    const type = el.type;
    if (type === "button" || type === "submit" || type === "checkbox" || type === "radio") {
      return false;
    }
  }
  return true;
}

/**
 * Blokuje kopiowanie / wycinanie / wklejanie treści platformy,
 * w tym natywne menu „Kopiuj” po zaznaczeniu na telefonie.
 * Panel `/admin` i pola formularzy zostają odblokowane.
 */
export function ContentCopyGuard() {
  const pathname = usePathname() ?? "";
  const disabled = pathname.startsWith("/admin");

  useLayoutEffect(() => {
    if (disabled) {
      document.documentElement.removeAttribute(GUARD_ATTR);
      return;
    }

    document.documentElement.setAttribute(GUARD_ATTR, "");

    function onClipboard(event: ClipboardEvent) {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
      const key = event.key.toLowerCase();
      if (key !== "c" && key !== "x" && key !== "v") return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
    }

    function onContextMenu(event: MouseEvent) {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
    }

    function onSelectStart(event: Event) {
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
    }

    document.addEventListener("copy", onClipboard, true);
    document.addEventListener("cut", onClipboard, true);
    document.addEventListener("paste", onClipboard, true);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("contextmenu", onContextMenu, true);
    document.addEventListener("selectstart", onSelectStart, true);

    return () => {
      document.documentElement.removeAttribute(GUARD_ATTR);
      document.removeEventListener("copy", onClipboard, true);
      document.removeEventListener("cut", onClipboard, true);
      document.removeEventListener("paste", onClipboard, true);
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
      document.removeEventListener("selectstart", onSelectStart, true);
    };
  }, [disabled]);

  return null;
}
