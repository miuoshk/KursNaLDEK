import type { useTranslations } from "next-intl";
import type { ReportNotificationStatus } from "@/features/notifications/types";

type NotificationsTranslator = ReturnType<typeof useTranslations<"notifications">>;

export function reportVerdictLabel(
  t: NotificationsTranslator,
  status: ReportNotificationStatus,
): string {
  switch (status) {
    case "resolved":
      return t("verdict.resolved");
    case "rejected":
      return t("verdict.rejected");
    case "reviewed":
      return t("verdict.reviewed");
    default:
      return t("verdict.default");
  }
}

export function reportVerdictDescription(
  t: NotificationsTranslator,
  status: ReportNotificationStatus,
  category: string,
): string {
  const verdict = reportVerdictLabel(t, status).toLowerCase();
  return t("verdictDescription", { verdict, category });
}
