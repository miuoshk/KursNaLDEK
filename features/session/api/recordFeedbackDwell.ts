"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  sessionId: z.string().uuid(),
  questionId: z.string().min(1),
  variant: z.enum(["concise", "standard", "remedial"]),
  dwellSeconds: z.number().min(0).max(3600),
});

export async function recordFeedbackDwell(raw: z.infer<typeof schema>) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false as const };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { data: session } = await supabase
    .from("study_sessions")
    .select(
      "id, user_id, subject_id, question_ids, reserve_question_ids, feedback_experiment_variant",
    )
    .eq("id", parsed.data.sessionId)
    .maybeSingle();
  const questionIds = (session?.question_ids as string[] | null) ?? [];
  const reserveQuestionIds =
    (session?.reserve_question_ids as string[] | null) ?? [];
  if (
    !session ||
    session.user_id !== user.id ||
    (!questionIds.includes(parsed.data.questionId) &&
      !reserveQuestionIds.includes(parsed.data.questionId))
  ) {
    return { ok: false as const };
  }
  if (session.feedback_experiment_variant !== "treatment") {
    return { ok: true as const };
  }
  const admin = createAdminClient();

  const { data: status, error } = await admin.rpc(
    "record_feedback_consumption",
    {
      p_user_id: user.id,
      p_session_id: parsed.data.sessionId,
      p_question_id: parsed.data.questionId,
      p_variant: parsed.data.variant,
      p_dwell_seconds: parsed.data.dwellSeconds,
    },
  );
  if (error || (status !== "applied" && status !== "already_applied")) {
    return { ok: false as const };
  }

  return { ok: true as const };
}
