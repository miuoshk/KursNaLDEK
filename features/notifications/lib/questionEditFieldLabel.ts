const FIELD_LABEL: Record<string, string> = {
  text: "treść pytania",
  options: "opcje odpowiedzi",
  correct_option_id: "poprawna odpowiedź",
  explanation: "wyjaśnienie",
  is_active: "aktywność",
  source_exam: "termin egzaminu",
  source_code: "numer pytania",
  image_url: "obraz",
  topic_id: "temat",
  theme_label: "theme label",
  subtheme_label: "subtheme label",
  batch_label: "batch label",
  learning_outcome: "learning outcome",
};

export function questionEditFieldLabel(field: string): string {
  return FIELD_LABEL[field] ?? field;
}

export function formatChangedFieldsList(fields: string[]): string {
  if (fields.length === 0) return "";
  return fields.map(questionEditFieldLabel).join(", ");
}
