"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdminAccess } from "@/features/admin/server/adminAuth";
import {
  loadAdminQuestionDetail,
  loadQuestionEdits,
  type AdminQuestionDetail,
  type QuestionEditLogEntry,
} from "@/features/admin/server/loadAdminQuestionDetail";
import { syncTopicQuestionCounts } from "@/features/admin/server/syncTopicQuestionCount";
import { revokeAllEntitlementsForUser } from "@/features/access/server/revokeEntitlements";
import { formatQuestionCopyText } from "@/features/admin/lib/formatQuestionCopyText";

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

  const { data: row, error: fetchError } = await supabase
    .from("questions")
    .select("topic_id")
    .eq("id", parsed.data.questionId)
    .maybeSingle();

  if (fetchError || !row?.topic_id) {
    console.error("[toggleQuestionActive] fetch", fetchError?.message);
    return { ok: false as const, message: "Nie znaleziono pytania." };
  }

  const topicId = row.topic_id as string;

  const { error } = await supabase
    .from("questions")
    .update({ is_active: parsed.data.isActive })
    .eq("id", parsed.data.questionId);

  if (error) {
    console.error("[toggleQuestionActive]", error.message);
    return { ok: false as const, message: "Nie udało się zaktualizować pytania." };
  }

  try {
    const admin = createAdminClient();
    await syncTopicQuestionCounts(admin, [topicId]);
  } catch (e) {
    console.error("[toggleQuestionActive] sync count", e);
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

const optionSchema = z.object({
  id: z.string().min(1).max(8),
  text: z.string().min(1).max(2000),
});

const updateQuestionSchema = z.object({
  questionId: z.string().min(1),
  reportId: z.string().uuid().optional(),
  text: z.string().min(1).max(4000),
  options: z.array(optionSchema).min(2).max(8),
  correctOptionId: z.string().min(1).max(8),
  explanation: z.string().min(1).max(8000),
  isActive: z.boolean(),
  sourceExam: z.string().max(120).nullable(),
  sourceCode: z.string().max(120).nullable(),
  imageUrl: z.string().max(2048).nullable(),
  topicId: z.string().max(120).nullable(),
  themeLabel: z.string().max(200).nullable(),
  subthemeLabel: z.string().max(200).nullable(),
  batchLabel: z.string().max(200).nullable(),
  learningOutcome: z.string().max(500).nullable(),
  disableOptionShuffle: z.boolean(),
});

type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;

function diffQuestion(
  before: AdminQuestionDetail,
  after: UpdateQuestionInput,
): Record<string, { before: unknown; after: unknown }> {
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  const compare = (
    field: string,
    a: unknown,
    b: unknown,
    deep = false,
  ) => {
    const equal = deep
      ? JSON.stringify(a) === JSON.stringify(b)
      : a === b;
    if (!equal) changes[field] = { before: a, after: b };
  };

  compare("text", before.text, after.text);
  compare("options", before.options, after.options, true);
  compare("correct_option_id", before.correctOptionId, after.correctOptionId);
  compare("explanation", before.explanation, after.explanation);
  compare("is_active", before.isActive, after.isActive);
  compare("source_exam", before.sourceExam, after.sourceExam);
  compare("source_code", before.sourceCode, after.sourceCode);
  compare("image_url", before.imageUrl, after.imageUrl);
  compare("topic_id", before.topicId, after.topicId);
  compare("theme_label", before.themeLabel, after.themeLabel);
  compare("subtheme_label", before.subthemeLabel, after.subthemeLabel);
  compare("batch_label", before.batchLabel, after.batchLabel);
  compare("learning_outcome", before.learningOutcome, after.learningOutcome);
  compare(
    "disable_option_shuffle",
    before.disableOptionShuffle,
    after.disableOptionShuffle,
  );

  return changes;
}

export async function updateQuestionFull(raw: UpdateQuestionInput) {
  const parsed = updateQuestionSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      message: "Nieprawidłowe dane formularza pytania.",
    };
  }

  const optionIds = parsed.data.options.map((opt) => opt.id);
  const uniqueIds = new Set(optionIds);
  if (uniqueIds.size !== optionIds.length) {
    return {
      ok: false as const,
      message: "Identyfikatory opcji muszą być unikalne (A–E).",
    };
  }
  if (!uniqueIds.has(parsed.data.correctOptionId)) {
    return {
      ok: false as const,
      message: "Poprawna odpowiedź musi wskazywać jedną z opcji.",
    };
  }

  let ctx;
  try {
    ctx = await requireAdmin();
  } catch {
    return {
      ok: false as const,
      message: "Brak uprawnień do edycji pytania.",
    };
  }

  const before = await loadAdminQuestionDetail(parsed.data.questionId);
  if (!before) {
    return {
      ok: false as const,
      message: "Nie znaleziono pytania.",
    };
  }

  const changes = diffQuestion(before, parsed.data);
  if (Object.keys(changes).length === 0) {
    return {
      ok: true as const,
      message: "Brak zmian — nie zapisano.",
      changedFields: [] as string[],
    };
  }

  const fullUpdatePayload = {
    text: parsed.data.text,
    options: parsed.data.options,
    correct_option_id: parsed.data.correctOptionId,
    explanation: parsed.data.explanation,
    is_active: parsed.data.isActive,
    source_exam: parsed.data.sourceExam,
    source_code: parsed.data.sourceCode,
    image_url: parsed.data.imageUrl,
    topic_id: parsed.data.topicId,
    theme_label: parsed.data.themeLabel,
    subtheme_label: parsed.data.subthemeLabel,
    batch_label: parsed.data.batchLabel,
    learning_outcome: parsed.data.learningOutcome,
    disable_option_shuffle: parsed.data.disableOptionShuffle,
  };

  const { error: updateError } = await ctx.supabase
    .from("questions")
    .update(fullUpdatePayload)
    .eq("id", parsed.data.questionId);

  if (updateError) {
    console.error("[updateQuestionFull] update", updateError.message);
    return {
      ok: false as const,
      message: "Nie udało się zapisać pytania.",
    };
  }

  const topicsToSync: string[] = [];
  if ("topic_id" in changes && before.topicId) topicsToSync.push(before.topicId);
  if ("topic_id" in changes && parsed.data.topicId) {
    topicsToSync.push(parsed.data.topicId);
  } else if ("is_active" in changes && (before.topicId ?? parsed.data.topicId)) {
    topicsToSync.push(before.topicId ?? parsed.data.topicId!);
  }

  if (topicsToSync.length > 0) {
    try {
      const admin = createAdminClient();
      await syncTopicQuestionCounts(admin, topicsToSync);
    } catch (e) {
      console.error("[updateQuestionFull] sync count", e);
    }
  }

  const { error: auditError } = await ctx.supabase
    .from("question_edits")
    .insert({
      question_id: parsed.data.questionId,
      editor_id: ctx.userId,
      editor_role: ctx.role ?? "admin",
      report_id: parsed.data.reportId ?? null,
      changes,
    });

  if (auditError) {
    console.error("[updateQuestionFull] audit", auditError.message);
    // Update przeszedł — audit fail nie cofa zmian, ale zgłaszamy do logów.
  }

  return {
    ok: true as const,
    changedFields: Object.keys(changes),
  };
}

