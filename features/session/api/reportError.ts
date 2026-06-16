"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  questionId: z.string().min(1),
  category: z.enum([
    "wrong_answer",
    "question_text",
    "explanation",
    "outdated",
    "other",
  ]),
  description: z.string().min(10).max(2000),
});

export type ReportErrorResult = { ok: true } | { ok: false; message: string };

export async function reportError(
  raw: z.infer<typeof schema>,
): Promise<ReportErrorResult> {
  const t = await getTranslations("session");
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: t("errors.descriptionMinLength") };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: t("errors.mustLogin") };
    }

    const categoryLabels: Record<string, string> = {
      wrong_answer: t("reportCategoryWrongAnswer"),
      question_text: t("reportCategoryQuestionText"),
      explanation: t("reportCategoryExplanation"),
      outdated: t("reportCategoryOutdated"),
      other: t("reportCategoryOther"),
    };

    const { error } = await supabase.from("error_reports").insert({
      question_id: parsed.data.questionId,
      user_id: user.id,
      category: categoryLabels[parsed.data.category] ?? parsed.data.category,
      description: parsed.data.description,
      status: "pending",
    });

    if (error) {
      console.error("[reportError]", error.message);
      return { ok: false, message: t("errors.reportFailed") };
    }

    return { ok: true };
  } catch (e) {
    console.error("[reportError]", e);
    return { ok: false, message: t("errors.unexpected") };
  }
}
