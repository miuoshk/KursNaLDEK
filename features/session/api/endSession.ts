"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  sessionId: z.string().uuid(),
  durationSeconds: z.number().int().min(0),
});

export type EndSessionResult = { ok: true } | { ok: false; message: string };

export async function endSession(
  raw: z.infer<typeof schema>,
): Promise<EndSessionResult> {
  const parsed = schema.safeParse(raw);
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

    const { data: session, error: se } = await supabase
      .from("study_sessions")
      .select("id, user_id")
      .eq("id", parsed.data.sessionId)
      .maybeSingle();

    if (se || !session || session.user_id !== user.id) {
      return { ok: false, message: "Sesja nie została znaleziona." };
    }

    const { error: up } = await supabase
      .from("study_sessions")
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        duration_seconds: parsed.data.durationSeconds,
      })
      .eq("id", session.id);

    if (up) {
      console.error("[endSession]", up.message);
      return { ok: false, message: "Nie udało się zakończyć sesji." };
    }

    return { ok: true };
  } catch (e) {
    console.error("[endSession]", e);
    return { ok: false, message: "Wystąpił nieoczekiwany błąd." };
  }
}
