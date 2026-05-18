import { cn } from "@/lib/utils";

type UserRow = {
  userId: string;
  displayName: string;
  track: string | null;
  year: number | null;
  sessions: number;
  questions: number;
  studyHours: number;
  avgAccuracy: number;
};

type AdminUserBenchmarkTableProps = {
  rows: UserRow[];
};

export function AdminUserBenchmarkTable({ rows }: AdminUserBenchmarkTableProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-card">
            <Th>Użytkownik</Th>
            <Th>Kierunek</Th>
            <Th>Sesje (30d)</Th>
            <Th>Pytania</Th>
            <Th>Czas nauki</Th>
            <Th>Śr. poprawność</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center font-body text-body-sm text-muted">
                Brak danych użytkowników dla ostatnich 30 dni.
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={row.userId}
                className="border-b border-border transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-3 py-3 font-body text-body-sm text-primary">
                  <span className="inline-flex items-center gap-2">
                    <span className="font-body text-body-xs text-muted tabular-nums">
                      #{idx + 1}
                    </span>
                    {row.displayName}
                  </span>
                </td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary">
                  {row.track ? (
                    <span className="rounded-pill bg-white/5 px-2 py-0.5 font-body text-body-xs">
                      {row.year ? `${row.year} ` : ""}
                      {row.track}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">{row.sessions}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">{row.questions}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary tabular-nums">{row.studyHours} h</td>
                <td
                  className={cn(
                    "px-3 py-3 font-body text-body-sm tabular-nums",
                    row.avgAccuracy >= 70
                      ? "text-success"
                      : row.avgAccuracy < 50
                        ? "text-error"
                        : "text-secondary",
                  )}
                >
                  {row.avgAccuracy}%
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">
      {children}
    </th>
  );
}
