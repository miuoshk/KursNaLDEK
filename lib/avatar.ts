import { initialsFromName } from "@/lib/initialsFromName";

export type AvatarSource = {
  avatar_emoji?: string | null;
  avatar_initials?: string | null;
  full_name?: string | null;
  display_name?: string | null;
};

export type AvatarDisplay =
  | { kind: "emoji"; value: string }
  | { kind: "initials"; value: string };

export function avatarDisplay(source: AvatarSource): AvatarDisplay {
  const emoji = source.avatar_emoji?.trim();
  if (emoji) {
    return { kind: "emoji", value: emoji };
  }
  const initials = source.avatar_initials?.trim();
  if (initials) {
    return { kind: "initials", value: initials.toUpperCase() };
  }
  const nameSource = source.full_name ?? source.display_name ?? "";
  return { kind: "initials", value: initialsFromName(nameSource) };
}
