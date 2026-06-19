import type { SessionQuestionMeta } from "@/features/session/types";
import { personalEaseScore } from "@/features/session/lib/antares/questionMeta";

export type RankedQuestion = {
  questionId: string;
  topicId: string;
  score: number;
  isLeech: boolean;
  retrievability?: number;
  antares?: SessionQuestionMeta;
};

export type SessionComposerInput = {
  userId: string;
  count: number;
  subjectId?: string;
  topicId?: string;
  dueQuestions: RankedQuestion[];
  unseenQuestions: RankedQuestion[];
  leechQuestions: RankedQuestion[];
  topicMastery: Map<string, number>;
  accuracyLast20: number;
  dailyGoal: number;
  questionsToday: number;
  examDate: Date | null;
  /** Sesja w obrębie tematu — najpierw domknij nieodpowiedziane pytania. */
  prioritizeUnseen?: boolean;
};

export type ComposedSession = {
  questionIds: string[];
  composition: { dueReviews: number; newQuestions: number; leeches: number };
  metadata: {
    avgTopicMastery: number;
    estimatedDuration: number;
  };
};

type PoolTag = "due" | "unseen";

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Zwraca liczbę pełnych dni od „teraz” do daty egzaminu (null gdy brak daty).
 */
function daysUntilExam(examDate: Date | null, now: Date): number | null {
  if (!examDate) return null;
  const ms = examDate.getTime() - now.getTime();
  return Math.ceil(ms / 86_400_000);
}

/**
 * Układa pytania tak, aby unikać dwóch kolejnych pozycji z tym samym `topicId`
 * (round-robin po tematach). Gdy to niemożliwe, dopuszcza sąsiedztwo tego samego tematu.
 */
export function interleaveByTopic(questions: RankedQuestion[]): RankedQuestion[] {
  if (questions.length <= 1) {
    return [...questions];
  }

  const byTopic = new Map<string, RankedQuestion[]>();
  for (const q of questions) {
    const list = byTopic.get(q.topicId) ?? [];
    list.push(q);
    byTopic.set(q.topicId, list);
  }

  if (byTopic.size === 1) {
    return shuffle(questions);
  }

  const topicOrder = shuffle([...byTopic.keys()]);
  const result: RankedQuestion[] = [];
  const total = questions.length;

  while (result.length < total) {
    let progressed = false;
    for (const t of topicOrder) {
      const bucket = byTopic.get(t);
      if (!bucket?.length) continue;
      const next = bucket[0];
      const last = result[result.length - 1];
      if (last && last.topicId === next.topicId) continue;
      result.push(bucket.shift()!);
      progressed = true;
    }
    if (!progressed) {
      let forced = false;
      for (const t of topicOrder) {
        const bucket = byTopic.get(t);
        if (bucket?.length) {
          result.push(bucket.shift()!);
          forced = true;
          break;
        }
      }
      if (!forced) break;
    }
  }

  return result;
}

function dedupeByQuestionId(
  items: { q: RankedQuestion; tag: PoolTag }[],
): { q: RankedQuestion; tag: PoolTag }[] {
  const seen = new Set<string>();
  const out: { q: RankedQuestion; tag: PoolTag }[] = [];
  for (const item of items) {
    if (seen.has(item.q.questionId)) continue;
    seen.add(item.q.questionId);
    out.push(item);
  }
  return out;
}

function fillShortage(
  have: { q: RankedQuestion; tag: PoolTag }[],
  target: number,
  duePool: RankedQuestion[],
  unseenPool: RankedQuestion[],
): { q: RankedQuestion; tag: PoolTag }[] {
  const used = new Set(have.map((h) => h.q.questionId));
  const out = [...have];

  const tryPool = (pool: RankedQuestion[], tag: PoolTag) => {
    for (const q of pool) {
      if (out.length >= target) return;
      if (used.has(q.questionId)) continue;
      used.add(q.questionId);
      out.push({ q, tag });
    }
  };

  while (out.length < target) {
    const before = out.length;
    tryPool(duePool, "due");
    tryPool(unseenPool, "unseen");
    if (out.length === before) break;
  }

  return out.slice(0, target);
}

