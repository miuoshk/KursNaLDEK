import { cn } from "@/lib/utils";

type ModeRow = {
  mode: string;
  sessions: number;
  sharePct: number;
  avgAccuracy: number;
  avgDurationMin: number;
};

type AdminModeBenchmarkTableProps = {
  rows: ModeRow[];
};

const modeLabelMap: Record<string, string> = {
  inteligentna: "Inteligentna",
  przeglad: "Przegląd",
  katalog: "Katalog",
  osce_topic: "OSCE temat",
};

function modeLabel(mode: string) {
  return modeLabelMap[mode] ?? mode;
}

export function AdminModeBenchmarkTable({ rows }: AdminModeBenchmarkTableProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-card">
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">Tryb</th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">Sesje</th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">Udział</th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">Śr. poprawność</th>
            <th className="px-3 py-3 font-body text-body-xs uppercase tracking-widest text-muted">Śr. czas sesji</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center font-body text-body-sm text-muted">
                Brak danych dla ostatnich 7 dni.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.mode} className="border-b border-border transition-colors hover:bg-white/[0.02]">
                <td className="px-3 py-3 font-body text-body-sm text-primary">{modeLabel(row.mode)}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary">{row.sessions}</td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary">{row.sharePct}%</td>
                <td
                  className={cn(
                    "px-3 py-3 font-body text-body-sm",
                    row.avgAccuracy >= 70 ? "text-success" : row.avgAccuracy < 50 ? "text-error" : "text-secondary",
                  )}
                >
                  {row.avgAccuracy}%
                </td>
                <td className="px-3 py-3 font-body text-body-sm text-secondary">{row.avgDurationMin} min</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
