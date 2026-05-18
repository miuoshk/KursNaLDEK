"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert, User as UserIcon, Loader2 } from "lucide-react";
import { setUserRole } from "@/features/admin/server/adminActions";
import type {
  AdminUserRow,
  AdminUserRole,
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
};

export function AdminUsersTable({
  users,
  currentUserId,
  canEditRoles,
  currentSearch,
  currentRole,
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

  const handleSearchSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (currentRole) params.set("role", currentRole);
      const qs = params.toString();
      router.push(qs ? `/admin/uzytkownicy?${qs}` : "/admin/uzytkownicy");
    },
    [search, currentRole, router],
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

      <div className="flex flex-wrap items-center gap-2">
        {ROLE_FILTERS.map((f) => {
          const params = new URLSearchParams();
          if (currentSearch) params.set("q", currentSearch);
          if (f.value) params.set("role", f.value);
          const href = params.toString()
            ? `/admin/uzytkownicy?${params.toString()}`
            : "/admin/uzytkownicy";
          const active = (currentRole ?? "") === f.value;
          return (
            <Link
              key={f.value || "all"}
              href={href}
              className={cn(
                "rounded-pill px-3 py-1 font-body text-body-sm transition-colors",
                active
                  ? "bg-brand-gold text-brand-bg font-medium"
                  : "bg-card text-secondary hover:text-white",
              )}
            >
              {f.label}
            </Link>
          );
        })}

        <form onSubmit={handleSearchSubmit} className="ml-auto flex items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Szukaj po nazwie lub e-mailu"
            className="w-[260px] rounded-btn border border-border bg-card px-3 py-1.5 font-body text-body-sm text-primary placeholder:text-muted focus:border-brand-gold focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-btn bg-brand-sage px-3 py-1.5 font-body text-body-sm font-medium text-white transition-colors hover:bg-brand-sage/90"
          >
            Szukaj
          </button>
        </form>
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
              <Th>Rok / Status</Th>
              <Th>Dołączył</Th>
              <Th>Ostatnie logowanie</Th>
              {canEditRoles && <Th className="text-right">Akcja</Th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td
                  colSpan={canEditRoles ? 7 : 6}
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
                    <td className="px-3 py-3 font-body text-body-xs text-secondary">
                      <div>{user.currentYear ? `Rok ${user.currentYear}` : "—"}</div>
                      <div className="text-muted">
                        {user.subscriptionStatus ?? "brak subskrypcji"}
                      </div>
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
