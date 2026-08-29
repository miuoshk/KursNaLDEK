import { createAdminClient } from "@/lib/supabase/admin";
import { requireRotaOwner } from "@/features/admin/server/adminAuth";

export type CemInboxSubject = {
  id: string;
  name: string;
  shortName: string | null;
  inboxCount: number;
};

export type CemInboxTopic = {
  id: string;
  name: string;
  displayOrder: number;
};

export type CemInboxOccurrence = {
  number: number | null;
  sessionLabel: string;
  shortCode: string | null;
};

export type CemInboxQuestion = {
  id: string;
  text: string;
  options: { id: string; text: string }[];
  occurrences: CemInboxOccurrence[];
};

export type CemInboxSuggestion = {
  topicId: string;
  name: string;
  score: number;
};

function parseOptions(raw: unknown): { id: string; text: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      const r = row as { id?: unknown; text?: unknown };
      return {
        id: String(r.id ?? ""),
        text: String(r.text ?? ""),
      };
    })
    .filter((row) => row.id);
}

export function inboxTopicIdForSubject(subjectId: string): string {
  return `INBOX--${subjectId}`;
}

export async function loadCemInbox(subjectId: string | undefined): Promise<{
  subjects: CemInboxSubject[];
  subjectId: string | null;
  inboxId: string | null;
  remaining: number;
  topics: CemInboxTopic[];
  questions: CemInboxQuestion[];
}> {
  await requireRotaOwner();
  const admin = createAdminClient();

  const { data: subjectRows, error: se } = await admin
    .from("subjects")
    .select("id, name, short_name")
    .eq("product", "ldew")
    .order("display_order", { ascending: true });
  if (se) {
    console.error("[loadCemInbox] subjects", se.message);
  }

  const subjectsBase = (subjectRows ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    shortName: (row.short_name as string | null) ?? null,
  }));

  const counts = new Map<string, number>();
  if (subjectsBase.length > 0) {
    const inboxIds = subjectsBase.map((s) => inboxTopicIdForSubject(s.id));
    const { data: qrows, error: qe } = await admin
      .from("questions")
      .select("topic_id")
      .in("topic_id", inboxIds);
    if (qe) {
      console.error("[loadCemInbox] inbox counts", qe.message);
    }
    for (const row of qrows ?? []) {
      const tid = row.topic_id as string;
      counts.set(tid, (counts.get(tid) ?? 0) + 1);
    }
  }

  const subjects: CemInboxSubject[] = subjectsBase.map((s) => ({
    ...s,
    inboxCount: counts.get(inboxTopicIdForSubject(s.id)) ?? 0,
  }));

  const resolvedSubjectId =
    subjectId && subjects.some((s) => s.id === subjectId)
      ? subjectId
      : (subjects.find((s) => s.inboxCount > 0)?.id ?? subjects[0]?.id ?? null);

  if (!resolvedSubjectId) {
    return {
      subjects,
      subjectId: null,
      inboxId: null,
      remaining: 0,
      topics: [],
      questions: [],
    };
  }

  const inboxId = inboxTopicIdForSubject(resolvedSubjectId);

  const [topicsRes, questionsRes] = await Promise.all([
    admin
      .from("topics")
      .select("id, name, display_order")
      .eq("subject_id", resolvedSubjectId)
      .eq("is_inbox", false)
      .order("display_order", { ascending: true }),
    admin
      .from("questions")
      .select("id, text, options")
      .eq("topic_id", inboxId)
      .order("id", { ascending: true }),
  ]);

  if (topicsRes.error) {
    console.error("[loadCemInbox] topics", topicsRes.error.message);
  }
  if (questionsRes.error) {
    console.error("[loadCemInbox] questions", questionsRes.error.message);
  }

  const topics: CemInboxTopic[] = (topicsRes.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    displayOrder: Number(row.display_order ?? 0),
  }));

  const rawQuestions = questionsRes.data ?? [];
  const questionIds = rawQuestions.map((row) => row.id as string);
  const occByQuestion = new Map<string, CemInboxOccurrence[]>();

  if (questionIds.length > 0) {
    const { data: occRows, error: oe } = await admin
      .from("cem_question_occurrences")
      .select("question_id, question_number, cem_session_id")
      .in("question_id", questionIds);
    if (oe) {
      console.error("[loadCemInbox] occurrences", oe.message);
    }
    const sessionIds = [
      ...new Set((occRows ?? []).map((row) => row.cem_session_id as string).filter(Boolean)),
    ];
    const sessionById = new Map<string, { label: string; short_code: string | null }>();
    if (sessionIds.length > 0) {
      const { data: sessionRows, error: se2 } = await admin
        .from("cem_sessions")
        .select("id, label, short_code")
        .in("id", sessionIds);
      if (se2) {
        console.error("[loadCemInbox] sessions", se2.message);
      }
      for (const row of sessionRows ?? []) {
        sessionById.set(row.id as string, {
          label: (row.label as string) ?? "sesja CEM",
          short_code: (row.short_code as string | null) ?? null,
        });
      }
    }
    for (const row of occRows ?? []) {
      const qid = row.question_id as string;
      const ses = sessionById.get(row.cem_session_id as string);
      const list = occByQuestion.get(qid) ?? [];
      list.push({
        number: (row.question_number as number | null) ?? null,
        sessionLabel: ses?.label ?? "sesja CEM",
        shortCode: ses?.short_code ?? null,
      });
      occByQuestion.set(qid, list);
    }
  }

  const questions: CemInboxQuestion[] = rawQuestions.map((row) => ({
    id: row.id as string,
    text: row.text as string,
    options: parseOptions(row.options),
    occurrences: occByQuestion.get(row.id as string) ?? [],
  }));

  return {
    subjects,
    subjectId: resolvedSubjectId,
    inboxId,
    remaining: questions.length,
    topics,
    questions,
  };
}

export async function loadCemInboxSuggestions(
  questionId: string,
  subjectId: string,
): Promise<CemInboxSuggestion[]> {
  await requireRotaOwner();
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("cem_inbox_topic_suggestions", {
    p_question_id: questionId,
    p_subject_id: subjectId,
    p_limit: 3,
  });
  if (error) {
    console.error("[loadCemInboxSuggestions]", error.message);
    return [];
  }
  return ((data ?? []) as { topic_id: string; name: string; score: number }[]).map(
    (row) => ({
      topicId: row.topic_id,
      name: row.name,
      score: Number(row.score ?? 0),
    }),
  );
}
