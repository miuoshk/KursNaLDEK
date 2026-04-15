"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  nick: z
    .string()
    .trim()
    .min(3)
    .max(32)
    .regex(/^[A-Za-z0-9._-]+$/),
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
      nick: parsed.data.nick,
      display_name: parsed.data.nick,
      current_track: parsed.data.current_track,
      current_year: parsed.data.current_year,
      avatar_initials: initials,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    if (
      error.code === "23505" ||
      (typeof error.message === "string" &&
        error.message.toLowerCase().includes("profiles_nick_lower_unique"))
    ) {
      return { ok: false, message: "Ten nick jest już zajęty." };
    }
    return { ok: false, message: "Nie udało się zapisać profilu." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
