"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { SettingsCard } from "@/features/settings/components/SettingsCard";
import { updateProfile } from "@/features/settings/api/updateProfile";
import type { SettingsProfile } from "@/features/settings/types";
import { EmojiInput } from "@/features/shared/components/EmojiInput";
import { useToast } from "@/features/shared/components/ToastProvider";
import { isValidEmoji } from "@/lib/emoji";

const selectClass =
  "w-full appearance-none rounded-btn border border-border bg-background px-4 py-3 pr-10 font-body text-primary transition-colors focus:border-brand-gold focus:outline-none";

type Props = {
  profile: SettingsProfile;
  email: string | null;
};

export function ProfileSection({ profile, email }: Props) {
  const t = useTranslations("settings");
  const router = useRouter();
  const { toast } = useToast();
  const [nick, setNick] = useState(profile.nick);
  const [track, setTrack] = useState(profile.current_track);
  const [year, setYear] = useState(String(profile.current_year));
  const [avatarEmoji, setAvatarEmoji] = useState(profile.avatar_emoji ?? "");
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => {
    return (
      nick !== profile.nick ||
      track !== profile.current_track ||
      year !== String(profile.current_year) ||
      avatarEmoji !== (profile.avatar_emoji ?? "")
    );
  }, [nick, track, year, avatarEmoji, profile]);

  const trimmedEmoji = avatarEmoji.trim();
  const emojiValid = trimmedEmoji.length === 0 || isValidEmoji(trimmedEmoji);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    if (!emojiValid) {
      toast(t("profile.emojiInvalid"), "error");
      return;
    }
    setSaving(true);
    const res = await updateProfile({
      nick: nick.trim(),
      current_track: track === "lekarski" ? "lekarski" : "stomatologia",
      current_year: Number(year),
      avatar_initials: profile.avatar_initials ?? null,
      avatar_emoji: trimmedEmoji ? trimmedEmoji : null,
    });
    setSaving(false);
    if (res.ok) {
      toast(t("profile.saved"), "success");
      router.refresh();
    } else toast(res.message, "error");
  }

  return (
    <SettingsCard title={t("profile.title")}>
      <EmojiInput
        name="avatar_emoji_settings"
        label={t("profile.avatarLabel")}
        value={avatarEmoji}
        onChange={setAvatarEmoji}
        helper={t("profile.avatarHelper")}
      />

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="dn" className="font-body text-body-sm text-secondary">
            {t("profile.fullName")}
          </label>
          <input
            id="dn"
            value={profile.full_name}
            readOnly
            disabled
            className="mt-1.5 w-full cursor-not-allowed rounded-btn border border-border bg-card-hover/50 px-4 py-3 font-body text-muted"
          />
          <p className="mt-1 font-body text-body-xs text-muted">
            {t("profile.fullNameReadonly")}
          </p>
        </div>
        <div>
          <label htmlFor="nick" className="font-body text-body-sm text-secondary">
            {t("profile.nick")}
          </label>
          <input
            id="nick"
            value={nick}
            onChange={(e) => setNick(e.target.value)}
            className="mt-1.5 w-full rounded-btn border border-border bg-background px-4 py-3 font-body text-primary transition-colors focus:border-brand-gold focus:outline-none"
          />
        </div>
        <div>
          <span className="font-body text-body-sm text-secondary">{t("profile.email")}</span>
          <input
            readOnly
            disabled
            value={email ?? ""}
            className="mt-1.5 w-full cursor-not-allowed rounded-btn border border-border bg-card-hover/50 px-4 py-3 font-body text-muted"
          />
        </div>
        <div>
          <label htmlFor="tr" className="font-body text-body-sm text-secondary">
            {t("profile.track")}
          </label>
          <div className="relative mt-1.5">
            <select
              id="tr"
              value={track === "lekarski" ? "lekarski" : "stomatologia"}
              onChange={(e) => setTrack(e.target.value)}
              className={selectClass}
            >
              <option value="stomatologia">{t("profile.trackStomatologia")}</option>
              <option value="lekarski">{t("profile.trackLekarski")}</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
          </div>
        </div>
        <div>
          <label htmlFor="yr" className="font-body text-body-sm text-secondary">
            {t("profile.studyYear")}
          </label>
          <div className="relative mt-1.5">
            <select id="yr" value={year} onChange={(e) => setYear(e.target.value)} className={selectClass}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!dirty || saving || !emojiValid}
          className="rounded-btn bg-brand-gold px-6 py-2.5 font-semibold text-brand-bg transition-colors hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("profile.saveChanges")}
        </button>
      </form>
    </SettingsCard>
  );
}
