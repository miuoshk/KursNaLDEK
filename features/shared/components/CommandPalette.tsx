"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  Award,
  BarChart3,
  Bookmark,
  BookOpen,
  Compass,
  LayoutDashboard,
  Search as SearchIcon,
  Settings,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  loadSearchableSubjects,
  type SearchSubjectItem,
} from "@/features/shared/api/loadSearchableSubjects";
import { cn } from "@/lib/utils";

type NavTarget = {
  type: "nav";
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

type SubjectTarget = {
  type: "subject";
  id: string;
  label: string;
  hint: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

type Target = NavTarget | SubjectTarget;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const tCommon = useTranslations("common");
  const tNav = useTranslations("nav");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [subjects, setSubjects] = useState<SearchSubjectItem[]>([]);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const staticNav = useMemo<NavTarget[]>(
    () => [
      {
        type: "nav",
        id: "nav-pulpit",
        label: tNav("dashboard"),
        hint: tNav("commandPaletteDashboardHint"),
        href: "/pulpit",
        icon: LayoutDashboard,
      },
      {
        type: "nav",
        id: "nav-przedmioty",
        label: tNav("mySubjects"),
        hint: tNav("commandPaletteSubjectsHint"),
        href: "/przedmioty",
        icon: BookOpen,
      },
      {
        type: "nav",
        id: "nav-statystyki",
        label: tNav("statistics"),
        hint: tNav("commandPaletteStatisticsHint"),
        href: "/statystyki",
        icon: BarChart3,
      },
      {
        type: "nav",
        id: "nav-osiagniecia",
        label: tNav("achievements"),
        hint: tNav("commandPaletteAchievementsHint"),
        href: "/osiagniecia",
        icon: Award,
      },
      {
        type: "nav",
        id: "nav-zapisane",
        label: tNav("savedQuestions"),
        hint: tNav("commandPaletteSavedHint"),
        href: "/zapisane",
        icon: Bookmark,
      },
      {
        type: "nav",
        id: "nav-ustawienia",
        label: tNav("settings"),
        hint: tNav("commandPaletteSettingsHint"),
        href: "/ustawienia",
        icon: Settings,
      },
    ],
    [tNav],
  );

  useEffect(() => {
    if (!open || subjectsLoaded) return;
    let cancelled = false;
    void loadSearchableSubjects().then((rows) => {
      if (cancelled) return;
      setSubjects(rows);
      setSubjectsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [open, subjectsLoaded]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const targets = useMemo<Target[]>(() => {
    const q = normalize(query.trim());
    const subjectTargets: SubjectTarget[] = subjects.map((s) => ({
      type: "subject",
      id: `subj-${s.id}`,
      label: s.name,
      hint: tNav("commandPaletteSubjectHint", {
        year: s.year,
        shortName: s.shortName,
      }),
      href: `/przedmioty/${s.id}`,
      icon: Compass,
    }));
    const all: Target[] = [...staticNav, ...subjectTargets];
    if (!q) return all;
    return all.filter((t) => {
      const haystack = normalize(`${t.label} ${t.hint}`);
      return haystack.includes(q);
    });
  }, [query, subjects, staticNav, tNav]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const select = useCallback(
    (target: Target) => {
      router.push(target.href);
      onOpenChange(false);
    },
    [router, onOpenChange],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, Math.max(0, targets.length - 1)));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const t = targets[activeIndex];
        if (t) select(t);
      }
    },
    [activeIndex, targets, select],
  );

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-cmd-index="${activeIndex}"]`,
    );
    if (el) {
      el.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [activeIndex]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-[15vh] z-50 w-[min(100%-2rem,640px)] -translate-x-1/2",
            "overflow-hidden rounded-card border border-border bg-card shadow-2xl",
            "data-[state=open]:animate-slide-up",
          )}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          onKeyDown={onKeyDown}
        >
          <Dialog.Title className="sr-only">{tCommon("searchInApp")}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {tCommon("searchDescription")}
          </Dialog.Description>

          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <SearchIcon className="size-4 shrink-0 text-secondary" aria-hidden />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tCommon("searchPlaceholder")}
              className={cn(
                "min-w-0 flex-1 bg-transparent font-body text-body-md text-primary",
                "placeholder:text-muted focus:outline-none",
              )}
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden rounded border border-border bg-sidebar px-1.5 py-0.5 font-body text-[11px] text-muted sm:inline">
              Esc
            </kbd>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={tCommon("close")}
                className="flex size-7 items-center justify-center rounded-btn text-secondary transition-colors hover:bg-white/[0.06] hover:text-primary sm:hidden"
              >
                <X className="size-4" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <div
            ref={listRef}
            className="max-h-[55vh] overflow-y-auto py-2"
            role="listbox"
            aria-label={tCommon("results")}
          >
            {targets.length === 0 ? (
              <p className="px-4 py-6 text-center font-body text-body-sm text-muted">
                {tCommon("noResultsForQuery", { query })}
              </p>
            ) : (
              <ul>
                {targets.map((t, idx) => {
                  const Icon = t.icon;
                  const isActive = idx === activeIndex;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        data-cmd-index={idx}
                        onClick={() => select(t)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                          isActive
                            ? "bg-brand-gold/10 text-primary"
                            : "text-primary hover:bg-white/[0.03]",
                        )}
                        role="option"
                        aria-selected={isActive}
                      >
                        <span
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-btn",
                            t.type === "subject"
                              ? "bg-brand-sage/15 text-brand-sage"
                              : "bg-brand-gold/10 text-brand-gold",
                          )}
                          aria-hidden
                        >
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-body text-body-sm font-medium text-primary">
                            {t.label}
                          </span>
                          <span className="block truncate font-body text-body-xs text-muted">
                            {t.hint}
                          </span>
                        </span>
                        {isActive ? (
                          <kbd className="hidden rounded border border-border bg-sidebar px-1.5 py-0.5 font-body text-[10px] text-muted sm:inline">
                            ↵
                          </kbd>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border bg-sidebar/50 px-4 py-2 font-body text-body-xs text-muted">
            <span className="hidden sm:inline">
              <kbd className="rounded border border-border bg-card px-1 py-px text-[10px]">↑</kbd>{" "}
              <kbd className="rounded border border-border bg-card px-1 py-px text-[10px]">↓</kbd>{" "}
              {tCommon("navigate")}
            </span>
            <span>{tCommon("resultsCount", { count: targets.length })}</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
