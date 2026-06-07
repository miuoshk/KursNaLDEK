import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { STUDY_OPTIONS, isRegistrationClosedForSelection, normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";
import { listActiveEntitlementsByUserId } from "@/features/access/server/entitlements";
import {
  activateFreeTestYearAction,
  completeCheckoutActivationAction,
  createCheckoutSessionAction,
} from "@/features/access/actions";
import { YearSelectionGrid } from "@/features/access/components/YearSelectionGrid";

type SearchParams = Promise<{
  status?: string;
  reason?: string;
}>;

const ERROR_REASON_LABELS: Record<string, string> = {
  "invalid-selection": "Nieprawidłowy wybór kierunku/roku.",
  "free-only-stoma2": "Darmowy dostęp tylko dla Stomatologia rok 2.",
  "registration-closed": "Rejestracja zamknięta.",
  "no-session": "Sesja wygasła, zaloguj się ponownie.",
  "stripe-missing-secret":
    "Stripe nie jest skonfigurowany na serwerze (brak STRIPE_SECRET_KEY w env hostingu).",
  "stripe-missing-price":
    "Brak skonfigurowanej ceny Stripe dla wybranego roku (sprawdź STRIPE_PRICE_* w env hostingu).",
  "stripe-call-failed":
    "Stripe odrzucił zapytanie. Sprawdź czy klucz i price ID są z tego samego trybu (test/live) i czy price jest aktywny.",
  "stripe-no-url": "Stripe nie zwrócił adresu Checkout. Spróbuj ponownie.",
  "supabase-profile-read": "Nie udało się odczytać profilu z bazy.",
  "supabase-profile-update": "Nie udało się zapisać wyboru roku w profilu.",
  "entitlement-grant-failed": "Nie udało się zapisać dostępu w bazie.",
  unknown: "Nieznany błąd. Sprawdź logi serwera.",
};

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
      isRegistrationClosed: isRegistrationClosedForSelection(option.track, option.year),
    };
  });

  const hasAnyEntitlement = entitlements.length > 0;
  const status = params.status;
  const reasonLabel = params.reason ? ERROR_REASON_LABELS[params.reason] ?? null : null;

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
        {status === "error" ? (
          <div className="mt-3 space-y-1 rounded-btn border border-[#F87171]/30 bg-[#F87171]/10 px-4 py-2">
            <p className="font-body text-body-sm text-[#F87171]">
              Nie udało się rozpocząć procesu płatności lub aktywacji.
            </p>
            {reasonLabel ? (
              <p className="font-body text-body-xs text-[#F87171]/90">Powód: {reasonLabel}</p>
            ) : null}
            {params.reason ? (
              <p className="font-body text-body-xs text-[#F87171]/70">Kod: {params.reason}</p>
            ) : null}
          </div>
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
