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
] as const;

export const DEFAULT_SLOGAN =
  "Wiesz więcej niż godzinę temu. Jeszcze jedno pytanie?";

export function pickSlogan<T extends readonly string[]>(pool: T): T[number] {
  if (pool.length === 0) return DEFAULT_SLOGAN as T[number];
  const idx = Math.floor(Math.random() * pool.length);
  return (pool[idx] ?? pool[0]) as T[number];
}
