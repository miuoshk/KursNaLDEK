export const NICK_MIN_LENGTH = 5;
export const NICK_MAX_LENGTH = 32;
export const NICK_PATTERN = /^[A-Za-z0-9._-]+$/;

/** New nick, or a change away from the current one. Existing shorter nicks may stay. */
export function isNickChangeAllowed(currentNick: string | null | undefined, nextNick: string): boolean {
  const current = currentNick?.trim() ?? "";
  const next = nextNick.trim();
  if (current.length > 0 && current.toLowerCase() === next.toLowerCase()) {
    return true;
  }
  return next.length >= NICK_MIN_LENGTH;
}
