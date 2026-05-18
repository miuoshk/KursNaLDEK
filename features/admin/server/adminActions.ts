"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAccess } from "@/features/admin/server/adminAuth";

async function requireAdmin() {
  const access = await requireAdminAccess();
  const supabase = await createClient();
  return { supabase, userId: access.user.id, role: access.role };
}

/**
 * Wymaga roli `admin` (moderator nie wystarcza). Używać dla akcji,
 * które potrafią modyfikować uprawnienia (RBAC).
 */
async function requireSuperAdmin() {
  const ctx = await requireAdmin();
  if (ctx.role !== "admin") {
    throw new Error("Forbidden");
  }
  return ctx;
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

const setUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["admin", "moderator", "student"]),
});

/**
 * Zmiana roli użytkownika. Wymaga roli `admin`. Service-role client omija
 * RLS — dzięki temu update przechodzi nawet jeśli polityki nie pozwalają
 * adminom modyfikować innych profili.
 */
export async function setUserRole(
  raw: z.infer<typeof setUserRoleSchema>,
) {
  const parsed = setUserRoleSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, message: "Nieprawidłowe dane." };

  let ctx;
  try {
    ctx = await requireSuperAdmin();
  } catch {
    return {
      ok: false as const,
      message: "Tylko admin może zmieniać role użytkowników.",
    };
  }

  if (parsed.data.userId === ctx.userId) {
    return {
      ok: false as const,
      message: "Nie możesz zmienić własnej roli.",
    };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ role: parsed.data.role })
      .eq("id", parsed.data.userId);

    if (error) {
      console.error("[setUserRole]", error.message);
      return {
        ok: false as const,
        message: "Nie udało się zmienić roli.",
      };
    }
  } catch (e) {
    console.error("[setUserRole] admin client", e);
    return {
      ok: false as const,
      message: "Brak konfiguracji service role po stronie serwera.",
    };
  }

  return { ok: true as const };
}