function personalEase(
  q: RankedQuestion,
  topicMastery: Map<string, number>,
): number {
  if (q.antares) return personalEaseScore(q.antares);
  const r = q.retrievability ?? 0;
  const tm = topicMastery.get(q.topicId) ?? 0.5;
  return r * 0.6 + tm * 0.4 - (q.isLeech ? 0.15 : 0);
}

/**
 * Układa sesję: rozgrzewka (łatwiejsze dla usera) → rdzeń (pilne) → schłodzenie (umiarkowane).
 */
export function applyPersonalizedCurve(
  questions: RankedQuestion[],
  topicMastery: Map<string, number>,
): RankedQuestion[] {
  if (questions.length <= 3) return [...questions];

  const n = questions.length;
  const warmEnd = Math.max(1, Math.ceil(n * 0.2));
  const coolStart = Math.max(warmEnd + 1, Math.floor(n * 0.8));

  const warm = [...questions.slice(0, warmEnd)].sort(
    (a, b) => personalEase(b, topicMastery) - personalEase(a, topicMastery),
  );
  const core = [...questions.slice(warmEnd, coolStart)].sort(
    (a, b) => b.score - a.score,
  );
  const cool = [...questions.slice(coolStart)].sort((a, b) => {
    const easeA = personalEase(a, topicMastery);
    const easeB = personalEase(b, topicMastery);
    return easeB - easeA;
  });

  return [...warm, ...core, ...cool];
}

/**
 * Buduje listę identyfikatorów pytań i metadane sesji na podstawie pul due / nowe / leech
 * oraz progów czasu do egzaminu.
 */
