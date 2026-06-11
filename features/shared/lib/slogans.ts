export const SIDEBAR_SLOGANS = [
  "Wiesz więcej niż godzinę temu.",
  "Właśnie budujesz kliniczne myślenie.",
  "Uczysz się skuteczniej, niż Ci się wydaje.",
  "Wiesz więcej niż godzinę temu. Jeszcze jedno pytanie?",
] as const;

export const AUTH_SLOGANS = [
  "Jeszcze jedno pytanie?",
  "Jedno pytanie więcej nie zaszkodzi.",
  "Wiesz więcej niż godzinę temu.",
  "Uczysz się skuteczniej, niż Ci się wydaje.",
] as const;

export const SESSION_LOADING_SLOGANS = [
  "Jeszcze jedno pytanie?",
  "Jeszcze jedno pytanie i kończysz? Nie tym razem.",
  "Jedno pytanie więcej nie zaszkodzi.",
  "Wiesz więcej niż przed chwilą.",
  "Każde pytanie to jeden krok bliżej.",
  "Twoja przyszła wersja Ci podziękuje.",
  "To, co dziś trudne, jutro będzie oczywiste.",
  "Diagnoza zaczyna się od dobrego pytania.",
  "Następne kilka minut tylko dla Ciebie i wiedzy.",
  "Konsekwencja robi tu całą robotę.",
  "Za każdym sukcesem w Twoim życiu stoi dyscyplina.",
  "Dziś trochę więcej niż wczoraj.",
  "Krótka sesja też się liczy.",
  "Pamięć działa, kiedy do niej wracasz.",
  "Robisz to dla siebie z przyszłości.",
  "Postęp nie musi być głośny.",
  "Spokojnie, ale konsekwentnie.",
  "Każde powtórzenie coś utrwala.",
] as const;

export const DEFAULT_SLOGAN =
  "Wiesz więcej niż godzinę temu. Jeszcze jedno pytanie?";

export function pickSlogan<T extends readonly string[]>(pool: T): T[number] {
  if (pool.length === 0) return DEFAULT_SLOGAN as T[number];
  const idx = Math.floor(Math.random() * pool.length);
  return (pool[idx] ?? pool[0]) as T[number];
}
