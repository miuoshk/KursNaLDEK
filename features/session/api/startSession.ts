"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  SessionQuestion,
  SessionQuestionMeta,
} from "@/features/session/types";
import { isTopicVisibleForTrack } from "@/lib/content/topicTrackVisibility";
import {
  fetchKnnpAllQuestionIds,
  fetchKnnpTopicIdSet,
  fetchSubjectQuestionIds,
  fetchTopicQuestionIds,
  fetchVisibleTopicIds,
  shuffle,
} from "@/features/session/server/questionSelection";
import { fetchThemeLabelQuestionIds } from "@/lib/content/fetchThemeLabelQuestions";
import { parseVirtualThemeTopicId } from "@/lib/content/virtualThemeTopics";
import {
  normalizeTrack,
  normalizeYear,
  type StudyTrack,
} from "@/features/access/lib/studyAccess";
import { requireLearningAccessForSelection } from "@/features/access/server/requireLearningAccess";
import {
  getSubjectScopeIds,
  isSubjectInScope,
} from "@/features/session/server/sharedSubjects";
import { buildAntaresInteligentnaSession } from "@/features/session/server/buildAntaresInteligentnaSession";
import { fetchSessionQuestionMeta } from "@/features/session/server/fetchSessionQuestionMeta";
import { attachAntaresMetaToQuestions } from "@/features/session/lib/antares/questionMeta";
import {
  fetchDueReviewQuestionIdsForTopics,
  fetchMemoryV2DueFromQuestionPool,
  fetchUnseenQuestionIds,
  isPoolFullySeen,
  mixTopicCompletionQuestionIds,
} from "@/features/session/server/sessionQuestionMix";
import { placeFocusQuestionFirst } from "@/features/session/lib/placeFocusQuestionFirst";
import {
  loadQuestionsByIdsOrdered,
  mapRowsToSessionQuestions,
} from "@/features/session/server/loadQuestionsByIdsOrdered";
import { persistLastSessionQuestionCount } from "@/features/session/server/persistLastSessionQuestionCount";
import { resolveStudySessionTopicId } from "@/features/session/server/resolveStudySessionTopicId";
import { getProfileByUserId } from "@/lib/dashboard/cachedProfile";
import { isCatalogSubjectHidden } from "@/lib/content/catalogSubjectVisibility";
import {
  isSourceFilterUiEnabled,
  resolveEngineSourceFilter,
} from "@/features/session/lib/sourceFilter";
import { restrictQuestionIdsBySource } from "@/features/session/server/restrictQuestionIdsBySource";
import { isThinCemPool } from "@/features/session/lib/questionSourceBadge";
import {
  LEGACY_SCHEDULER_VERSION,
  MEMORY_SCHEDULER_VERSION,
} from "@/features/session/lib/memory/scheduler";
import { loadSessionMemoryPlan } from "@/features/session/server/loadSessionMemoryPlan";
import { loadDailyPlan } from "@/features/session/server/loadDailyPlan";
import { countSessionAnswersTodayWarsaw } from "@/features/pulpit/server/countQuestionsToday";
import { resolveMemoryEngineVariant } from "@/features/session/server/resolveMemoryEngineVariant";
import {
  ADAPTIVE_FEEDBACK_EXPERIMENT_KEY,
  DAILY_PLAN_EXPERIMENT_KEY,
} from "@/features/session/lib/experiments/memoryV2Experiment";
import { resolveLearningExperiment } from "@/features/session/server/resolveLearningExperiment";
import { getDueReviewCount } from "@/lib/dashboard/getDueReviewCount";

const schema = z.object({
  subjectId: z.string().optional(),
  mode: z.enum(["inteligentna", "przeglad", "katalog"]),
  count: z.coerce.number().min(1).max(5000),
  topicId: z.string().min(1).optional(),
  questionIds: z.array(z.string().min(1)).min(1).max(5000).optional(),
  /** Deep-link z zakładek / zapisanych — pytanie musi trafić do katalogu nawet poza pulą track. */
  focusQuestionId: z.string().min(1).optional(),
  /** Sesja powtórkowa — wyłącznie pytania z terminem <= teraz. */
  focus: z.enum(["due"]).optional(),
  /** Filtr źródła: all | reference | own — nie tryb nauki. */
  source: z.enum(["all", "reference", "own"]).optional(),
  /** Chuda pula CEM: dociągnij autorskie do wybranej liczby. */
  fillOwn: z.boolean().optional(),
  /** Start z osobistego planu dnia; zapisuje bazę do podsumowania. */
  dailyPlan: z.boolean().optional(),
});

