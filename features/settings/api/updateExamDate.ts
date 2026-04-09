"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  exam_date: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
});

export type UpdateExamDateResult = { ok: true } | { ok: false; message: string };

/** Stała data kalendarzowa w UTC (południe), żeby uniknąć przesunięć strefy. */
function dateInputToIsoUtc(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString();
}

export async function updateExamDate(
  input: z.infer<typeof schema>,
): Promise<UpdateExamDateResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Nieprawidłowa data." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Brak sesji." };

  const examDate =
    parsed.data.exam_date === "" ? null : dateInputToIsoUtc(parsed.data.exam_date);

  const { error } = await supabase
    .from("profiles")
    .update({
      exam_date: examDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "Nie udało się zapisać daty egzaminu." };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}
