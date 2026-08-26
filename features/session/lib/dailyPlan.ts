import { buildSessionStartHref } from "@/features/session/lib/sessionCount";
import type { LearningExperimentVariant } from "@/features/session/lib/experiments/memoryV2Experiment";

export type DailyPlanRationale =
  "plan_complete" | "due_backlog" | "exam_near" | "saved_concepts" | "balanced";

export type DailyStudyPlan = {
  budgetMinutes: number;
  targetQuestions: number;
  completedQuestions: number;
  completedEstimatedMinutes: number;
  questionCount: number;
  estimatedMinutes: number;
  dueCount: number;
  newCount: number;
  remediationCount: number;
  dueBacklog: number;
  progress: number;
  rationale: DailyPlanRationale[];
  startHref: string | null;
  experimentVariant: LearningExperimentVariant;
};

export type BuildDailyPlanInput = {
  dailyMinutes: number;
  averageQuestionSeconds: number;
  questionsToday: number;
  dueBacklog: number;
  remediationBacklog: number;
  savedConceptSignalCount: number;
  daysToExam: number | null;
  maxQuestions?: number;
  subjectId?: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function estimateQuestionSeconds(
  observedAverageSeconds: number | null | undefined,
): number {
  const observed = Number(observedAverageSeconds ?? 0);
  return observed > 0 ? Math.min(180, Math.max(15, observed)) : 45;
}

export function buildDailyPlan(input: BuildDailyPlanInput): DailyStudyPlan {
  const budgetMinutes = clamp(Math.round(input.dailyMinutes), 5, 240);
  const averageQuestionSeconds = clamp(input.averageQuestionSeconds, 10, 300);
  const rawCapacity = Math.max(
    1,
    Math.floor((budgetMinutes * 60) / averageQuestionSeconds),
  );
  const targetQuestions = Math.min(
    rawCapacity,
    Math.max(0, input.maxQuestions ?? rawCapacity),
  );
  const completedQuestions = Math.max(0, Math.floor(input.questionsToday));
  const remaining = Math.max(0, targetQuestions - completedQuestions);
  const questionCount = Math.min(100, remaining);
  const completedEstimatedMinutes = Math.min(
    budgetMinutes,
    Math.round((completedQuestions * averageQuestionSeconds) / 60),
  );

  const remediationTarget =
    input.remediationBacklog > 0 || input.savedConceptSignalCount > 0
      ? Math.max(1, Math.round(questionCount * 0.2))
      : 0;
  const remediationPool = Math.max(
    Math.max(0, input.remediationBacklog),
    Math.max(0, input.savedConceptSignalCount),
  );
  const remediationCount = Math.min(
    questionCount,
    remediationPool,
    remediationTarget,
  );
  const afterRemediation = questionCount - remediationCount;
  const dueCount = Math.min(
    afterRemediation,
    Math.max(0, Math.floor(input.dueBacklog)),
  );
  const newCount = Math.max(0, questionCount - remediationCount - dueCount);
  const rationale: DailyPlanRationale[] = [];

  if (questionCount === 0) {
    rationale.push("plan_complete");
  } else {
    if (input.dueBacklog > targetQuestions * 7) rationale.push("due_backlog");
    if (input.daysToExam != null && input.daysToExam <= 90) {
      rationale.push("exam_near");
    }
    if (input.savedConceptSignalCount > 0) rationale.push("saved_concepts");
    if (rationale.length === 0) rationale.push("balanced");
  }

  return {
    budgetMinutes,
    targetQuestions,
    completedQuestions,
    completedEstimatedMinutes,
    questionCount,
    estimatedMinutes: Math.ceil((questionCount * averageQuestionSeconds) / 60),
    dueCount,
    newCount,
    remediationCount,
    dueBacklog: Math.max(0, Math.floor(input.dueBacklog)),
    progress:
      targetQuestions > 0
        ? clamp(completedQuestions / targetQuestions, 0, 1)
        : 1,
    rationale,
    startHref:
      questionCount > 0
        ? buildSessionStartHref({
            subject: input.subjectId,
            mode: "inteligentna",
            count: questionCount,
            dailyPlan: true,
          })
        : null,
    experimentVariant: "control",
  };
}
