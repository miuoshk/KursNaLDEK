import type { ConversionDrillQuestionItem } from "@/features/osce/components/ConversionDrillQuestion";
import type {
  ImageIdentifyHotspot,
  ImageIdentifyQuestionData,
} from "@/features/osce/components/ImageIdentifyQuestion";
import type { OrderingQuestionData } from "@/features/osce/components/OrderingQuestion";
import type { OsceQuestionCardQuestion, OsceQuestionOption } from "@/features/osce/components/QuestionCard";
import type { TopicSessionQuestionRow } from "@/features/osce/types";

export function parseOsceOptions(raw: unknown): OsceQuestionOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (x): x is OsceQuestionOption =>
        typeof x === "object" &&
        x !== null &&
        "id" in x &&
        "text" in x &&
        typeof (x as { id: unknown }).id === "string",
    )
    .map((x) => ({
      id: (x as { id: string }).id,
      text: String((x as { text: unknown }).text),
    }));
}

export function resolveOsceQuestionKind(row: TopicSessionQuestionRow): string {
  return (row.question_type || "single_choice").trim() || "single_choice";
}

export function toOsceSingleChoice(
  row: TopicSessionQuestionRow,
): OsceQuestionCardQuestion | null {
  const options = parseOsceOptions(row.options);
  if (options.length === 0) return null;
  const extra = row.extra ?? {};
  const timer =
    typeof extra.timer_seconds === "number" && extra.timer_seconds > 0
      ? extra.timer_seconds
      : null;
  return {
    id: row.id,
    text: row.text,
    options,
    correct_option_id: row.correct_option_id,
    explanation: row.explanation,
    image_url: row.image_url,
    question_type: resolveOsceQuestionKind(row),
    timer_seconds: timer,
  };
}

export function toOsceOrdering(row: TopicSessionQuestionRow): OrderingQuestionData | null {
  const extra = row.extra ?? {};
  const co = extra.correct_order;
  if (!Array.isArray(co) || !co.every((x) => typeof x === "string")) return null;
  const options = parseOsceOptions(row.options);
  if (options.length === 0) return null;
  const timer =
    typeof extra.timer_seconds === "number" && extra.timer_seconds > 0
      ? extra.timer_seconds
      : null;
  return {
    id: row.id,
    text: row.text,
    options,
    correct_order: co as string[],
    explanation: row.explanation,
    timer_seconds: timer,
  };
}

export function toOsceImageIdentify(
  row: TopicSessionQuestionRow,
): ImageIdentifyQuestionData | null {
  const extra = row.extra ?? {};
  const hotspots = extra.hotspots;
  if (!Array.isArray(hotspots) || hotspots.length === 0) return null;
  const imageUrl =
    (typeof extra.image_url === "string" && extra.image_url.length > 0
      ? extra.image_url
      : null) || row.image_url;
  if (!imageUrl) return null;
  const mode = extra.mode === "label" ? "label" : "identify";
  return {
    id: row.id,
    text: row.text,
    image_url: imageUrl,
    hotspots: hotspots as ImageIdentifyHotspot[],
    question_type: "image_identify",
    mode,
  };
}

export function toOsceConversionItems(
  row: TopicSessionQuestionRow,
): ConversionDrillQuestionItem[] | null {
  const raw = row.extra?.drill_questions;
  if (!Array.isArray(raw) || raw.length === 0) return null;
  return raw as ConversionDrillQuestionItem[];
}
