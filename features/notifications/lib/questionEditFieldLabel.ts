import type { useTranslations } from "next-intl";

type NotificationsTranslator = ReturnType<typeof useTranslations<"notifications">>;

const FIELD_KEYS: Record<string, keyof IntlMessages["notifications"]["fields"]> = {
  text: "text",
  options: "options",
  correct_option_id: "correct_option_id",
  explanation: "explanation",
  is_active: "is_active",
  source_exam: "source_exam",
  source_code: "source_code",
  image_url: "image_url",
  topic_id: "topic_id",
  theme_label: "theme_label",
  subtheme_label: "subtheme_label",
  batch_label: "batch_label",
  learning_outcome: "learning_outcome",
};

export function questionEditFieldLabel(t: NotificationsTranslator, field: string): string {
  const key = FIELD_KEYS[field];
  if (key) return t(`fields.${key}`);
  return field;
}

export function formatChangedFieldsList(
  t: NotificationsTranslator,
  fields: string[],
): string {
  if (fields.length === 0) return "";
  return fields.map((field) => questionEditFieldLabel(t, field)).join(", ");
}
