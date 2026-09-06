import { z } from "zod";

export const feedbackEventSchema = z.discriminatedUnion("eventType", [
  z.object({
    eventType: z.literal("feedback_shown"),
    questionId: z.string().min(1),
    payload: z.object({
      variant: z.enum(["concise", "standard", "remedial"]),
      hasBlocks: z.boolean(),
      hypercorrection: z.boolean(),
      elements: z.array(z.string().min(1)).max(20),
    }),
  }),
  z.object({
    eventType: z.literal("feedback_expand"),
    questionId: z.string().min(1),
    payload: z.object({
      section: z.enum(["full", "distractors"]),
    }),
  }),
]);

export type ParsedFeedbackEvent = z.infer<typeof feedbackEventSchema>;

const coreSchema = z.object({
  sessionId: z.string().uuid(),
  durationSecondsFallback: z.number().int().min(0).optional(),
});

export type ParsedCompleteSessionPayload = {
  sessionId: string;
  durationSecondsFallback?: number;
  feedbackEvents: ParsedFeedbackEvent[];
};

/**
 * Waliduje completeSession. Złe `feedbackEvents` są odrzucane, ale nie
 * blokują zamknięcia sesji — inaczej after() nie zapisze wskazówek.
 */
export function parseCompleteSessionPayload(
  raw: unknown,
):
  | { ok: true; data: ParsedCompleteSessionPayload }
  | { ok: false } {
  const parsed = coreSchema.safeParse(raw);
  if (!parsed.success) return { ok: false };

  const rawEvents =
    typeof raw === "object" && raw != null && "feedbackEvents" in raw
      ? (raw as { feedbackEvents?: unknown }).feedbackEvents
      : undefined;

  const eventsParsed = z
    .array(feedbackEventSchema)
    .max(200)
    .safeParse(rawEvents ?? []);

  if (!eventsParsed.success) {
    console.error(
      "[completeSession] feedbackEvents dropped",
      eventsParsed.error.flatten(),
    );
  }

  return {
    ok: true,
    data: {
      sessionId: parsed.data.sessionId,
      durationSecondsFallback: parsed.data.durationSecondsFallback,
      feedbackEvents: eventsParsed.success ? eventsParsed.data : [],
    },
  };
}