export async function fetchQuestionForAdmin(questionId: string): Promise<
  | { ok: true; question: AdminQuestionDetail; history: QuestionEditLogEntry[] }
  | { ok: false; message: string }
> {
  try {
    await requireAdminAccess();
  } catch {
    return { ok: false, message: "Brak uprawnień." };
  }

  const [question, history] = await Promise.all([
    loadAdminQuestionDetail(questionId),
    loadQuestionEdits(questionId),
  ]);

  if (!question) {
    return { ok: false, message: "Nie znaleziono pytania." };
  }

  return { ok: true, question, history };
}

export async function fetchQuestionCopyText(questionId: string): Promise<
  { ok: true; text: string } | { ok: false; message: string }
> {
  try {
    await requireAdminAccess();
  } catch {
    return { ok: false, message: "Brak uprawnień." };
  }

  const supabase = await createClient();
  const question = await loadAdminQuestionDetail(questionId);
  if (!question) {
    return { ok: false, message: "Nie znaleziono pytania." };
  }

  let subjectName = "—";
  let topicName = "—";

  if (question.topicId) {
    const { data: topicRow } = await supabase
      .from("topics")
      .select("name, subjects(name)")
      .eq("id", question.topicId)
      .maybeSingle();

    topicName = (topicRow?.name as string | null)?.trim() || "—";
    const subjectNode = topicRow?.subjects as
      | { name: string }
      | { name: string }[]
      | null;
    subjectName =
      (Array.isArray(subjectNode) ? subjectNode[0]?.name : subjectNode?.name)?.trim() ||
      "—";
  }

  return {
    ok: true,
    text: formatQuestionCopyText({
      subjectName,
      topicName,
      text: question.text,
      options: question.options,
      correctOptionId: question.correctOptionId,
      explanation: question.explanation,
      questionType: question.questionType,
    }),
  };
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

const banUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().max(500).optional(),
  includeIp: z.boolean().optional(),
});