export function composeSession(input: SessionComposerInput): ComposedSession {
  const {
    count,
    dueQuestions,
    unseenQuestions,
    leechQuestions,
    topicMastery,
    accuracyLast20,
    dailyGoal,
    questionsToday,
    examDate,
    prioritizeUnseen = false,
  } = input;

  const now = new Date();
  const dueCount = dueQuestions.length;
  const unseenCount = unseenQuestions.length;
  const totalPool = dueCount + unseenCount;

  if (prioritizeUnseen && unseenCount > 0) {
    let takeNew = unseenQuestions.slice(0, Math.min(count, unseenQuestions.length));
    const takeNewIds = new Set(takeNew.map((q) => q.questionId));

    let takeDue = dueQuestions
      .filter((q) => !takeNewIds.has(q.questionId))
      .slice(0, Math.max(0, count - takeNew.length));

    const nLeechCap = Math.min(3, leechQuestions.length);
    const takeDueIds = new Set(takeDue.map((q) => q.questionId));
    const leechCandidates = leechQuestions
      .filter((q) => !takeNewIds.has(q.questionId) && !takeDueIds.has(q.questionId))
      .slice(0, nLeechCap);

    if (leechCandidates.length > 0 && takeDue.length > 0) {
      const k = Math.min(leechCandidates.length, takeDue.length);
      takeDue = takeDue.slice(0, takeDue.length - k);
      takeDue = [...takeDue, ...leechCandidates.slice(0, k)];
    }

    let merged: { q: RankedQuestion; tag: PoolTag }[] = [
      ...takeNew.map((q) => ({ q, tag: "unseen" as const })),
      ...takeDue.map((q) => ({ q, tag: "due" as const })),
    ];

    merged = dedupeByQuestionId(merged);

    if (merged.length < count) {
      merged = fillShortage(merged, count, dueQuestions, unseenQuestions);
    }

    merged = merged.slice(0, count);

    const mergedQs = merged.map((m) => m.q);
    const sourceById = new Map(
      merged.map((m) => [m.q.questionId, m.tag] as const),
    );

    const interleaved = interleaveByTopic(mergedQs);
    const curved = applyPersonalizedCurve(interleaved, topicMastery);
    const questionIds = curved.map((q) => q.questionId);

    const topicIdsInSession = [...new Set(curved.map((q) => q.topicId))];
    let avgTopicMastery = 0;
    if (topicIdsInSession.length > 0) {
      let sum = 0;
      for (const tid of topicIdsInSession) {
        sum += topicMastery.get(tid) ?? 0;
      }
      avgTopicMastery = sum / topicIdsInSession.length;
    }

    const dueReviews = curved.filter(
      (q) => sourceById.get(q.questionId) === "due",
    ).length;
    const newQuestions = curved.filter(
      (q) => sourceById.get(q.questionId) === "unseen",
    ).length;
    const leeches = curved.filter((q) => q.isLeech).length;

    return {
      questionIds,
      composition: { dueReviews, newQuestions, leeches },
      metadata: {
        avgTopicMastery,
        estimatedDuration: count * 15,
      },
    };
  }

  let dueRatio = totalPool > 0 ? dueCount / (totalPool + 1) : 0;

  const days = daysUntilExam(examDate, now);
  if (days !== null && days >= 0) {
    if (days < 14) {
      dueRatio = Math.min(0.95, dueRatio + 0.2);
    } else if (days < 30) {
      dueRatio = Math.min(0.9, dueRatio + 0.1);
    }
  }

  dueRatio = Math.min(0.95, Math.max(0.1, dueRatio));

  if (accuracyLast20 < 0.5) {
    dueRatio = Math.min(0.95, dueRatio + 0.15);
  } else if (accuracyLast20 > 0.8) {
    dueRatio = Math.max(0.1, dueRatio - 0.1);
  }

  if (questionsToday >= dailyGoal) {
    dueRatio = Math.min(0.95, dueRatio + 0.1);
  } else if (questionsToday + count < dailyGoal * 0.5) {
    dueRatio = Math.max(0.1, dueRatio - 0.05);
  }

  let nDue = Math.round(count * dueRatio);
  let nNew = count - nDue;
  nDue = Math.max(0, nDue);
  nNew = Math.max(0, nNew);

  const nLeechCap = Math.min(3, leechQuestions.length);

  let takeDue = dueQuestions.slice(0, Math.min(nDue, dueQuestions.length));
  const takeDueIds = new Set(takeDue.map((q) => q.questionId));

  const leechCandidates = leechQuestions
    .filter((q) => !takeDueIds.has(q.questionId))
    .slice(0, nLeechCap);

  if (leechCandidates.length > 0 && takeDue.length > 0) {
    const k = Math.min(leechCandidates.length, takeDue.length);
    takeDue = takeDue.slice(0, takeDue.length - k);
    takeDue = [...takeDue, ...leechCandidates.slice(0, k)];
  }

  let takeNew = unseenQuestions.slice(0, Math.min(nNew, unseenQuestions.length));

  let merged: { q: RankedQuestion; tag: PoolTag }[] = [
    ...takeDue.map((q) => ({ q, tag: "due" as const })),
    ...takeNew.map((q) => ({ q, tag: "unseen" as const })),
  ];

  merged = dedupeByQuestionId(merged);

  if (merged.length < count) {
    merged = fillShortage(merged, count, dueQuestions, unseenQuestions);
  }

  merged = merged.slice(0, count);

  const mergedQs = merged.map((m) => m.q);
  const sourceById = new Map(merged.map((m) => [m.q.questionId, m.tag] as const));

  const interleaved = interleaveByTopic(mergedQs);
  const curved = applyPersonalizedCurve(interleaved, topicMastery);

  const questionIds = curved.map((q) => q.questionId);

  const topicIdsInSession = [...new Set(curved.map((q) => q.topicId))];
  let avgTopicMastery = 0;
  if (topicIdsInSession.length > 0) {
    let sum = 0;
    for (const tid of topicIdsInSession) {
      sum += topicMastery.get(tid) ?? 0;
    }
    avgTopicMastery = sum / topicIdsInSession.length;
  }

  const dueReviews = curved.filter(
    (q) => sourceById.get(q.questionId) === "due",
  ).length;
  const newQuestions = curved.filter(
    (q) => sourceById.get(q.questionId) === "unseen",
  ).length;
  const leeches = curved.filter((q) => q.isLeech).length;

  return {
    questionIds,
    composition: { dueReviews, newQuestions, leeches },
    metadata: {
      avgTopicMastery,
      estimatedDuration: count * 15,
    },
  };
}
