"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  subjectId: z.string().min(1),
});

export type ResetSubjectProgressResult =
  | { ok: true }
  | { ok: false; message: string };

export async function resetSubjectProgress(
  input: z.infer<typeof schema>,
): Promise<ResetSubjectProgressResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowe dane." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: "Brak sesji logowania." };
    }

    const { subjectId } = parsed.data;
    const { error: resetError } = await supabase.rpc("reset_subject_progress", {
      p_subject_id: subjectId,
    });

    if (resetError) {
      console.error(
        "[resetSubjectProgress] reset_subject_progress RPC",
        resetError.message,
        resetError.code,
        resetError.details,
      );
      return { ok: false, message: "Nie udało się wyzerować postępu." };
    }

    revalidatePath("/", "layout");

    return { ok: true };
  } catch (e) {
    console.error("[resetSubjectProgress]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
