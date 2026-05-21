"use server";

import { loadReportNotifications } from "@/features/notifications/server/loadReportNotifications";
import type { ReportNotification } from "@/features/notifications/types";

export async function fetchReportNotifications(
  unreadOnly = false,
): Promise<ReportNotification[]> {
  return loadReportNotifications(unreadOnly);
}
