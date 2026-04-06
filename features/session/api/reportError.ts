"use server";

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
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Opis musi mieć minimum 10 znaków." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Musisz być zalogowany." };
    }

    const categoryLabels: Record<string, string> = {
      wrong_answer: "Błędna poprawna odpowiedź",
      question_text: "Błąd w treści pytania",
      explanation: "Błąd w wyjaśnieniu",
      outdated: "Nieaktualne informacje",
      other: "Inne",
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
      return { ok: false, message: "Nie udało się wysłać zgłoszenia." };
    }

    return { ok: true };
  } catch (e) {
    console.error("[reportError]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
