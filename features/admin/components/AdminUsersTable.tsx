"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, User as UserIcon, Loader2 } from "lucide-react";
import { setUserRole } from "@/features/admin/server/adminActions";
import type {
  AdminUserRow,
  AdminUserRole,
  AdminUserTrack,
} from "@/features/admin/server/loadAdminUsers";
import { cn } from "@/lib/utils";

const ROLE_FILTERS: ReadonlyArray<{ value: AdminUserRole | ""; label: string }> = [
  { value: "", label: "Wszyscy" },
  { value: "admin", label: "Admini" },
  { value: "moderator", label: "Moderatorzy" },
  { value: "student", label: "Studenci" },
];

const ROLE_OPTIONS: ReadonlyArray<{ value: AdminUserRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "moderator", label: "Moderator" },
  { value: "student", label: "Student" },
];

function trackShort(track: string | null): string {
  if (track === "lekarski") return "LEK";
  if (track === "stomatologia") return "STOMA";
  if (!track) return "—";
  return track.toUpperCase();
}

function roleBadge(role: AdminUserRole) {
  switch (role) {
    case "admin":
      return {
        label: "Admin",
        cls: "bg-brand-gold/15 text-brand-gold",
        Icon: ShieldCheck,
      };
    case "moderator":
      return {
        label: "Moderator",
        cls: "bg-brand-sage/20 text-brand-sage",
        Icon: ShieldAlert,
      };
    default:
      return {
        label: "Student",
        cls: "bg-white/10 text-secondary",
        Icon: UserIcon,
      };
  }
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type AdminUsersTableProps = {
  users: AdminUserRow[];
  currentUserId: string;
  canEditRoles: boolean;
  currentSearch: string;
  currentRole: AdminUserRole | "";
  currentTrack: AdminUserTrack;
  currentYear: number | null;
  availableTracks: Array<{ value: AdminUserTrack; label: string; count: number }>;
  availableYears: Array<{ value: number; count: number }>;
};

export function AdminUsersTable({
  users,
  currentUserId,
  canEditRoles,
  currentSearch,
  currentRole,
  currentTrack,
  currentYear,
  availableTracks,
  availableYears,
}: AdminUsersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(currentSearch);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const result = { admin: 0, moderator: 0, student: 0 };
    for (const u of users) result[u.role] += 1;
    return result;
  }, [users]);

  const buildHref = useCallback(
    (next: {
      q?: string;
      role?: AdminUserRole | "";
      track?: AdminUserTrack;
      year?: number | null;
    }) => {
      const params = new URLSearchParams();
      const q = next.q !== undefined ? next.q : currentSearch;
      const role = next.role !== undefined ? next.role : currentRole;
      const track = next.track !== undefined ? next.track : currentTrack;
      const year = next.year !== undefined ? next.year : currentYear;
      if (q && q.trim()) params.set("q", q.trim());
      if (role) params.set("role", role);
      if (track) params.set("track", track);
      if (year !== null && year !== undefined) params.set("year", String(year));
      const qs = params.toString();
      return qs ? `/admin/uzytkownicy?${qs}` : "/admin/uzytkownicy";
    },
    [currentSearch, currentRole, currentTrack, currentYear],
  );

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      router.push(buildHref({ q: search }));
    },
    [search, router, buildHref],
  );

  const handleRoleChange = useCallback(
    async (user: AdminUserRow, nextRole: AdminUserRole) => {
      if (nextRole === user.role) return;
      const label = roleBadge(nextRole).label.toLowerCase();
      const confirmed = window.confirm(
        `Zmienić rolę użytkownika „${user.displayName}" na ${label}?`,
      );
      if (!confirmed) return;

      setErrorMsg(null);
      setPendingId(user.id);
      const result = await setUserRole({ userId: user.id, role: nextRole });
      setPendingId(null);

      if (!result.ok) {
        setErrorMsg(result.message ?? "Nie udało się zmienić roli.");
        return;
      }

      startTransition(() => {
        router.refresh();
      });
    },
    [router],
  );

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Łącznie" value={users.length} />
        <SummaryCard label="Admini" value={stats.admin} tone="gold" />
        <SummaryCard label="Moderatorzy" value={stats.moderator} tone="sage" />
        <SummaryCard label="Studenci" value={stats.student} />
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-border bg-card p-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Szukaj po nazwie lub e-mailu"
              className="flex-1 rounded-btn border border-border bg-background px-3 py-2 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-sage focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-btn bg-brand-sage px-4 py-2 font-body text-body-sm font-medium text-white transition-colors hover:bg-brand-sage/90"
            >
              Szukaj
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-body-xs uppercase tracking-widest text-muted">
            Rola:
          </span>
          {ROLE_FILTERS.map((f) => {
            const active = (currentRole ?? "") === f.value;
            return (
              <Link
                key={f.value || "all"}
                href={buildHref({ role: f.value })}
                className={cn(
                  "rounded-pill px-3 py-1 font-body text-body-xs transition-colors",
                  active
                    ? "bg-brand-gold text-brand-bg font-medium"
                    : "bg-background text-secondary hover:text-white",
                )}
              >
                {f.label}
              </Link>
            );
          })}
        </div>

        {availableTracks.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-body-xs uppercase tracking-widest text-muted">
              Kierunek:
            </span>
            <Link
              href={buildHref({ track: "" })}
              className={cn(
                "rounded-pill px-3 py-1 font-body text-body-xs transition-colors",
                currentTrack === ""
                  ? "bg-brand-sage text-white font-medium"
                  : "bg-background text-secondary hover:text-white",
              )}
            >
              Wszystkie
            </Link>
            {availableTracks.map((track) => {
              const active = currentTrack === track.value;
              return (
                <Link
                  key={track.value}
                  href={buildHref({ track: track.value })}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 font-body text-body-xs transition-colors",
                    active
                      ? "bg-brand-sage text-white font-medium"
                      : "bg-background text-secondary hover:text-white",
                  )}
                >
                  {track.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 font-body text-[10px] tabular-nums",
                      active ? "bg-white/20 text-white" : "bg-white/5 text-muted",
                    )}
                  >
                    {track.count}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {availableYears.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-body text-body-xs uppercase tracking-widest text-muted">
              Rok:
            </span>
            <Link
              href={buildHref({ year: null })}
              className={cn(
                "rounded-pill px-3 py-1 font-body text-body-xs transition-colors",
                currentYear === null
                  ? "bg-brand-gold text-brand-bg font-medium"
                  : "bg-background text-secondary hover:text-white",
              )}
            >
              Wszystkie
            </Link>
            {availableYears.map((year) => {
              const active = currentYear === year.value;
              return (
                <Link
                  key={year.value}
                  href={buildHref({ year: year.value })}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-pill px-3 py-1 font-body text-body-xs transition-colors",
                    active
                      ? "bg-brand-gold text-brand-bg font-medium"
                      : "bg-background text-secondary hover:text-white",
                  )}
                >
                  Rok {year.value}
                  <span
                    className={cn(
                      "rounded-full px-1.5 font-body text-[10px] tabular-nums",
                      active ? "bg-black/20 text-brand-bg" : "bg-white/5 text-muted",
                    )}
                  >
                    {year.count}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-btn border border-error/40 bg-error/10 px-3 py-2 font-body text-body-sm text-error">
          {errorMsg}
        </div>
      )}

      {!canEditRoles && (
        <div className="rounded-btn border border-border bg-card/60 px-3 py-2 font-body text-body-xs text-muted">
          Tylko admin może zmieniać role. Moderator widzi listę w trybie odczytu.
        </div>
      )}

      <div className="overflow-x-auto rounded-card border border-border">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-card">
              <Th>Użytkownik</Th>
              <Th>E-mail</Th>
              <Th>Rola</Th>
              <Th>Kierunek</Th>
              <Th>Rok</Th>
              <Th>Subskrypcja</Th>
              <Th>Dołączył</Th>
              <Th>Ost. logowanie</Th>
              {canEditRoles && <Th className="text-right">Akcja</Th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={canEditRoles ? 9 : 8}
                  className="px-3 py-8 text-center font-body text-body-sm text-muted"
                >
                  Brak użytkowników spełniających kryteria.
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const badge = roleBadge(user.role);
                const BadgeIcon = badge.Icon;
                const isSelf = user.id === currentUserId;
                const isUpdating = pendingId === user.id;
                const subPill = user.subscriptionStatus === "active";
                return (
                  <tr
                    key={user.id}
                    className="border-b border-border transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-3">
                      <div className="font-body text-body-sm font-medium text-primary">
                        {user.displayName}
                        {isSelf && (
                          <span className="ml-2 rounded-pill bg-brand-gold/15 px-2 py-0.5 font-body text-body-xs text-brand-gold">
                            Ty
                          </span>
                        )}
                      </div>
                      {user.fullName && user.fullName !== user.displayName && (
                        <div className="font-body text-body-xs text-muted">
                          {user.fullName}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {user.email ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 font-body text-body-xs",
                          badge.cls,
                        )}
                      >
                        <BadgeIcon className="size-3" aria-hidden />
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "rounded-pill px-2 py-0.5 font-body text-body-xs",
                          user.track === "lekarski"
                            ? "bg-brand-sage/20 text-brand-sage"
                            : user.track === "stomatologia"
                              ? "bg-brand-gold/15 text-brand-gold"
                              : "bg-white/5 text-muted",
                        )}
                      >
                        {trackShort(user.track)}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">
                      {user.currentYear ? `${user.currentYear}` : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "rounded-pill px-2 py-0.5 font-body text-body-xs",
                          subPill
                            ? "bg-success/15 text-success"
                            : user.subscriptionStatus
                              ? "bg-white/5 text-muted"
                              : "bg-error/10 text-error",
                        )}
                      >
                        {user.subscriptionStatus ?? "brak"}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      {formatDate(user.lastSignInAt)}
                    </td>
                    {canEditRoles && (
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-2">
                          {isUpdating || (isPending && pendingId === user.id) ? (
                            <Loader2
                              className="size-3.5 animate-spin text-brand-gold"
                              aria-hidden
                            />
                          ) : null}
                          <select
                            value={user.role}
                            disabled={isSelf || isUpdating}
                            onChange={(e) =>
                              handleRoleChange(
                                user,
                                e.target.value as AdminUserRole,
                              )
                            }
                            className={cn(
                              "rounded-btn border border-border bg-card px-2 py-1 font-body text-body-xs text-primary",
                              "focus:border-brand-gold focus:outline-none",
                              (isSelf || isUpdating) &&
                                "cursor-not-allowed opacity-60",
                            )}
                            title={
                              isSelf ? "Nie możesz zmienić własnej roli" : undefined
                            }
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "gold" | "sage";
}) {
  return (
    <div className="rounded-card border border-border bg-card px-4 py-3">
      <div className="font-body text-body-xs uppercase tracking-widest text-muted">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 font-heading text-heading-md tabular-nums",
          tone === "gold" && "text-brand-gold",
          tone === "sage" && "text-brand-sage",
          !tone && "text-primary",
        )}
      >
        {value}
      </div>
    </div>
  );
}
