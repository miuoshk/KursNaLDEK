export type ReportNotificationStatus = "resolved" | "rejected" | "reviewed";

export type ReportNotification = {
  id: string;
  questionId: string;
  category: string;
  status: ReportNotificationStatus;
  adminResponse: string | null;
  resolvedAt: string;
};
