"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  display_name: z.string().min(1).max(120),
  current_track: z.enum(["stomatologia", "lekarski"]),
  current_year: z.coerce.number().int().min(1).max(3),
  avatar_initials: z.string().max(4).optional().nullable(),
});

export type UpdateProfileResult = { ok: true } | { ok: false; message: string };

export async function updateProfile(input: z.infer<typeof schema>): Promise<UpdateProfileResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowe dane formularza." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Brak sesji." };

  const initials = parsed.data.avatar_initials?.trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.display_name,
      current_track: parsed.data.current_track,
      current_year: parsed.data.current_year,
      avatar_initials: initials,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "Nie udało się zapisać profilu." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
