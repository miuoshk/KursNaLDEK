import type { SupabaseClient } from "@supabase/supabase-js";
import type { StatisticsPayload } from "@/features/statistics/types";

export async function masteryFromUqp(
  supabase: SupabaseClient,
  uqp: { question_id: string; times_answered: number; times_correct: number }[],
): Promise<{
  subjectMastery: StatisticsPayload["subjectMastery"];
  weakTopics: StatisticsPayload["weakTopics"];
  predictedReadiness: number | null;
}> {
  const qids = [...new Set(uqp.map((r) => r.question_id))];
  if (qids.length === 0) {
    return { subjectMastery: [], weakTopics: [], predictedReadiness: null };
  }

  const { data: qrows } = await supabase
    .from("questions")
    .select("id, topic_id")
    .in("id", qids);
  const topicIds = [...new Set((qrows ?? []).map((q) => q.topic_id as string))];
  if (topicIds.length === 0) {
    return { subjectMastery: [], weakTopics: [], predictedReadiness: null };
  }

  const { data: trows } = await supabase
    .from("topics")
    .select("id, name, subject_id")
    .in("id", topicIds);
  const subIds = [...new Set((trows ?? []).map((t) => t.subject_id as string))];
  if (subIds.length === 0) {
    return { subjectMastery: [], weakTopics: [], predictedReadiness: null };
  }
  const { data: subs } = await supabase
    .from("subjects")
    .select("id, name")
    .in("id", subIds);

  const subName = new Map((subs ?? []).map((s) => [s.id as string, s.name as string]));
  const topicMeta = new Map(
    (trows ?? []).map((t) => [
      t.id as string,
      { name: t.name as string, subjectId: t.subject_id as string },
    ]),
  );
  const qTopic = new Map(
    (qrows ?? []).map((q) => [q.id as string, q.topic_id as string]),
  );

  const topicAgg = new Map<string, { c: number; t: number }>();
  const subAgg = new Map<string, { c: number; t: number }>();

  for (const row of uqp) {
    const tid = qTopic.get(row.question_id);
    if (!tid) continue;
    const cur = topicAgg.get(tid) ?? { c: 0, t: 0 };
    cur.t += row.times_answered ?? 0;
    cur.c += row.times_correct ?? 0;
    topicAgg.set(tid, cur);
    const meta = topicMeta.get(tid);
    if (meta) {
      const s = subAgg.get(meta.subjectId) ?? { c: 0, t: 0 };
      s.t += row.times_answered ?? 0;
      s.c += row.times_correct ?? 0;
      subAgg.set(meta.subjectId, s);
    }
  }

  const subjectMastery = [...subAgg.entries()].map(([sid, v]) => ({
    subjectId: sid,
    subjectName: subName.get(sid) ?? sid,
    mastery: v.t > 0 ? v.c / v.t : 0,
  }));

  const weakTopics = [...topicAgg.entries()]
    .filter(([, v]) => v.t >= 3)
    .map(([topicId, v]) => {
      const meta = topicMeta.get(topicId);
      return {
        topicId,
        topicName: meta?.name ?? topicId,
        subjectId: meta?.subjectId ?? "",
        accuracy: v.t > 0 ? v.c / v.t : 0,
        answers: v.t,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  let num = 0;
  let den = 0;
  for (const sm of subjectMastery) {
    const w = subAgg.get(sm.subjectId)?.t ?? 0;
    num += sm.mastery * w;
    den += w;
  }
  const predictedReadiness = den > 0 ? num / den : null;

  return { subjectMastery, weakTopics, predictedReadiness };
}
