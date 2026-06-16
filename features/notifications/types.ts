export type ReportNotificationStatus = "resolved" | "rejected" | "reviewed";

export type ReportNotificationQuestionPreview = {
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  /** Pola zmienione przy rozpatrzeniu tego zgłoszenia (jeśli admin edytował pytanie). */
  changedFields: string[];
};

export type ReportNotification = {
  id: string;
  questionId: string;
  category: string;
  status: ReportNotificationStatus;
  adminResponse: string | null;
  resolvedAt: string;
  question: ReportNotificationQuestionPreview | null;
};
