import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { STUDY_OPTIONS, normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";
import { listActiveEntitlementsByUserId } from "@/features/access/server/entitlements";
import {
  activateFreeTestYearAction,
  completeCheckoutActivationAction,
  createCheckoutSessionAction,
} from "@/features/access/actions";
import { YearSelectionGrid } from "@/features/access/components/YearSelectionGrid";

type SearchParams = Promise<{
  status?: string;
}>;

export default async function WyborRokuPage(props: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const [profile, entitlements, params] = await Promise.all([
    getProfileByUserId(user.id),
    listActiveEntitlementsByUserId(user.id),
    props.searchParams,
  ]);

  const selectedTrack = normalizeTrack(profile?.current_track);
  const selectedYear = normalizeYear(profile?.current_year);
  const unlockedKeys = new Set(entitlements.map((entry) => `${entry.track}:${entry.year}`));

  const optionsWithStatus = STUDY_OPTIONS.map((option) => {
    const key = `${option.track}:${option.year}`;
    return {
      ...option,
      isSelected: option.track === selectedTrack && option.year === selectedYear,
      isUnlocked: unlockedKeys.has(key),
    };
  });

  const hasAnyEntitlement = entitlements.length > 0;
  const status = params.status;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-primary">Wybierz kierunek i rok</h1>
        <p className="mt-2 max-w-2xl font-body text-body-md text-secondary">
          Stomatologia rok 2 działa jako darmowy rok testowy. Pozostałe opcje wymagają jednorazowej
          płatności.
        </p>
        {status === "success" ? (
          <p className="mt-3 rounded-btn border border-brand-sage/30 bg-brand-sage/10 px-4 py-2 font-body text-body-sm text-brand-sage">
            Płatność zakończona. Trwa aktywacja dostępu; jeśli status się nie odświeży, odśwież stronę.
          </p>
        ) : null}
        {status === "cancel" ? (
          <p className="mt-3 rounded-btn border border-white/20 bg-white/5 px-4 py-2 font-body text-body-sm text-secondary">
            Płatność została anulowana. Możesz wrócić do wyboru i spróbować ponownie.
          </p>
        ) : null}
        {status === "pending" ? (
          <p className="mt-3 rounded-btn border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 font-body text-body-sm text-brand-gold">
            Oczekujemy na webhook Stripe. Odśwież aktywację za kilka sekund.
          </p>
        ) : null}
      </div>

      <YearSelectionGrid
        options={optionsWithStatus}
        activateFreeAction={activateFreeTestYearAction}
        checkoutAction={createCheckoutSessionAction}
      />

      {hasAnyEntitlement ? (
        <div className="mt-8">
          <a
            href="/pulpit"
            className="inline-flex rounded-btn bg-brand-gold px-5 py-2.5 font-body font-semibold text-brand-bg transition hover:brightness-110"
          >
            Przejdź do pulpitu
          </a>
        </div>
      ) : null}

      {status === "success" || status === "pending" ? (
        <form action={completeCheckoutActivationAction} className="mt-4">
          <button
            type="submit"
            className="inline-flex rounded-btn border border-white/20 bg-white/5 px-5 py-2.5 font-body text-body-sm text-primary transition hover:bg-white/10"
          >
            Sprawdź aktywację dostępu
          </button>
        </form>
      ) : null}
    </div>
  );
}