export type StartSessionResult =
  | {
      ok: true;
      sessionId: string;
      subject: { id: string; name: string; short_name: string };
      questions: SessionQuestion[];
      /** Pula zapasowa (tylko inteligentna) — podmiany w trakcie sesji. */
      reserveQuestions?: SessionQuestion[];
      product?: string | null;
      adaptiveFeedbackEnabled: boolean;
      planSnapshot?: unknown;
    }
  | { ok: false; message: string };

export async function startSession(
  input: z.infer<typeof schema>,
): Promise<StartSessionResult> {
  const t = await getTranslations("session");
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: t("errors.invalidParams") };
  }

  const rawSubject = parsed.data.subjectId?.trim() ?? "";
  const isMix = rawSubject.length === 0;
  const {
    mode,
    count,
    topicId,
    questionIds: explicitIds,
    focusQuestionId,
    focus,
    source: sourceRaw,
    fillOwn: fillOwnRaw,
    dailyPlan: requestedDailyPlan,
  } = parsed.data;
  const subjectId = isMix ? "" : rawSubject;

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { ok: false, message: t("errors.mustLoginToStart") };
    }
    const admin = createAdminClient();

    const profile = await getProfileByUserId(user.id);
    const [memoryExperiment, feedbackExperiment, dailyPlanExperiment] =
      await Promise.all([
        mode === "inteligentna"
          ? resolveMemoryEngineVariant(supabase, user.id)
          : Promise.resolve(null),
        mode !== "katalog"
          ? resolveLearningExperiment(
              supabase,
              user.id,
              ADAPTIVE_FEEDBACK_EXPERIMENT_KEY,
            )
          : Promise.resolve(null),
        mode !== "katalog"
          ? resolveLearningExperiment(
              supabase,
              user.id,
              DAILY_PLAN_EXPERIMENT_KEY,
            )
          : Promise.resolve(null),
      ]);
    const isDailyPlan =
      requestedDailyPlan === true &&
      mode === "inteligentna" &&
      dailyPlanExperiment?.variant === "treatment" &&
      !explicitIds?.length &&
      focus == null &&
      focusQuestionId == null;
    const engineVariant =
      memoryExperiment?.engineVariant === "treatment" ? "treatment" : "shadow";
    const schedulerVersion =
      engineVariant === "treatment"
        ? MEMORY_SCHEDULER_VERSION
        : LEGACY_SCHEDULER_VERSION;
    let viewerTrack: StudyTrack = normalizeTrack(profile?.current_track);
    const profileYear = normalizeYear(profile?.current_year);

    // ── Explicit question IDs (e.g. retry wrong questions) ──
    if (explicitIds && explicitIds.length > 0) {
      const access = await requireLearningAccessForSelection(
        user.id,
        viewerTrack,
        profileYear,
      );
      if (!access.ok) {
        return { ok: false, message: access.message };
      }

      if (subjectId) {
        const { data: subTrack } = await supabase
          .from("subjects")
          .select("track")
          .eq("id", subjectId)
          .maybeSingle();
        if (subTrack?.track) {
          viewerTrack = normalizeTrack(subTrack.track as string);
        }
      }
      const rows = await loadQuestionsByIdsOrdered(
        supabase,
        explicitIds,
        viewerTrack,
      );
      if (rows.length === 0) {
        return { ok: false, message: t("errors.loadQuestionsFailed") };
      }
      const questions =
        mode === "inteligentna"
          ? attachAntaresMetaToQuestions(
              mapRowsToSessionQuestions(rows),
              await fetchSessionQuestionMeta(
                supabase,
                user.id,
                explicitIds,
                engineVariant,
              ),
            )
          : mapRowsToSessionQuestions(rows);

      // Resolve subject from first question
      let resolvedSubjectId = subjectId;
      if (!resolvedSubjectId && rows[0]) {
        const { data: q1 } = await supabase
          .from("questions")
          .select("topic_id")
          .eq("id", rows[0].id)
          .maybeSingle();
        if (q1?.topic_id) {
          const { data: t1 } = await supabase
            .from("topics")
            .select("subject_id")
            .eq("id", q1.topic_id as string)
            .eq("is_inbox", false)
            .maybeSingle();
          if (t1?.subject_id) resolvedSubjectId = t1.subject_id as string;
        }
      }

      const { data: subjMeta } = await supabase
        .from("subjects")
        .select("id, name, short_name, product")
        .eq("id", resolvedSubjectId)
        .maybeSingle();

      const dbMode = mode === "inteligentna" ? "nauka" : "egzamin";
      const insertTopicId = await resolveStudySessionTopicId(supabase, topicId);
      const retrySource = resolveEngineSourceFilter(
        sourceRaw,
        subjMeta?.product as string | undefined,
      );
      const memoryPlan = await loadSessionMemoryPlan(
        supabase,
        user.id,
        profile,
        {
          product: (subjMeta?.product as string | null) ?? null,
          track: viewerTrack,
          engineVariant,
        },
      );

      const { data: inserted, error: insErr } = await admin
        .from("study_sessions")
        .insert({
          user_id: user.id,
          subject_id: resolvedSubjectId,
          topic_id: insertTopicId,
          mode: dbMode,
          total_questions: questions.length,
          question_ids: explicitIds,
          source_filter: retrySource,
          session_kind: mode === "inteligentna" ? "intelligent" : "classic",
          scheduler_version: schedulerVersion,
          engine_variant: engineVariant,
          experiment_key: memoryExperiment?.experimentKey ?? null,
          experiment_bucket: memoryExperiment?.bucket ?? null,
          experiment_rollout_percent: memoryExperiment?.rolloutPercent ?? null,
          feedback_experiment_variant: feedbackExperiment?.variant ?? "control",
          daily_plan_experiment_variant:
            dailyPlanExperiment?.variant ?? "control",
          memory_parameter_set_id: memoryPlan.parameters.parameterSetId,
          target_retention: memoryPlan.retention.requestRetention,
          maximum_interval: memoryPlan.retention.maximumInterval,
          plan_snapshot: {
            memory: {
              parameterScope: memoryPlan.parameters.parameterScope,
              requestRetention: memoryPlan.retention.requestRetention,
              maximumInterval: memoryPlan.retention.maximumInterval,
              backlogPressure: memoryPlan.retention.backlogPressure,
            },
          },
        })
        .select("id")
        .single();

      if (insErr) {
        console.error("[startSession] insert retry session", insErr.message);
        return { ok: false, message: t("errors.createSessionFailed") };
      }

      return {
        ok: true,
        sessionId: inserted.id,
        subject: {
          id: resolvedSubjectId,
          name: subjMeta?.name ?? t("subjectRetry"),
          short_name: subjMeta?.short_name ?? "",
        },
        questions,
        product: (subjMeta?.product as string | null) ?? null,
        adaptiveFeedbackEnabled: feedbackExperiment?.variant === "treatment",
        planSnapshot: null,
      };
    }

    if (isMix && topicId) {
      return {
        ok: false,
        message: t("errors.mixedNoTopicFilter"),
      };
    }

    if (isMix) {
      const access = await requireLearningAccessForSelection(
        user.id,
        viewerTrack,
        profileYear,
      );
      if (!access.ok) {
        return { ok: false, message: access.message };
      }
    }

    let subjectRow: {
      id: string;
      name: string;
      short_name: string;
      year?: number;
      product?: string;
    } | null = null;
    let subjectTrack: StudyTrack = "stomatologia";
    if (!isMix) {
      const { data: subject, error: subErr } = await supabase
        .from("subjects")
        .select("id, name, short_name, track, year, product")
        .eq("id", subjectId)
        .maybeSingle();

      if (subErr || !subject) {
        return { ok: false, message: t("errors.subjectNotFound") };
      }
      subjectRow = subject;
      subjectTrack = normalizeTrack(subject.track as string);
      viewerTrack = subjectTrack;
      const subjectYear = normalizeYear(
        subject.year as number | null | undefined,
      );
      const access = await requireLearningAccessForSelection(
        user.id,
        subjectTrack,
        subjectYear,
      );
      if (!access.ok) {
        return { ok: false, message: access.message };
      }
      if (isCatalogSubjectHidden(subjectId, subjectTrack)) {
        return { ok: false, message: t("errors.subjectNotFound") };
      }
    }

    let chosenIds: string[] = [];
    let reserveIds: string[] = [];
    let antaresMeta = new Map<string, SessionQuestionMeta>();
    let topicFullRerun = false;

    let pool: string[];
    let topicFilter: Set<string> | undefined;
    let topicOkForDue: Set<string>;
    if (topicId) {
      const virtualTopic = parseVirtualThemeTopicId(topicId);
      if (virtualTopic) {
        if (!isSubjectInScope(subjectId, virtualTopic.contentSubjectId)) {
          return { ok: false, message: t("errors.invalidTopic") };
        }
        pool = await fetchThemeLabelQuestionIds(
          supabase,
          virtualTopic.contentSubjectId,
          virtualTopic.themeLabel,
          viewerTrack,
        );
        topicFilter = new Set(pool);
        topicOkForDue = new Set(
          await fetchVisibleTopicIds(
            supabase,
            getSubjectScopeIds(subjectId),
            subjectTrack,
          ),
        );
        if (pool.length === 0) {
          return { ok: false, message: t("errors.noQuestionsInTopic") };
        }
      } else {
        const { data: top, error: te } = await supabase
          .from("topics")
          .select("subject_id, tracks")
          .eq("id", topicId)
          .eq("is_inbox", false)
          .maybeSingle();
        if (
          te ||
          !top ||
          !isSubjectInScope(subjectId, top.subject_id as string)
        ) {
          return { ok: false, message: t("errors.invalidTopic") };
        }
        if (
          !isTopicVisibleForTrack(top.tracks as string[] | null, subjectTrack)
        ) {
          return { ok: false, message: t("errors.topicNotOnTrack") };
        }
        pool = await fetchTopicQuestionIds(supabase, topicId, viewerTrack);
        topicFilter = new Set(pool);
        topicOkForDue = new Set(
          await fetchVisibleTopicIds(
            supabase,
            getSubjectScopeIds(subjectId),
            subjectTrack,
          ),
        );
        if (pool.length === 0) {
          return { ok: false, message: t("errors.noQuestionsInTopic") };
        }
      }
    } else if (isMix) {
      // Sesja mieszana / domyślna powtórka: zawężamy pulę do bieżącego
      // (track, year) usera, żeby studentka rok 3 farmy nie dostała pytań
      // z anatomii z poprzednich lat.
      const track = normalizeTrack(profile?.current_track);
      const year = normalizeYear(profile?.current_year);
      viewerTrack = track;
      pool = await fetchKnnpAllQuestionIds(supabase, track, year);
      topicOkForDue = await fetchKnnpTopicIdSet(supabase, track, year);
    } else {
      pool = await fetchSubjectQuestionIds(supabase, subjectId, subjectTrack);
      topicOkForDue = new Set(
        await fetchVisibleTopicIds(
          supabase,
          getSubjectScopeIds(subjectId),
          subjectTrack,
        ),
      );
    }

    const subjectProduct =
      (subjectRow?.product as string | undefined) ??
      (isMix ? ((profile?.current_product as string | null) ?? null) : null);
    const sourceEnabled = isSourceFilterUiEnabled(subjectProduct);
    const source = resolveEngineSourceFilter(sourceRaw, subjectProduct);
    let pinnedCemIds: string[] = [];

    if (source !== "all" && mode !== "katalog") {
      const originalPool = pool;
      pool = await restrictQuestionIdsBySource(
        supabase,
        pool,
        source,
        subjectProduct,
      );
      const thinCem = source === "reference" && isThinCemPool(pool.length);
      if (thinCem && fillOwnRaw === true && subjectProduct) {
        pinnedCemIds = [...pool];
        const ownIds = await restrictQuestionIdsBySource(
          supabase,
          originalPool,
          "own",
          subjectProduct,
        );
        pool = [...new Set([...pool, ...ownIds])];
      }
      topicFilter = new Set(pool);
      if (pool.length === 0) {
        return { ok: false, message: t("errors.noQuestionsInTopic") };
      }
    }

    const memoryPlan = await loadSessionMemoryPlan(supabase, user.id, profile, {
      product: subjectProduct,
      track: viewerTrack,
      engineVariant,
    });
    const questionsTodayAtStart = isDailyPlan
      ? await countSessionAnswersTodayWarsaw(supabase, user.id)
      : null;
    let scopedPlanDueCount = memoryPlan.daily.dueCount;
    if (isDailyPlan) {
      if (isMix) {
        scopedPlanDueCount = await getDueReviewCount(
          supabase,
          user.id,
          viewerTrack,
          normalizeYear(subjectRow?.year ?? profileYear),
          subjectProduct,
          engineVariant,
        );
      } else if (engineVariant === "treatment") {
        scopedPlanDueCount = (
          await fetchMemoryV2DueFromQuestionPool(
            supabase,
            user.id,
            pool,
            pool.length,
          )
        ).length;
      } else {
        scopedPlanDueCount = (
          await fetchDueReviewQuestionIdsForTopics(
            supabase,
            user.id,
            topicOkForDue,
            viewerTrack,
            pool.length,
            new Set(pool),
          )
        ).length;
      }
    }
    const dailyStudyPlan = isDailyPlan
      ? await loadDailyPlan(supabase, user.id, profile, {
          dueCount: scopedPlanDueCount,
          questionsToday: questionsTodayAtStart ?? 0,
          subjectId: isMix ? undefined : subjectId,
          maxQuestions: pool.length,
        })
      : null;
    const effectiveCount = dailyStudyPlan?.questionCount ?? count;
    if (isDailyPlan && effectiveCount === 0) {
      return {
        ok: false,
        message: t("errors.planAlreadyComplete"),
      };
    }

    if (mode === "katalog") {
      chosenIds = pool;
      if (focusQuestionId) {
        chosenIds = [
          focusQuestionId,
          ...chosenIds.filter((id) => id !== focusQuestionId),
        ];
      }
    } else if (mode === "inteligentna" && focus === "due") {
      let dueIds =
        engineVariant === "treatment"
          ? await fetchMemoryV2DueFromQuestionPool(
              supabase,
              user.id,
              pool,
              effectiveCount,
            )
          : [];
      if (engineVariant !== "treatment" && dueIds.length === 0) {
        dueIds = await fetchDueReviewQuestionIdsForTopics(
          supabase,
          user.id,
          topicOkForDue,
          viewerTrack,
          effectiveCount,
          topicFilter,
        );
      }
      if (dueIds.length === 0) {
        return {
          ok: false,
          message: isMix
            ? t("errors.noDueQuestionsMix")
            : t("errors.noDueQuestionsSubject"),
        };
      }
      chosenIds = dueIds.slice(0, effectiveCount);
      antaresMeta = await fetchSessionQuestionMeta(
        supabase,
        user.id,
        chosenIds,
        engineVariant,
      );
    } else if (mode === "inteligentna") {
      const wantsFullTopicSet =
        topicId != null && effectiveCount >= pool.length;
      if (wantsFullTopicSet && pool.length > 0) {
        topicFullRerun = await isPoolFullySeen(supabase, user.id, pool);
      }

      if (topicFullRerun) {
        chosenIds = shuffle([...pool]);
        antaresMeta = await fetchSessionQuestionMeta(
          supabase,
          user.id,
          chosenIds,
          engineVariant,
        );
      } else {
        const antares = await buildAntaresInteligentnaSession(
          supabase,
          user.id,
          effectiveCount,
          pool,
          topicOkForDue,
          topicFilter,
          viewerTrack,
          {
            source,
            product: subjectProduct,
            engineVariant,
            dailyPlanMix: dailyStudyPlan
              ? {
                  due: dailyStudyPlan.dueCount,
                  new: dailyStudyPlan.newCount,
                  remediation: dailyStudyPlan.remediationCount,
                }
              : undefined,
          },
        );
        if (antares.questionIds.length > 0) {
          chosenIds = antares.questionIds;
          reserveIds = antares.reserveIds;
          antaresMeta = antares.metaByQuestionId;
        } else {
          chosenIds = antares.fallbackIds.slice(0, effectiveCount);
          reserveIds = antares.fallbackIds.slice(
            effectiveCount,
            effectiveCount + Math.min(30, effectiveCount),
          );
          antaresMeta = await fetchSessionQuestionMeta(
            supabase,
            user.id,
            [...chosenIds, ...reserveIds],
            engineVariant,
          );
        }
      }
    } else if (mode === "przeglad" && topicId) {
      const unseenIds = await fetchUnseenQuestionIds(
        supabase,
        user.id,
        pool,
        pool.length,
      );
      if (unseenIds.length > 0) {
        chosenIds = mixTopicCompletionQuestionIds(
          unseenIds,
          [],
          pool,
          effectiveCount,
          "przeglad",
        );
      } else {
        chosenIds = shuffle(pool).slice(0, effectiveCount);
      }
    } else {
      chosenIds = shuffle(pool).slice(0, effectiveCount);
    }

    if (chosenIds.length === 0) {
      return {
        ok: false,
        message: t("errors.noQuestionsSeed"),
      };
    }

    if (mode !== "katalog" && !topicFullRerun) {
      chosenIds = chosenIds.slice(0, effectiveCount);
    }

    if (pinnedCemIds.length > 0 && mode !== "katalog") {
      const pinned = new Set(pinnedCemIds);
      const rest = chosenIds.filter((id) => !pinned.has(id));
      chosenIds = [...pinnedCemIds, ...rest];
      if (!topicFullRerun) {
        chosenIds = chosenIds.slice(
          0,
          Math.max(effectiveCount, pinnedCemIds.length),
        );
      }
    }

    const rows = await loadQuestionsByIdsOrdered(
      supabase,
      chosenIds,
      viewerTrack,
      { includeSourceMeta: sourceEnabled },
    );
    if (rows.length === 0) {
      return { ok: false, message: t("errors.loadQuestionsFailed") };
    }

    let questions =
      mode === "inteligentna"
        ? attachAntaresMetaToQuestions(
            mapRowsToSessionQuestions(rows),
            antaresMeta,
          )
        : mapRowsToSessionQuestions(rows);

    if (mode === "katalog" && focusQuestionId) {
      if (!questions.some((q) => q.id === focusQuestionId)) {
        const extraRows = await loadQuestionsByIdsOrdered(supabase, [
          focusQuestionId,
        ]);
        if (extraRows.length > 0) {
          questions = [mapRowsToSessionQuestions(extraRows)[0], ...questions];
        }
      }
      questions = placeFocusQuestionFirst(questions, focusQuestionId);
    }

    let reserveQuestions: SessionQuestion[] = [];
    if (mode === "inteligentna" && reserveIds.length > 0) {
      const reserveRows = await loadQuestionsByIdsOrdered(
        supabase,
        reserveIds,
        viewerTrack,
      );
      if (reserveRows.length > 0) {
        reserveQuestions = attachAntaresMetaToQuestions(
          mapRowsToSessionQuestions(reserveRows),
          antaresMeta,
        );
      }
    }

    if (mode === "katalog") {
      return {
        ok: true,
        sessionId: `katalog-${Date.now()}`,
        subject: {
          id: subjectId,
          name: subjectRow?.name ?? t("subjectBrowse"),
          short_name: subjectRow?.short_name ?? "",
        },
        questions,
        product: subjectProduct,
        adaptiveFeedbackEnabled: false,
        planSnapshot: null,
      };
    }

    let insertSubjectId = subjectId;
    if (isMix && rows[0]) {
      const { data: q1 } = await supabase
        .from("questions")
        .select("topic_id")
        .eq("id", rows[0].id)
        .maybeSingle();
      const { data: t1 } = await supabase
        .from("topics")
        .select("subject_id")
        .eq("id", q1?.topic_id as string)
        .eq("is_inbox", false)
        .maybeSingle();
      if (t1?.subject_id) insertSubjectId = t1.subject_id as string;
    }

    const dbMode = mode === "inteligentna" ? "nauka" : "egzamin";
    const insertTopicId = await resolveStudySessionTopicId(supabase, topicId);
    const remediationCount = questions.filter(
      (question) => question.antares?.isLeech,
    ).length;
    const newCount = questions.filter(
      (question) => question.antares?.isNew,
    ).length;
    const dueCount = Math.max(
      0,
      questions.length - remediationCount - newCount,
    );

    const planSnapshot = {
      memory: {
        parameterScope: memoryPlan.parameters.parameterScope,
        requestRetention: memoryPlan.retention.requestRetention,
        maximumInterval: memoryPlan.retention.maximumInterval,
        backlogPressure: memoryPlan.retention.backlogPressure,
      },
      ...(isDailyPlan
        ? {
            daily: {
              scopeSubjectId: isMix ? null : insertSubjectId,
              budgetMinutes: memoryPlan.daily.budgetMinutes,
              estimatedMinutes:
                dailyStudyPlan?.estimatedMinutes ??
                Math.ceil(
                  (questions.length *
                    memoryPlan.daily.averageQuestionSeconds) /
                    60,
                ),
              targetQuestions:
                dailyStudyPlan?.targetQuestions ??
                memoryPlan.retention.dailyCapacity,
              questionsTodayAtStart: questionsTodayAtStart ?? 0,
              plannedQuestions: questions.length,
              dueCount,
              newCount,
              remediationCount,
              targetMix: dailyStudyPlan
                ? {
                    dueCount: dailyStudyPlan.dueCount,
                    newCount: dailyStudyPlan.newCount,
                    remediationCount: dailyStudyPlan.remediationCount,
                  }
                : null,
              targetRetention: memoryPlan.retention.requestRetention,
            },
          }
        : {}),
    };

    const { data: inserted, error: insErr } = await admin
      .from("study_sessions")
      .insert({
        user_id: user.id,
        subject_id: insertSubjectId,
        topic_id: insertTopicId,
        mode: dbMode,
        total_questions: questions.length,
        question_ids: chosenIds,
        reserve_question_ids: reserveIds,
        source_filter: source,
        session_kind: mode === "inteligentna" ? "intelligent" : "classic",
        scheduler_version: schedulerVersion,
        engine_variant: engineVariant,
        experiment_key: memoryExperiment?.experimentKey ?? null,
        experiment_bucket: memoryExperiment?.bucket ?? null,
        experiment_rollout_percent: memoryExperiment?.rolloutPercent ?? null,
        feedback_experiment_variant: feedbackExperiment?.variant ?? "control",
        daily_plan_experiment_variant:
          dailyPlanExperiment?.variant ?? "control",
        memory_parameter_set_id: memoryPlan.parameters.parameterSetId,
        target_retention: memoryPlan.retention.requestRetention,
        maximum_interval: memoryPlan.retention.maximumInterval,
        plan_snapshot: planSnapshot,
      })
      .select("id")
      .single();

    if (insErr) {
      console.error("[startSession] insert session", insErr.message, insErr);
      return {
        ok: false,
        message: t("errors.createSessionColumn"),
      };
    }

    if (!isDailyPlan) {
      void persistLastSessionQuestionCount(supabase, user.id, count);
    }

    const { data: insertSubject } = await supabase
      .from("subjects")
      .select("id, name, short_name")
      .eq("id", insertSubjectId)
      .maybeSingle();

    return {
      ok: true,
      sessionId: inserted.id,
      subject: {
        id: insertSubjectId,
        name: isMix
          ? t("subjectMixed")
          : (insertSubject?.name ?? subjectRow?.name ?? ""),
        short_name: isMix
          ? t("subjectMixedShort")
          : (insertSubject?.short_name ?? subjectRow?.short_name ?? ""),
      },
      questions,
      reserveQuestions:
        reserveQuestions.length > 0 ? reserveQuestions : undefined,
      product: subjectProduct,
      adaptiveFeedbackEnabled: feedbackExperiment?.variant === "treatment",
      planSnapshot: isDailyPlan ? planSnapshot : null,
    };
  } catch (e) {
    console.error("[startSession]", e);
    return { ok: false, message: t("errors.unexpected") };
  }
}
