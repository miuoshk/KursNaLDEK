"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRotaOwner } from "@/features/admin/server/adminAuth";
import { syncTopicQuestionCounts } from "@/features/admin/server/syncTopicQuestionCount";
import {
  inboxTopicIdForSubject,
  loadCemInboxSuggestions,
} from "@/features/admin/server/loadCemInbox";

const assignSchema = z.object({
  questionId: z.string().min(1),
  topicId: z.string().min(1),
  subjectId: z.string().min(1),
});

export async function assignCemInboxQuestion(
  raw: z.infer<typeof assignSchema>,
): Promise<
  | { ok: true; inboxId: string; topicId: string }
  | { ok: false; message: string }
> {
  const parsed = assignSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Nieprawidłowe dane." };

  await requireRotaOwner();
  const admin = createAdminClient();
  const inboxId = inboxTopicIdForSubject(parsed.data.subjectId);

  if (parsed.data.topicId === inboxId) {
    return { ok: false, message: "Wybierz temat, nie poczekalnię." };
  }

  const { data: question, error: qe } = await admin
    .from("questions")
    .select("id, topic_id")
    .eq("id", parsed.data.questionId)
    .maybeSingle();
  if (qe || !question) {
    return { ok: false, message: "Nie znaleziono pytania." };
  }
  if ((question.topic_id as string) !== inboxId) {
    return { ok: false, message: "Pytanie nie jest w poczekalni tego przedmiotu." };
  }

  const { data: topic, error: te } = await admin
    .from("topics")
    .select("id, subject_id, is_inbox")
    .eq("id", parsed.data.topicId)
    .maybeSingle();
  if (te || !topic) {
    return { ok: false, message: "Nie znaleziono tematu." };
  }
  if (topic.is_inbox) {
    return { ok: false, message: "Nie można przypisać do poczekalni." };
  }
  if ((topic.subject_id as string) !== parsed.data.subjectId) {
    return { ok: false, message: "Temat nie należy do tego przedmiotu." };
  }

  const { error: ue } = await admin
    .from("questions")
    .update({ topic_id: parsed.data.topicId })
    .eq("id", parsed.data.questionId)
    .eq("topic_id", inboxId);
  if (ue) {
    console.error("[assignCemInboxQuestion]", ue.message);
    return { ok: false, message: "Nie udało się zapisać." };
  }

  await syncTopicQuestionCounts(admin, [parsed.data.topicId, inboxId]);
  return { ok: true, inboxId, topicId: parsed.data.topicId };
}

const undoSchema = z.object({
  questionId: z.string().min(1),
  topicId: z.string().min(1),
  subjectId: z.string().min(1),
});

export async function undoCemInboxAssignment(
  raw: z.infer<typeof undoSchema>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = undoSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "Nieprawidłowe dane." };

  await requireRotaOwner();
  const admin = createAdminClient();
  const inboxId = inboxTopicIdForSubject(parsed.data.subjectId);

  const { error } = await admin
    .from("questions")
    .update({ topic_id: inboxId })
    .eq("id", parsed.data.questionId)
    .eq("topic_id", parsed.data.topicId);
  if (error) {
    console.error("[undoCemInboxAssignment]", error.message);
    return { ok: false, message: "Nie udało się cofnąć." };
  }

  await syncTopicQuestionCounts(admin, [parsed.data.topicId, inboxId]);
  return { ok: true };
}

export async function suggestCemInboxTopics(questionId: string, subjectId: string) {
  return loadCemInboxSuggestions(questionId, subjectId);
}
