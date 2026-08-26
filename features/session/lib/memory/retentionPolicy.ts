export type RetentionPolicyInput = {
  baseRetention?: number;
  dailyMinutes: number;
  dueCount: number;
  averageQuestionSeconds: number;
  examDate: string | null;
  now?: Date;
};

export type RetentionPolicy = {
  requestRetention: number;
  maximumInterval: number;
  dailyCapacity: number;
  backlogPressure: number;
  daysToExam: number | null;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Dobiera wykonalną retencję do budżetu czasu. Nie próbuje „wyczyścić” całego
 * backlogu jednego dnia: presja zaległości obniża koszt powtórek, a bliski
 * egzamin podnosi retencję tylko wtedy, gdy plan nadal mieści się w czasie.
 */
export function deriveRetentionPolicy(
  input: RetentionPolicyInput,
): RetentionPolicy {
  const now = input.now ?? new Date();
  const dailyMinutes = clamp(Math.round(input.dailyMinutes), 5, 240);
  const averageQuestionSeconds = clamp(input.averageQuestionSeconds, 10, 300);
  const dailyCapacity = Math.max(
    1,
    Math.floor((dailyMinutes * 60) / averageQuestionSeconds),
  );
  const backlogPressure = Math.max(0, input.dueCount) / (dailyCapacity * 7);

  let requestRetention = clamp(input.baseRetention ?? 0.9, 0.82, 0.95);
  if (backlogPressure > 4) requestRetention = Math.min(requestRetention, 0.82);
  else if (backlogPressure > 2) {
    requestRetention = Math.min(requestRetention, 0.85);
  } else if (backlogPressure > 1) {
    requestRetention = Math.min(requestRetention, 0.88);
  }

  let daysToExam: number | null = null;
  if (input.examDate) {
    const parsed = new Date(input.examDate);
    if (!Number.isNaN(parsed.getTime())) {
      daysToExam = Math.max(
        0,
        Math.ceil((parsed.getTime() - now.getTime()) / 86_400_000),
      );
      if (backlogPressure <= 1) {
        if (daysToExam <= 30)
          requestRetention = Math.max(requestRetention, 0.93);
        else if (daysToExam <= 90) {
          requestRetention = Math.max(requestRetention, 0.91);
        }
      }
    }
  }

  return {
    requestRetention: Number(requestRetention.toFixed(3)),
    maximumInterval:
      daysToExam == null ? 3650 : Math.round(clamp(daysToExam, 1, 3650)),
    dailyCapacity,
    backlogPressure,
    daysToExam,
  };
}
