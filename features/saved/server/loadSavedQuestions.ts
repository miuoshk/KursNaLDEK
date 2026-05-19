import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SavedQuestionItem = {
  savedId: string;
  savedAt: string;
  questionId: string;
  questionText: string;
  topicName: string | null;
  subjectId: string | null;
  subjectName: string | null;
  subjectShortName: string | null;
  subjectYear: number | null;
  subjectTrack: string | null;
};

/**
 * Lista zapisanych pytań aktualnego usera. Posortowane od najnowszego.
 * Ograniczenie 200 wystarcza nawet ciężkim review-userom; jeśli kiedyś
 * potrzeba paginacji — dorobimy offset/limit.
 */
export async function loadSavedQuestions(): Promise<SavedQuestionItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("saved_questions")
    .select(
      "id, created_at, question_id, questions(text, topics(name, subjects(id, name, short_name, year, track)))",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error || !data) return [];

  return data.map((row) => {
    const q = (row as { questions?: unknown }).questions as
      | {
          text?: string | null;
          topics?: {
            name?: string | null;
            subjects?: {
              id?: string | null;
              name?: string | null;
              short_name?: string | null;
              year?: number | null;
              track?: string | null;
            } | null;
          } | null;
        }
      | null;
    const topic = q?.topics ?? null;
    const subj = topic?.subjects ?? null;
    return {
      savedId: row.id as string,
      savedAt: row.created_at as string,
      questionId: row.question_id as string,
      questionText: q?.text ?? "",
      topicName: topic?.name ?? null,
      subjectId: subj?.id ?? null,
      subjectName: subj?.name ?? null,
      subjectShortName: subj?.short_name ?? null,
      subjectYear: subj?.year ?? null,
      subjectTrack: subj?.track ?? null,
    };
  });
}
