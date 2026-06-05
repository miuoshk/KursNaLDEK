export type ReportStatus = "pending" | "reviewed" | "resolved" | "rejected" | string;

export function reportStatusBadge(status: ReportStatus) {
  switch (status) {
    case "pending":
      return { label: "Oczekujące", cls: "bg-warning/10 text-warning" };
    case "reviewed":
      return { label: "Przeglądnięte", cls: "bg-brand-gold/10 text-brand-gold" };
    case "resolved":
      return { label: "Rozwiązane", cls: "bg-success/10 text-success" };
    case "rejected":
      return { label: "Odrzucone", cls: "bg-error/10 text-error" };
    default:
      return { label: status, cls: "bg-white/10 text-secondary" };
  }
}

export function reportStatusLabel(status: ReportStatus): string {
  return reportStatusBadge(status).label;
}
