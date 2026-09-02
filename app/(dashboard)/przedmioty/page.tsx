import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Bookmark, ChevronRight } from "lucide-react";
import { OverallProgress } from "@/features/subjects/components/OverallProgress";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { SubjectGrid } from "@/features/subjects/components/SubjectGrid";
import { loadKnnpSubjectsData } from "@/features/subjects/server/loadKnnpSubjects";
import { requireCurrentSelectionAccessOrRedirect } from "@/features/access/server/guards";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getCurrentUser";
import {
  shouldShowSavedQuestions,
  subjectsSubtitleForProduct,
} from "@/lib/dashboard/productLabels";

async function getSavedQuestionsCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("saved_questions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  return count ?? 0;
}

export default async function PrzedmiotyPage() {
  await requireCurrentSelectionAccessOrRedirect();
  const t = await getTranslations("subjects");
  const tAccess = await getTranslations("access");
  const tCommon = await getTranslations("common");
  const [result, savedCount] = await Promise.all([
    loadKnnpSubjectsData(),
    getSavedQuestionsCount(),
  ]);

  if (!result.ok) {
    return (
      <div>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          {t("mySubjects")}
        </h1>
        <div className="mt-8">
          <PrzedmiotyError message={result.message} />
        </div>
      </div>
    );
  }

  const { subjects, profile, totalQuestionCount, overallProgress, isSubscribed } = result;
  const trackLabel =
    profile.track === "Lekarski"
      ? tAccess("trackLekarski")
      : tAccess("trackStomatologia");

  const showSavedQuestions = shouldShowSavedQuestions(profile.product);
  const subtitle = subjectsSubtitleForProduct(
    profile.product,
    profile.current_year,
    trackLabel,
    t,
  );

  return (
    <div>
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          {t("mySubjects")}
        </h1>
        <p className="mt-2 font-body text-sm text-secondary">{subtitle}</p>
      </header>

      <div className="mt-8 space-y-8">
        <OverallProgress
          year={profile.current_year}
          product={profile.product}
          totalQuestions={totalQuestionCount}
          answered={overallProgress.answered}
          mastered={overallProgress.mastered}
          reviewing={overallProgress.reviewing}
        />

        {showSavedQuestions ? (
        <Link
          href="/zapisane"
          className="group flex items-center gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:border-brand-gold/40"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-btn bg-brand-gold/10">
            <Bookmark className="size-5 text-brand-gold" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-body-md font-bold text-primary">
              {t("savedQuestions")}
            </p>
            <p className="mt-0.5 font-body text-body-xs text-muted">
              {savedCount === 0
                ? t("savedEmptyHint")
                : savedCount === 1
                  ? t("savedOneInCollection")
                  : t("savedManyInCollection", {
                      questionsLabel: tCommon("questionsCount", { count: savedCount }),
                    })}
            </p>
          </div>
          <ChevronRight
            className="size-4 shrink-0 text-muted transition-colors group-hover:text-brand-gold"
            aria-hidden
          />
        </Link>
        ) : null}

        {subjects.length === 0 ? (
          <p className="font-body text-body-md text-secondary">
            {t("noSubjects")}
          </p>
        ) : (
          <SubjectGrid subjects={subjects} isSubscribed={isSubscribed} />
        )}

        {!isSubscribed ? (
          <div className="rounded-card border border-brand-gold/30 bg-brand-gold/10 p-4">
            <p className="font-body text-body-sm text-brand-gold">
              {t("yearNotActive")}
            </p>
            <Link
              href="/wybor-roku"
              className="mt-3 inline-flex rounded-btn border border-brand-gold/40 px-4 py-2 font-body text-body-sm text-brand-gold transition hover:bg-brand-gold/10"
            >
              {t("goToYearSelection")}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
