import type { SourceFilter } from "@/features/session/types";

export const TEST_EXPORT_PRODUCTS = ["ldek", "ldew"] as const;
export type TestExportProduct = (typeof TEST_EXPORT_PRODUCTS)[number];

export const TEST_EXPORT_TRACKS = ["stomatologia", "lekarski"] as const;
export type TestExportTrack = (typeof TEST_EXPORT_TRACKS)[number];

export const MAX_TEST_QUESTIONS = 200;

export type TestExportSource = SourceFilter;

export type TopicSourceCount = {
  topicId: string;
  source: string;
  firstSeenSession: string | null;
  count: number;
};

export type TestExportTopicQuota = {
  topicId: string;
  count: number;
};

export type SelectableQuestion = {
  id: string;
  topicId: string;
  source: string | null;
  firstSeenSession: string | null;
  text: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
  imageUrl: string | null;
};

export type SelectedTestQuestion = SelectableQuestion & {
  number: number;
};

export type SelectQuestionsInput<T extends SelectableQuestion> = {
  pool: T[];
  quotas: TestExportTopicQuota[];
  source: TestExportSource;
  product: TestExportProduct;
  cemSessionIds: string[];
  shuffle: boolean;
  seed: number;
  maxQuestions?: number;
};

export type SelectQuestionsError =
  | { code: "empty_blueprint" }
  | { code: "over_limit"; requested: number; max: number }
  | { code: "insufficient_pool"; topicId: string; requested: number; available: number };

export type SelectQuestionsResult<T extends SelectableQuestion> =
  | { ok: true; questions: Array<T & { number: number }> }
  | { ok: false; error: SelectQuestionsError };

export type TestExportRequest = {
  title: string;
  subtitle?: string;
  product: TestExportProduct;
  track: TestExportTrack;
  source: TestExportSource;
  cemSessionIds: string[];
  topics: TestExportTopicQuota[];
  shuffle: boolean;
  seed?: number;
  includeKeyAtEnd: boolean;
  includeKeyFile: boolean;
  includeExplanationsFile: boolean;
};

export type TestExportManifest = {
  generatedAt: string;
  title: string;
  subtitle: string | null;
  product: TestExportProduct;
  track: TestExportTrack;
  source: TestExportSource;
  cemSessionIds: string[];
  shuffle: boolean;
  seed: number;
  questionIds: string[];
  quotas: TestExportTopicQuota[];
};
