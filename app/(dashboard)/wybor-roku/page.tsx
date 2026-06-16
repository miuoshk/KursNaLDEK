import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { STUDY_OPTIONS, normalizeTrack, normalizeYear } from "@/features/access/lib/studyAccess";
import { listActiveEntitlementsByUserId } from "@/features/access/server/entitlements";
import {
  activateFreeTestYearAction,
  completeCheckoutActivationAction,
} from "@/features/access/actions";
import { createCheckoutSessionAction } from "@/features/checkout/actions";
import { YearSelectionGrid } from "@/features/access/components/YearSelectionGrid";
import { isUserAccessRevoked, ACCESS_REVOKED_MESSAGE } from "@/lib/auth/accessRevocation";

type SearchParams = Promise<{
  status?: string;
  reason?: string;
  revoked?: string;
}>;

const ERROR_REASON_KEYS: Record<string, string> = {
  "invalid-selection": "invalidSelection",
  "free-only-stoma2": "freeOnlyStoma2",
  "registration-closed": "registrationClosed",
  "no-session": "noSession",
  "stripe-missing-secret": "stripeMissingSecret",
  "stripe-missing-price": "stripeMissingPrice",
  "stripe-call-failed": "stripeCallFailed",
  "stripe-no-url": "stripeNoUrl",
  "supabase-profile-read": "supabaseProfileRead",
  "supabase-profile-update": "supabaseProfileUpdate",
  "entitlement-grant-failed": "entitlementGrantFailed",
  unknown: "unknown",
};

export default async function WyborRokuPage(props: { searchParams: SearchParams }) {
  const t = await getTranslations("access");
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const [profile, entitlements, params, accessRevoked] = await Promise.all([
    getProfileByUserId(user.id),
    listActiveEntitlementsByUserId(user.id),
    props.searchParams,
    isUserAccessRevoked(user.id),
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
      isRegistrationClosed: false,
    };
  });

  const hasAnyEntitlement = entitlements.length > 0;
  const status = params.status;
  const showAccessRevoked = accessRevoked || params.revoked === "1";
  const reasonKey = params.reason ? ERROR_REASON_KEYS[params.reason] : null;
  const reasonLabel =
    reasonKey != null
      ? t(`errors.${reasonKey}` as Parameters<typeof t>[0])
      : null;

  if (showAccessRevoked) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-primary">{t("noAccessTitle")}</h1>
        <p className="mt-4 rounded-btn border border-[#F87171]/30 bg-[#F87171]/10 px-4 py-3 font-body text-body-md text-[#F87171]">
          {ACCESS_REVOKED_MESSAGE}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-primary">{t("chooseTrackYear")}</h1>
        <p className="mt-2 max-w-2xl font-body text-body-md text-secondary">
          {t("chooseDescription")}
        </p>
        {status === "success" ? (
          <p className="mt-3 rounded-btn border border-brand-sage/30 bg-brand-sage/10 px-4 py-2 font-body text-body-sm text-brand-sage">
            {t("paymentSuccess")}
          </p>
        ) : null}
        {status === "cancel" ? (
          <p className="mt-3 rounded-btn border border-white/20 bg-white/5 px-4 py-2 font-body text-body-sm text-secondary">
            {t("paymentCancel")}
          </p>
        ) : null}
        {status === "error" ? (
          <div className="mt-3 space-y-1 rounded-btn border border-[#F87171]/30 bg-[#F87171]/10 px-4 py-2">
            <p className="font-body text-body-sm text-[#F87171]">
              {t("paymentError")}
            </p>
            {reasonLabel ? (
              <p className="font-body text-body-xs text-[#F87171]/90">
                {t("reasonPrefix", { reason: reasonLabel })}
              </p>
            ) : null}
            {params.reason ? (
              <p className="font-body text-body-xs text-[#F87171]/70">
                {t("codePrefix", { code: params.reason })}
              </p>
            ) : null}
          </div>
        ) : null}
        {status === "pending" ? (
          <p className="mt-3 rounded-btn border border-brand-gold/30 bg-brand-gold/10 px-4 py-2 font-body text-body-sm text-brand-gold">
            {t("paymentPending")}
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
            {t("goToDashboard")}
          </a>
        </div>
      ) : null}

      {status === "success" || status === "pending" ? (
        <form action={completeCheckoutActivationAction} className="mt-4">
          <button
            type="submit"
            className="inline-flex rounded-btn border border-white/20 bg-white/5 px-5 py-2.5 font-body text-body-sm text-primary transition hover:bg-white/10"
          >
            {t("checkActivation")}
          </button>
        </form>
      ) : null}
    </div>
  );
}
