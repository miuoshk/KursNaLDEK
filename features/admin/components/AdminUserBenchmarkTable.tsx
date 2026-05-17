import { cn } from "@/lib/utils";

type UserRow = {
  userId: string;
  displayName: string;
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
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">Użytkownik</th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">Sesje (30d)</th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">Pytania</th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">Czas nauki</th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">Śr. poprawność</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center font-body text-body-sm text-muted">
                Brak danych użytkowników dla ostatnich 30 dni.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.userId} className="border-b border-border transition-colors hover:bg-white/[0.02]">
                <td className="px-3 py-3 font-body text-body-sm text-primary">{row.displayName}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary">{row.sessions}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary">{row.questions}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary">{row.studyHours} h</td>
                <td
                  className={cn(
                    "px-3 py-3 font-body text-body-sm",
                    row.avgAccuracy >= 70 ? "text-success" : row.avgAccuracy < 50 ? "text-error" : "text-secondary",
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
