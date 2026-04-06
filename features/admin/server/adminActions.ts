"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Forbidden");
  return { supabase, userId: user.id };
}

const resolveSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["resolved", "rejected", "reviewed"]),
  adminResponse: z.string().optional(),
});

export async function resolveReport(
  raw: z.infer<typeof resolveSchema>,
) {
  const parsed = resolveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, message: "Nieprawidłowe dane." };

  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("error_reports")
    .update({
      status: parsed.data.status,
      admin_response: parsed.data.adminResponse ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.reportId);

  if (error) {
    console.error("[resolveReport]", error.message);
    return { ok: false as const, message: "Nie udało się zaktualizować zgłoszenia." };
  }

  return { ok: true as const };
}

const toggleQuestionSchema = z.object({
  questionId: z.string().min(1),
  isActive: z.boolean(),
});

export async function toggleQuestionActive(
  raw: z.infer<typeof toggleQuestionSchema>,
) {
  const parsed = toggleQuestionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, message: "Nieprawidłowe dane." };

  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("questions")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.questionId);

  if (error) {
    console.error("[toggleQuestionActive]", error.message);
    return { ok: false as const, message: "Nie udało się zaktualizować pytania." };
  }

  return { ok: true as const };
}

const editQuestionSchema = z.object({
  questionId: z.string().min(1),
  text: z.string().min(1).optional(),
  explanation: z.string().optional(),
  difficulty: z.string().optional(),
});

export async function editQuestion(
  raw: z.infer<typeof editQuestionSchema>,
) {
  const parsed = editQuestionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, message: "Nieprawidłowe dane." };

  const { supabase } = await requireAdmin();

  const updates: Record<string, unknown> = {};
  if (parsed.data.text) updates.text = parsed.data.text;
  if (parsed.data.explanation) updates.explanation = parsed.data.explanation;
  if (parsed.data.difficulty) updates.difficulty = parsed.data.difficulty;

  if (Object.keys(updates).length === 0) {
    return { ok: false as const, message: "Brak zmian." };
  }

  const { error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", parsed.data.questionId);

  if (error) {
    console.error("[editQuestion]", error.message);
    return { ok: false as const, message: "Nie udało się edytować pytania." };
  }

  return { ok: true as const };
}
