"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  reportIds: z.array(z.string().uuid()).min(1).max(50),
});

export type MarkReportNotificationsReadResult =
  | { ok: true }
  | { ok: false; message: string };

export async function markReportNotificationsRead(
  raw: z.infer<typeof schema>,
): Promise<MarkReportNotificationsReadResult> {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowe dane." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { ok: false, message: "Musisz być zalogowany." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("error_reports")
    .update({ notification_read_at: now })
    .eq("user_id", user.id)
    .in("id", parsed.data.reportIds)
    .is("notification_read_at", null);

  if (error) {
    console.error("[markReportNotificationsRead]", error.message);
    return { ok: false, message: "Nie udało się oznaczyć powiadomień." };
  }

  return { ok: true };
}
