import { Flame, UserCheck, UserMinus, UserX } from "lucide-react";
import type { AdminEngagement } from "@/features/admin/server/loadAdminDashboard";
import { cn } from "@/lib/utils";

type AdminEngagementCardProps = {
  data: AdminEngagement;
};

export function AdminEngagementCard({ data }: AdminEngagementCardProps) {
  const total = Math.max(1, data.totalUsers);
  const segments = [
    {
      key: "veryActive",
      label: "Bardzo aktywni",
      hint: "≥ 5 sesji / 30 dni",
      value: data.veryActive,
      color: "bg-brand-gold",
      icon: Flame,
      tone: "text-brand-gold",
      bg: "bg-brand-gold/15",
    },
    {
      key: "active",
      label: "Aktywni",
      hint: "1–4 sesji / 30 dni",
      value: data.active,
      color: "bg-brand-sage",
      icon: UserCheck,
      tone: "text-brand-sage",
      bg: "bg-brand-sage/15",
    },
    {
      key: "inactive",
      label: "Uśpieni",
      hint: "Sesje >30 dni temu",
      value: data.inactive,
      color: "bg-warning",
      icon: UserMinus,
      tone: "text-warning",
      bg: "bg-warning/15",
    },
    {
      key: "neverStarted",
      label: "Nigdy nie zaczęli",
      hint: "0 sesji od rejestracji",
      value: data.neverStarted,
      color: "bg-error/70",
      icon: UserX,
      tone: "text-error",
      bg: "bg-error/15",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-body text-body-sm text-secondary">
          Z {data.totalUsers} użytkowników
        </p>
        <p className="font-body text-body-xs text-muted">
          Bardzo aktywni: <span className="text-brand-gold">{data.veryActive}</span>{" "}
          ({Math.round((data.veryActive / total) * 100)}%)
        </p>
      </div>

      <div className="flex h-3 w-full overflow-hidden rounded-full border border-border">
        {segments.map((seg) => {
          const pct = (seg.value / total) * 100;
          if (pct <= 0) return null;
          return (
            <div
              key={seg.key}
              className={cn("h-full", seg.color)}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${seg.value} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {segments.map((seg) => {
          const Icon = seg.icon;
          const pct = Math.round((seg.value / total) * 1000) / 10;
          return (
            <div
              key={seg.key}
              className="flex items-center gap-3 rounded-btn border border-border bg-background/60 px-3 py-2"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-btn",
                  seg.bg,
                  seg.tone,
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="flex flex-col">
                <span className="font-body text-body-xs uppercase tracking-widest text-muted">
                  {seg.label}
                </span>
                <span className={cn("font-heading text-heading-sm tabular-nums", seg.tone)}>
                  {seg.value}{" "}
                  <span className="font-body text-body-xs text-muted">({pct}%)</span>
                </span>
                <span className="font-body text-body-xs text-muted">{seg.hint}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
