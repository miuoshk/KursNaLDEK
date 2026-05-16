const REGISTRATION_REOPEN_AT_ISO = "2026-05-17T19:00:00.000Z";

export const REGISTRATION_REOPEN_AT = new Date(REGISTRATION_REOPEN_AT_ISO);

export function isRegistrationOpen(now: Date = new Date()): boolean {
  return now.getTime() >= REGISTRATION_REOPEN_AT.getTime();
}

export function getRegistrationRemainingMs(now: Date = new Date()): number {
  return Math.max(0, REGISTRATION_REOPEN_AT.getTime() - now.getTime());
}
