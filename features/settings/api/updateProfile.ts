"use server";

import { getTranslations } from "next-intl/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isClinicalProduct } from "@/features/access/lib/studyAccess";
import { normalizeProduct, STUDY_PRODUCTS } from "@/features/access/lib/studyAccess";
import { isValidEmoji } from "@/lib/emoji";
import { isProfileAdmin } from "@/lib/auth/profileAdmin";
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
  current_product: z.enum(STUDY_PRODUCTS).optional(),
  avatar_initials: z.string().max(4).optional().nullable(),
  avatar_emoji: z
    .string()
    .trim()
    .refine((value) => value === "" || isValidEmoji(value), {
      message: "avatarEmojiInvalid",
    })
    .optional()
    .nullable(),
});

export type UpdateProfileResult = { ok: true } | { ok: false; message: string };

export async function updateProfile(input: z.infer<typeof schema>): Promise<UpdateProfileResult> {
  const tSettings = await getTranslations("settings");
  const tErrors = await getTranslations("errors");
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: tSettings("errors.invalidFormData") };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: tErrors("noSession") };

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("role, current_product")
    .eq("id", user.id)
    .maybeSingle();

  const requestedProduct = parsed.data.current_product
    ? normalizeProduct(parsed.data.current_product)
    : normalizeProduct(existingProfile?.current_product as string | null | undefined);

  if (requestedProduct !== "knnp" && !isProfileAdmin(existingProfile?.role)) {
    return { ok: false, message: tSettings("errors.productSwitchForbidden") };
  }

  const initials = parsed.data.avatar_initials?.trim() || null;
  const emojiRaw = parsed.data.avatar_emoji?.trim() || null;
  const emoji = emojiRaw && isValidEmoji(emojiRaw) ? emojiRaw : null;

  const updatePayload: Record<string, unknown> = {
    nick: parsed.data.nick,
    display_name: parsed.data.nick,
    avatar_initials: initials,
    avatar_emoji: emoji,
    updated_at: new Date().toISOString(),
  };

  if (isClinicalProduct(requestedProduct)) {
    updatePayload.current_product = requestedProduct;
    updatePayload.current_track = "stomatologia";
    updatePayload.current_year = 1;
  } else {
    updatePayload.current_product = "knnp";
    updatePayload.current_track = parsed.data.current_track;
    updatePayload.current_year = parsed.data.current_year;
  }

  const { error } = await supabase.from("profiles").update(updatePayload).eq("id", user.id);

  if (error) {
    if (
      error.code === "23505" ||
      (typeof error.message === "string" &&
        error.message.toLowerCase().includes("profiles_nick_lower_unique"))
    ) {
      return { ok: false, message: tErrors("nickTaken") };
    }
    return { ok: false, message: tSettings("errors.profileSaveFailed") };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
