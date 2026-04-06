"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  notifications_reviews: z.boolean(),
  notifications_weekly: z.boolean(),
});

export type UpdateNotifResult = { ok: true } | { ok: false; message: string };

export async function updateNotifications(
  input: z.infer<typeof schema>,
): Promise<UpdateNotifResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowe dane." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Brak sesji." };

  const { error } = await supabase
    .from("profiles")
    .update({
      notifications_reviews: parsed.data.notifications_reviews,
      notifications_weekly: parsed.data.notifications_weekly,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "Nie udało się zapisać powiadomień." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
