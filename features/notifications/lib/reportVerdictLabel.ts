import type { ReportNotificationStatus } from "@/features/notifications/types";

export function reportVerdictLabel(status: ReportNotificationStatus): string {
  switch (status) {
    case "resolved":
      return "Zgłoszenie rozwiązane";
    case "rejected":
      return "Zgłoszenie odrzucone";
    case "reviewed":
      return "Zgłoszenie przeglądnięte";
    default:
      return "Zgłoszenie rozpatrzone";
  }
}

export function reportVerdictDescription(
  status: ReportNotificationStatus,
  category: string,
): string {
  const verdict = reportVerdictLabel(status).toLowerCase();
  return `${verdict} · ${category}`;
}
