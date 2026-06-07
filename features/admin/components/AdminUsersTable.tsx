"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, User as UserIcon, Loader2, Ban, ShieldOff } from "lucide-react";
import { setUserRole, banUser, unbanUser } from "@/features/admin/server/adminActions";
import type {
  AdminUserRow,
  AdminUserRole,
  AdminUserSortBy,
  AdminUserSortDir,
  AdminUserTrack,
} from "@/features/admin/server/loadAdminUsers";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
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
  currentSortBy: AdminUserSortBy;
  currentSortDir: AdminUserSortDir;
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
  currentSortBy,
  currentSortDir,
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
      sortBy?: AdminUserSortBy;
      sortDir?: AdminUserSortDir;
    }) => {
      const params = new URLSearchParams();
      const q = next.q !== undefined ? next.q : currentSearch;
      const role = next.role !== undefined ? next.role : currentRole;
      const track = next.track !== undefined ? next.track : currentTrack;
      const year = next.year !== undefined ? next.year : currentYear;
      const sortBy = next.sortBy !== undefined ? next.sortBy : currentSortBy;
      const sortDir = next.sortDir !== undefined ? next.sortDir : currentSortDir;
      if (q && q.trim()) params.set("q", q.trim());
      if (role) params.set("role", role);
      if (track) params.set("track", track);
      if (year !== null && year !== undefined) params.set("year", String(year));
      if (sortBy && sortBy !== "createdAt") params.set("sortBy", sortBy);
      if (sortDir && sortDir !== "desc") params.set("sortDir", sortDir);
      const qs = params.toString();
      return qs ? `/admin/uzytkownicy?${qs}` : "/admin/uzytkownicy";
    },
    [currentSearch, currentRole, currentTrack, currentYear, currentSortBy, currentSortDir],
  );

  const sortHref = useCallback(
    (field: AdminUserSortBy) => {
      const isActive = currentSortBy === field;
      const nextDir: AdminUserSortDir = isActive && currentSortDir === "asc" ? "desc" : "asc";
      return buildHref({ sortBy: field, sortDir: nextDir });
    },
    [buildHref, currentSortBy, currentSortDir],
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

  const handleBanToggle = useCallback(
    async (user: AdminUserRow) => {
      if (user.isBanned) {
        const confirmed = window.confirm(
          `Odbanować użytkownika „${user.displayName}"? E-mail wróci na białą listę.`,
        );
        if (!confirmed) return;

        setErrorMsg(null);
        setPendingId(user.id);
        const result = await unbanUser({ userId: user.id });
        setPendingId(null);

        if (!result.ok) {
          setErrorMsg(result.message ?? "Nie udało się odbanować użytkownika.");
          return;
        }
      } else {
        const ipNote = user.lastLoginIp
          ? `\n\nZostanie też zablokowane ostatnie IP: ${user.lastLoginIp}.`
          : "\n\nBrak zapisanego IP — zbanowany zostanie tylko e-mail.";
        const confirmed = window.confirm(
          `Zbanować użytkownika „${user.displayName}" (${user.email ?? "brak e-maila"})?${ipNote}\n\nUżytkownik zostanie wylogowany.`,
        );
        if (!confirmed) return;

        setErrorMsg(null);
        setPendingId(user.id);
        const result = await banUser({ userId: user.id, includeIp: true });
        setPendingId(null);

        if (!result.ok) {
          setErrorMsg(result.message ?? "Nie udało się zbanować użytkownika.");
          return;
        }
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
              <SortableTh
                label="Użytkownik"
                field="displayName"
                href={sortHref("displayName")}
                isActive={currentSortBy === "displayName"}
                dir={currentSortDir}
              />
              <SortableTh
                label="E-mail"
                field="email"
                href={sortHref("email")}
                isActive={currentSortBy === "email"}
                dir={currentSortDir}
              />
              <SortableTh
                label="Rola"
                field="role"
                href={sortHref("role")}
                isActive={currentSortBy === "role"}
                dir={currentSortDir}
              />
              <SortableTh
                label="Kierunek"
                field="track"
                href={sortHref("track")}
                isActive={currentSortBy === "track"}
                dir={currentSortDir}
              />
              <SortableTh
                label="Rok"
                field="currentYear"
                href={sortHref("currentYear")}
                isActive={currentSortBy === "currentYear"}
                dir={currentSortDir}
              />
              <SortableTh
                label="Subskrypcja"
                field="subscriptionStatus"
                href={sortHref("subscriptionStatus")}
                isActive={currentSortBy === "subscriptionStatus"}
                dir={currentSortDir}
              />
              <SortableTh
                label="Dołączył"
                field="createdAt"
                href={sortHref("createdAt")}
                isActive={currentSortBy === "createdAt"}
                dir={currentSortDir}
              />
              <SortableTh
                label="Ost. logowanie"
                field="lastSignInAt"
                href={sortHref("lastSignInAt")}
                isActive={currentSortBy === "lastSignInAt"}
                dir={currentSortDir}
              />
              <Th>Status</Th>
              {canEditRoles && <Th className="text-right">Akcja</Th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={canEditRoles ? 10 : 9}
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
                    className={cn(
                      "border-b border-border transition-colors hover:bg-white/[0.02]",
                      user.isBanned && "bg-error/5",
                    )}
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
                    <td className="px-3 py-3">
                      {user.isBanned ? (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-error/15 px-2 py-0.5 font-body text-body-xs text-error">
                          <Ban className="size-3" aria-hidden />
                          Zbanowany
                        </span>
                      ) : (
                        <span className="rounded-pill bg-white/5 px-2 py-0.5 font-body text-body-xs text-muted">
                          Aktywny
                        </span>
                      )}
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
                          <button
                            type="button"
                            disabled={isSelf || isUpdating}
                            onClick={() => handleBanToggle(user)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-btn border px-2 py-1 font-body text-body-xs transition-colors",
                              user.isBanned
                                ? "border-brand-sage/40 text-brand-sage hover:bg-brand-sage/10"
                                : "border-error/40 text-error hover:bg-error/10",
                              (isSelf || isUpdating) && "cursor-not-allowed opacity-60",
                            )}
                            title={
                              isSelf
                                ? "Nie możesz zbanować własnego konta"
                                : user.isBanned
                                  ? "Odbanuj użytkownika"
                                  : "Zbanuj użytkownika"
                            }
                          >
                            {user.isBanned ? (
                              <>
                                <ShieldOff className="size-3" aria-hidden />
                                Odbanuj
                              </>
                            ) : (
                              <>
                                <Ban className="size-3" aria-hidden />
                                Zbanuj
                              </>
                            )}
                          </button>
                          <select
                            value={user.role}
                            disabled={isSelf || isUpdating || user.isBanned}
                            onChange={(e) =>
                              handleRoleChange(
                                user,
                                e.target.value as AdminUserRole,
                              )
                            }
                            className={cn(
                              "rounded-btn border border-border bg-card px-2 py-1 font-body text-body-xs text-primary",
                              "focus:border-brand-gold focus:outline-none",
                              (isSelf || isUpdating || user.isBanned) &&
                                "cursor-not-allowed opacity-60",
                            )}
                            title={
                              isSelf
                                ? "Nie możesz zmienić własnej roli"
                                : user.isBanned
                                  ? "Najpierw odbanuj użytkownika"
                                  : undefined
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

function SortableTh({
  label,
  href,
  isActive,
  dir,
}: {
  label: string;
  field: AdminUserSortBy;
  href: string;
  isActive: boolean;
  dir: AdminUserSortDir;
}) {
  return (
    <th className="px-3 py-3">
      <Link
        href={href}
        className={cn(
          "group inline-flex items-center gap-1 font-body text-body-xs uppercase tracking-widest transition-colors",
          isActive ? "text-primary" : "text-muted hover:text-secondary",
        )}
        aria-sort={isActive ? (dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        {isActive ? (
          dir === "asc" ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ChevronsUpDown className="h-3 w-3 opacity-60 transition-opacity group-hover:opacity-100" />
        )}
      </Link>
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
