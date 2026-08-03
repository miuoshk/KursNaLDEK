"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSubjectScopeIds } from "@/features/session/server/sharedSubjects";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireLearningAccessForSubject } from "@/features/access/server/requireLearningAccess";

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

    const access = await requireLearningAccessForSubject(user.id, parsed.data.subjectId);
    if (!access.ok) {
      return { ok: false, message: access.message };
    }

    const { subjectId } = parsed.data;
    const subjectScopeIds = getSubjectScopeIds(subjectId);
    const admin = createAdminClient();

    for (const scopeId of subjectScopeIds) {
      const { error: resetError } = await admin.rpc("reset_subject_progress_for_user", {
        p_user_id: user.id,
        p_subject_id: scopeId,
      });

      if (resetError) {
        console.error(
          "[resetSubjectProgress] reset_subject_progress RPC",
          scopeId,
          resetError.message,
          resetError.code,
          resetError.details,
        );
        return { ok: false, message: "Nie udało się wyzerować postępu." };
      }
    }

    revalidatePath("/", "layout");

    return { ok: true };
  } catch (e) {
    console.error("[resetSubjectProgress]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
