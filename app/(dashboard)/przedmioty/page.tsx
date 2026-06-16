import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Bookmark, ChevronRight, SmilePlus } from "lucide-react";
import { OverallProgress } from "@/features/subjects/components/OverallProgress";
import { PrzedmiotyError } from "@/features/subjects/components/PrzedmiotyError";
import { SubjectGrid } from "@/features/subjects/components/SubjectGrid";
import { loadKnnpSubjectsData } from "@/features/subjects/server/loadKnnpSubjects";
import { requireCurrentSelectionAccessOrRedirect } from "@/features/access/server/guards";
import { createClient } from "@/lib/supabase/server";

async function getSavedQuestionsCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;
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
  const showOsceSection = false;
  const trackLabel =
    profile.track === "Lekarski"
      ? tAccess("trackLekarski")
      : tAccess("trackStomatologia");

  return (
    <div>
      <header>
        <h1 className="font-heading text-2xl font-bold text-primary md:text-3xl">
          {t("mySubjects")}
        </h1>
        <p className="mt-1 font-body text-sm text-secondary">
          {t("yearTrackLine", { year: profile.current_year, track: trackLabel })}
        </p>
      </header>

      <div className="mt-8 space-y-8">
        <OverallProgress
          year={profile.current_year}
          totalQuestions={totalQuestionCount}
          answered={overallProgress.answered}
          mastered={overallProgress.mastered}
          reviewing={overallProgress.reviewing}
        />

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
                      count: savedCount,
                      questionsLabel: tCommon("questionsCount", { count: savedCount }),
                    })}
            </p>
          </div>
          <ChevronRight
            className="size-4 shrink-0 text-muted transition-colors group-hover:text-brand-gold"
            aria-hidden
          />
        </Link>

        {showOsceSection ? (
          <section>
            <h2 className="font-heading text-xl font-bold text-brand-gold">
              {t("osceSectionTitle")}
            </h2>
            <p className="mt-1 font-body text-sm text-secondary">
              {t("osceSectionSubtitle")}
            </p>
            <div className="mt-4">
              <Link
                href="/osce"
                className="group flex w-full items-start gap-4 rounded-2xl border border-[#C9A84C]/30 bg-[#002A27] p-6 transition-all duration-200 ease-out hover:border-[#C9A84C]/50"
              >
                <SmilePlus
                  className="h-8 w-8 shrink-0 text-[#C9A84C]"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-base text-primary">
                    {t("osceCourseTitle")}
                  </p>
                  <p className="mt-3 inline-flex rounded-full bg-[#367368]/20 px-3 py-1 font-body text-xs text-[#367368]">
                    {t("osceDaysBadge")}
                  </p>
                </div>
              </Link>
            </div>
          </section>
        ) : null}

        {showOsceSection ? (
          <h2 className="font-heading text-xl font-bold text-primary">
            {t("basicSciences")}
          </h2>
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