export async function banUser(raw: z.infer<typeof banUserSchema>) {
  const parsed = banUserSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, message: "Nieprawidłowe dane." };

  let ctx;
  try {
    ctx = await requireSuperAdmin();
  } catch {
    return { ok: false as const, message: "Tylko admin może banować użytkowników." };
  }

  if (parsed.data.userId === ctx.userId) {
    return { ok: false as const, message: "Nie możesz zbanować własnego konta." };
  }

  try {
    const admin = createAdminClient();

    const { data: authData, error: authError } = await admin.auth.admin.getUserById(
      parsed.data.userId,
    );
    if (authError || !authData.user?.email) {
      console.error("[banUser] getUserById", authError?.message);
      return { ok: false as const, message: "Nie znaleziono użytkownika." };
    }

    const email = authData.user.email.trim().toLowerCase();

    const { data: existingBan } = await admin
      .from("account_bans")
      .select("id")
      .is("revoked_at", null)
      .ilike("email", email)
      .maybeSingle();

    if (existingBan) {
      return { ok: false as const, message: "Ten użytkownik jest już zbanowany." };
    }

    let ipAddress: string | null = null;
    if (parsed.data.includeIp !== false) {
      const { data: profile } = await admin
        .from("profiles")
        .select("last_login_ip")
        .eq("id", parsed.data.userId)
        .maybeSingle();
      ipAddress = (profile?.last_login_ip as string | null)?.trim() || null;
    }

    const { error: insertError } = await admin.from("account_bans").insert({
      email,
      ip_address: ipAddress,
      user_id: parsed.data.userId,
      reason: parsed.data.reason?.trim() || null,
      banned_by: ctx.userId,
    });

    if (insertError) {
      console.error("[banUser] insert", insertError.message);
      return { ok: false as const, message: "Nie udało się dodać bana." };
    }

    await admin.auth.admin.signOut(parsed.data.userId, "global");
  } catch (e) {
    console.error("[banUser]", e);
    return { ok: false as const, message: "Brak konfiguracji service role po stronie serwera." };
  }

  return { ok: true as const };
}

const unbanUserSchema = z.object({
  userId: z.string().uuid(),
});

export async function unbanUser(raw: z.infer<typeof unbanUserSchema>) {
  const parsed = unbanUserSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, message: "Nieprawidłowe dane." };

  try {
    await requireSuperAdmin();
  } catch {
    return { ok: false as const, message: "Tylko admin może odbanować użytkowników." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("account_bans")
      .update({ revoked_at: new Date().toISOString() })
      .eq("user_id", parsed.data.userId)
      .is("revoked_at", null);

    if (error) {
      console.error("[unbanUser]", error.message);
      return { ok: false as const, message: "Nie udało się odbanować użytkownika." };
    }
  } catch (e) {
    console.error("[unbanUser]", e);
    return { ok: false as const, message: "Brak konfiguracji service role po stronie serwera." };
  }

  return { ok: true as const };
}

const revokeAccessSchema = z.object({
  userId: z.string().uuid(),
});

export async function revokeUserAccess(raw: z.infer<typeof revokeAccessSchema>) {
  const parsed = revokeAccessSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, message: "Nieprawidłowe dane." };

  let ctx;
  try {
    ctx = await requireSuperAdmin();
  } catch {
    return { ok: false as const, message: "Tylko admin może odbierać dostęp." };
  }

  if (parsed.data.userId === ctx.userId) {
    return { ok: false as const, message: "Nie możesz odebrać dostępu własnemu kontu." };
  }

  try {
    const admin = createAdminClient();
    await revokeAllEntitlementsForUser(parsed.data.userId);

    const { error: profileError } = await admin
      .from("profiles")
      .update({ access_revoked_at: new Date().toISOString() })
      .eq("id", parsed.data.userId);

    if (profileError) {
      console.error("[revokeUserAccess] profile", profileError.message);
      return { ok: false as const, message: "Nie udało się oznaczyć konta jako bez dostępu." };
    }

    await admin.auth.admin.signOut(parsed.data.userId, "global");
  } catch (e) {
    console.error("[revokeUserAccess]", e);
    return { ok: false as const, message: "Nie udało się odebrać dostępu." };
  }

  return { ok: true as const };
}

export async function restoreUserAccess(raw: z.infer<typeof revokeAccessSchema>) {
  const parsed = revokeAccessSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, message: "Nieprawidłowe dane." };

  try {
    await requireSuperAdmin();
  } catch {
    return { ok: false as const, message: "Tylko admin może przywracać możliwość dostępu." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ access_revoked_at: null })
      .eq("id", parsed.data.userId);

    if (error) {
      console.error("[restoreUserAccess]", error.message);
      return { ok: false as const, message: "Nie udało się przywrócić możliwości dostępu." };
    }
  } catch (e) {
    console.error("[restoreUserAccess]", e);
    return { ok: false as const, message: "Nie udało się przywrócić możliwości dostępu." };
  }

  return { ok: true as const };
}
