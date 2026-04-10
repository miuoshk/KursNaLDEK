"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { updateProfile } from "@/features/settings/api/updateProfile";
import type { SettingsProfile } from "@/features/settings/types";
import { useToast } from "@/features/shared/components/ToastProvider";
import { initialsFromName } from "@/lib/initialsFromName";

const selectClass =
  "w-full appearance-none rounded-btn border border-border bg-background px-4 py-3 pr-10 font-body text-primary transition-colors focus:border-brand-gold focus:outline-none";

type Props = {
  profile: SettingsProfile;
  email: string | null;
};

export function ProfileSection({ profile, email }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(profile.display_name);
  const [track, setTrack] = useState(profile.current_track);
  const [year, setYear] = useState(String(profile.current_year));
  const [initials, setInitials] = useState(profile.avatar_initials ?? "");
  const [saving, setSaving] = useState(false);

  const dirty = useMemo(() => {
    return (
      name !== profile.display_name ||
      track !== profile.current_track ||
      year !== String(profile.current_year) ||
      initials !== (profile.avatar_initials ?? "")
    );
  }, [name, track, year, initials, profile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    const res = await updateProfile({
      display_name: name.trim(),
      current_track: track === "lekarski" ? "lekarski" : "stomatologia",
      current_year: Number(year),
      avatar_initials: initials.trim() || null,
    });
    setSaving(false);
    if (res.ok) {
      toast("Zmiany zapisane", "success");
      router.refresh();
    } else toast(res.message, "error");
  }

  const displayInitials = (
    initials.trim() || initialsFromName(name || profile.display_name)
  )
    .slice(0, 4)
    .toUpperCase();

  return (
    <section>
      <h2 className="text-body-xs font-medium uppercase tracking-widest text-muted">PROFIL</h2>
      <div className="mt-6 flex flex-wrap items-start gap-6">
        <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-brand-accent-2 font-mono text-2xl text-brand-gold">
          {displayInitials}
        </div>
        <button
          type="button"
          className="font-body text-body-sm text-brand-sage transition-colors hover:text-brand-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--brand-gold)]"
          onClick={() => {
            const n = window.prompt("Inicjały (max 4 znaki)", initials);
            if (n != null) setInitials(n.slice(0, 4));
          }}
        >
          Zmień inicjały
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="dn" className="font-body text-body-sm text-secondary">
            Imię i nazwisko
          </label>
          <input
            id="dn"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-btn border border-border bg-background px-4 py-3 font-body text-primary transition-colors focus:border-brand-gold focus:outline-none"
          />
        </div>
        <div>
          <span className="font-body text-body-sm text-secondary">Email</span>
          <input
            readOnly
            disabled
            value={email ?? ""}
            className="mt-1.5 w-full cursor-not-allowed rounded-btn border border-border bg-card-hover/50 px-4 py-3 font-body text-muted"
          />
        </div>
        <div>
          <label htmlFor="tr" className="font-body text-body-sm text-secondary">
            Ścieżka
          </label>
          <div className="relative mt-1.5">
            <select
              id="tr"
              value={track === "lekarski" ? "lekarski" : "stomatologia"}
              onChange={(e) => setTrack(e.target.value)}
              className={selectClass}
            >
              <option value="stomatologia">Stomatologia</option>
              <option value="lekarski">Lekarski</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
          </div>
        </div>
        <div>
          <label htmlFor="yr" className="font-body text-body-sm text-secondary">
            Rok studiów
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
          disabled={!dirty || saving}
          className="rounded-btn bg-brand-gold px-6 py-2.5 font-semibold text-brand-bg transition-colors hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Zapisz zmiany
        </button>
      </form>
    </section>
  );
}
