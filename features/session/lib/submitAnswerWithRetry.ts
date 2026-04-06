import { submitAnswer } from "@/features/session/api/submitAnswer";

export async function submitAnswerWithRetry(
  payload: Parameters<typeof submitAnswer>[0],
  retries = 3,
) {
  let last: Awaited<ReturnType<typeof submitAnswer>> | null = null;
  for (let i = 0; i < retries; i++) {
    last = await submitAnswer(payload);
    if (last.ok) return last;
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return last ?? { ok: false as const, message: "Nie udało się zapisać odpowiedzi." };
}
