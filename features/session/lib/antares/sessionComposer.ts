export type RankedQuestion = {
  questionId: string;
  topicId: string;
  score: number;
  isLeech: boolean;
  difficulty: string;
  retrievability?: number;
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
  examDate: Date | null;
};

export type ComposedSession = {
  questionIds: string[];
  composition: { dueReviews: number; newQuestions: number; leeches: number };
  metadata: {
    avgTopicMastery: number;
    estimatedDuration: number;
    difficultyDistribution: { easy: number; medium: number; hard: number };
  };
};

type PoolTag = "due" | "unseen";

const DIFF_ORDER: Record<string, number> = {
  latwe: 1,
  srednie: 2,
  trudne: 3,
};

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeDifficultyLabel(d: string): keyof typeof DIFF_ORDER {
  const x = d.trim().toLowerCase();
  if (x === "latwe" || x === "easy" || x === "łatwe") return "latwe";
  if (x === "trudne" || x === "hard") return "trudne";
  return "srednie";
}

function difficultyRank(d: string): number {
  return DIFF_ORDER[normalizeDifficultyLabel(d)] ?? 2;
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

/**
 * Groups by difficulty rank, shuffles within each group, then concatenates
 * in the requested order. Breaks deterministic same-difficulty ordering.
 */
function sortByDifficultyShuffled(
  arr: RankedQuestion[],
  ascending: boolean,
): RankedQuestion[] {
  const groups = new Map<number, RankedQuestion[]>();
  for (const q of arr) {
    const rank = difficultyRank(q.difficulty);
    const list = groups.get(rank) ?? [];
    list.push(q);
    groups.set(rank, list);
  }
  const ranks = [...groups.keys()].sort((a, b) =>
    ascending ? a - b : b - a,
  );
  const result: RankedQuestion[] = [];
  for (const rank of ranks) {
    result.push(...shuffle(groups.get(rank)!));
  }
  return result;
}

/**
 * Dostosowuje kolejność do krzywej trudności: rozgrzewka (łatwiejsze), rdzeń (cięższe),
 * schłodzenie (łagodniejsze zakończenie). Przy ≤ 5 pytaniach losuje kolejność.
 */
export function applyDifficultyCurve(questions: RankedQuestion[]): RankedQuestion[] {
  const n = questions.length;
  if (n <= 5) {
    return shuffle(questions);
  }

  const w = Math.floor(n * 0.2);
  const c = Math.floor(n * 0.6);
  const coolLen = n - w - c;

  const warm = questions.slice(0, w);
  const core = questions.slice(w, w + c);
  const cool = questions.slice(w + c, w + c + coolLen);

  return [
    ...sortByDifficultyShuffled(warm, true),
    ...sortByDifficultyShuffled(core, false),
    ...sortByDifficultyShuffled(cool, true),
  ];
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
    examDate,
  } = input;

  const now = new Date();
  const dueCount = dueQuestions.length;
  const unseenCount = unseenQuestions.length;
  const totalPool = dueCount + unseenCount;

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

  let interleaved = interleaveByTopic(mergedQs);
  interleaved = applyDifficultyCurve(interleaved);

  const questionIds = interleaved.map((q) => q.questionId);

  const topicIdsInSession = [...new Set(interleaved.map((q) => q.topicId))];
  let avgTopicMastery = 0;
  if (topicIdsInSession.length > 0) {
    let sum = 0;
    for (const tid of topicIdsInSession) {
      sum += topicMastery.get(tid) ?? 0;
    }
    avgTopicMastery = sum / topicIdsInSession.length;
  }

  const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
  for (const q of interleaved) {
    const lab = normalizeDifficultyLabel(q.difficulty);
    if (lab === "latwe") difficultyDistribution.easy += 1;
    else if (lab === "trudne") difficultyDistribution.hard += 1;
    else difficultyDistribution.medium += 1;
  }

  const dueReviews = interleaved.filter(
    (q) => sourceById.get(q.questionId) === "due",
  ).length;
  const newQuestions = interleaved.filter(
    (q) => sourceById.get(q.questionId) === "unseen",
  ).length;
  const leeches = interleaved.filter((q) => q.isLeech).length;

  return {
    questionIds,
    composition: { dueReviews, newQuestions, leeches },
    metadata: {
      avgTopicMastery,
      estimatedDuration: count * 15,
      difficultyDistribution,
    },
  };
}
