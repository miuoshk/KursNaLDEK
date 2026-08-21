export function formatAdminTopicName(
  name: string | null | undefined,
  isInbox: boolean | null | undefined,
): string {
  const label = (name ?? "").trim() || "—";
  if (!isInbox) return label;
  return `${label} (poczekalnia CEM)`;
}
