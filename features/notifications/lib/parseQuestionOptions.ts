export type NotificationQuestionOption = {
  id: string;
  text: string;
};

export function parseQuestionOptions(raw: unknown): NotificationQuestionOption[] {
  if (Array.isArray(raw)) {
    return (raw as NotificationQuestionOption[]).filter(
      (o) => o && typeof o.id === "string" && typeof o.text === "string",
    );
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed)
        ? (parsed as NotificationQuestionOption[]).filter(
            (o) => o && typeof o.id === "string" && typeof o.text === "string",
          )
        : [];
    } catch {
      return [];
    }
  }
  return [];
}
