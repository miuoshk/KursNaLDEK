# Audyt: `questions.tracks` vs filtrowanie po kierunku

**Data:** 2026-05-28  
**Zakres:** `features/`, `lib/` (brak katalogu `server/` w root)  
**Kontekst:** planowana kolumna `questions.tracks TEXT[]` (analogicznie do `topics.tracks`).

**Wyniki grep:**
- `faculty` — brak w `.ts` / `.tsx` / `.sql`
- `.contains` / `.overlaps` (PostgREST) — brak; jedynie DOM w `TopBar.tsx`

---

## 1. Pobieranie `questions` — sesja / quiz / powtórki

### Rdzeń puli i ID pytań

`features/session/server/questionSelection.ts`

```ts
export async function fetchVisibleTopicIds(
  supabase: SupabaseClient,
  subjectScopeIds: string[],
  track?: StudyTrack,
): Promise<string[]> {
  const { data: topicRows, error: te } = await supabase
    .from("topics")
    .select("id, tracks")
    .in("subject_id", subjectScopeIds);
  // ...
  const visible = track
    ? filterTopicsForTrack(topicRows ?? [], track)
    : (topicRows ?? []);
  return visible.map((t) => t.id as string);
}

export async function fetchSubjectQuestionIds(
  supabase: SupabaseClient,
  subjectId: string,
  track?: StudyTrack,
): Promise<string[]> {
  const subjectScopeIds = getSubjectScopeIds(subjectId);
  const topicIds = await fetchVisibleTopicIds(supabase, subjectScopeIds, track);
  if (topicIds.length === 0) return [];

  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .in("topic_id", topicIds)
    .eq("is_active", true);
  // ...
}

export async function fetchTopicQuestionIds(
  supabase: SupabaseClient,
  topicId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .eq("topic_id", topicId)
    .eq("is_active", true);
  // ...
}
```

```ts
async function fetchScopedKnnpSubjectIds(
  supabase: SupabaseClient,
  track?: string,
  year?: number,
): Promise<string[]> {
  let query = supabase.from("subjects").select("id").eq("product", "knnp");
  if (track) query = query.eq("track", track);
  if (year != null) query = query.eq("year", year);
  // ...
}

export async function fetchKnnpAllQuestionIds(
  supabase: SupabaseClient,
  track?: string,
  year?: number,
): Promise<string[]> {
  // ...
  const { data, error } = await supabase
    .from("questions")
    .select("id")
    .in("topic_id", topicIds)
    .eq("is_active", true);
  // ...
}
```

Linie w pliku: `9–76`, `86–137`.

### Start sesji (orchestracja + treść pytań)

`features/session/api/startSession.ts`

```ts
    if (explicitIds && explicitIds.length > 0) {
      const rows = await loadQuestionsByIdsOrdered(supabase, explicitIds);
      // ...
      if (!resolvedSubjectId && rows[0]) {
        const { data: q1 } = await supabase
          .from("questions")
          .select("topic_id")
          .eq("id", rows[0].id)
          .maybeSingle();
```

```ts
    if (topicId) {
      const { data: top, error: te } = await supabase
        .from("topics")
        .select("subject_id, tracks")
        .eq("id", topicId)
        .maybeSingle();
      // ...
      pool = await fetchTopicQuestionIds(supabase, topicId);
      topicOkForDue = new Set(
        await fetchVisibleTopicIds(
          supabase,
          getSubjectScopeIds(subjectId),
          subjectTrack,
        ),
      );
    } else if (isMix) {
      const profile = await getProfileByUserId(user.id);
      const track = normalizeTrack(profile?.current_track);
      const year = normalizeYear(profile?.current_year);
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
```

```ts
    if (mode === "inteligentna") {
      const antares = await buildAntaresInteligentnaSession(
        supabase,
        user.id,
        count,
        pool,
        topicOkForDue,
        topicFilter,
      );
      // ...
        const dueIds = await fetchDueReviewQuestionIdsForTopics(
          supabase,
          user.id,
          topicOkForDue,
          count,
          topicFilter,
        );
        const unseenIds = await fetchUnseenQuestionIds(
          supabase,
          user.id,
          pool,
          count,
        );
        chosenIds = mixNaukaQuestionIds(dueIds, unseenIds, pool, count);
    // ...
    const rows = await loadQuestionsByIdsOrdered(supabase, chosenIds);
    // ...
      const reserveRows = await loadQuestionsByIdsOrdered(supabase, reserveIds);
```

```ts
    if (isMix && rows[0]) {
      const { data: q1 } = await supabase
        .from("questions")
        .select("topic_id")
        .eq("id", rows[0].id)
        .maybeSingle();
```

Linie: `80–101`, `177–218`, `221–288`, `310–316`.

### Treść pytań po wybranych ID

`features/session/server/loadQuestionsByIdsOrdered.ts` (linie `7–27`)

```ts
export async function loadQuestionsByIdsOrdered(
  supabase: SupabaseClient,
  ids: string[],
): Promise<QuestionRow[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("questions")
    .select(
      "id, topic_id, text, options, correct_option_id, explanation, source_code, image_url, disable_option_shuffle, topics ( name )",
    )
    .in("id", ids)
    .eq("is_active", true);
  // ...
}
```

### Wznowienie sesji (quiz w trakcie)

`features/session/api/loadSessionQuestions.ts` (linie `73–104`)

```ts
    const { data: rows, error: qe } = await supabase
      .from("questions")
      .select(
        "id, topic_id, text, options, correct_option_id, explanation, source_code, image_url, disable_option_shuffle, topics ( name )",
      )
      .in("id", ids);
    // ...
        const { data: reserveRows, error: rqErr } = await supabase
          .from("questions")
          .select(
            "id, topic_id, text, options, correct_option_id, explanation, source_code, image_url, disable_option_shuffle, topics ( name )",
          )
          .in("id", reserveIds);
```

### Powtórki (due) + FSRS meta

`features/session/server/sessionQuestionMix.ts` (linie `8–67`)

```ts
export async function fetchDueReviewQuestionIdsForTopics(
  // ...
  const { data: dueRows } = await supabase
    .from("user_question_progress")
    .select("question_id, next_review")
    .eq("user_id", userId)
    // ...
  const { data: qMeta } = await supabase
    .from("questions")
    .select("id, topic_id")
    .in("id", ids);

  const allowed = new Set(
    (qMeta ?? [])
      .filter((q) => topicOk.has(q.topic_id as string))
      .map((q) => q.id as string),
  );
```

```ts
export async function fetchDueReviewQuestionIds(
  // ...
  const { data: topicRows } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", subjectId);
  const topicOk = new Set((topicRows ?? []).map((t) => t.id as string));
```

**Uwaga:** `fetchDueReviewQuestionIds` — topiki **bez** filtra `tracks`.

`features/session/server/fetchSessionQuestionMeta.ts` (linie `69–99`)

```ts
  const { data: qRows } = await supabase
    .from("questions")
    .select("id, topic_id")
    .in("id", uniqueIds);

  const { data: progressRows } = await supabase
    .from("user_question_progress")
    .select(
      "question_id, stability, difficulty_rating, elapsed_days, scheduled_days, reps, lapses, state, next_review, last_answered_at, times_answered, times_correct, is_leech, avg_time_seconds",
    )
    .eq("user_id", userId)
```

FSRS scheduler: `features/session/lib/spaced-repetition.ts`, `features/session/server/persistUserProgressFsrs.ts` — bez `.from("questions")` przy budowie puli.

### ANTARES (inteligentna sesja)

`features/session/server/buildAntaresInteligentnaSession.ts` (linie `73–106`)

```ts
    const { data: rows } = await supabase
      .from("questions")
      .select("id, topic_id")
      .in("id", slice)
      .eq("is_active", true);

function allowedQuestion(
  qid: string,
  meta: Map<string, { topic_id: string }>,
  topicOkForDue: Set<string>,
  topicFilter: Set<string> | undefined,
): boolean {
  const m = meta.get(qid);
  if (!m) return false;
  if (!topicOkForDue.has(m.topic_id)) return false;
  if (topicFilter && !topicFilter.has(qid)) return false;
  return true;
}
```

### Po sesji / mastery

`features/session/lib/antares/recalculateTopicMastery.ts` (linie `84–89`)

```ts
      const { data: topicQuestions, error: qErr } = await supabase
        .from("questions")
        .select("id")
        .eq("topic_id", topicId)
        .eq("is_active", true);
```

`features/session/server/sessionSummaryBuilder.ts` (linie `91–94`)

```ts
  const { data: qmeta } = await supabase
    .from("questions")
    .select("id, text, correct_option_id, options, topic_id, topics ( name )")
    .in("id", qids.length ? qids : ["__none__"]);
```

`features/session/server/completeSessionPostAntares.ts` (linie `191–200`)

```ts
      supabase.from("questions").select("id, topic_id").in("id", qids),
      supabase
        .from("user_question_progress")
        .select(
          "question_id, stability, difficulty_rating, elapsed_days, scheduled_days, reps, lapses, state, next_review, last_answered_at",
        )
```

### Dashboard / liczniki (pod sesję i powtórki)

`lib/dashboard/getDueReviewsPerSubject.ts` (linie `23–27`)

```ts
  const { data: qRows } = await supabase
    .from("questions")
    .select("id, topic_id")
    .in("topic_id", topicIds)
    .eq("is_active", true);
```

`lib/dashboard/getDueReviewCount.ts` (linie `39–43`)

```ts
  const { data: qRows } = await supabase
    .from("questions")
    .select("id")
    .in("topic_id", topicIds)
    .eq("is_active", true);
```

`features/subjects/server/loadSubjectDashboard.ts` (linie `117–122`)

```ts
      const { data: qRows } = await supabase
        .from("questions")
        .select("id, topic_id")
        .in("topic_id", allTopicIds)
        .eq("is_active", true);
```

`features/subjects/server/loadKnnpSubjects.ts` (linie `104–109`)

```ts
      const { data: qRows } = await supabase
        .from("questions")
        .select("id, topic_id")
        .in("topic_id", topicIds)
        .eq("is_active", true);
```

`features/pulpit/server/loadPulpit.ts` (linie `114–123`)

```ts
      const { data: topicRows } = await supabase
        .from("topics")
        .select("id")
        .in("subject_id", getSubjectScopeIds(sid));
      // ...
        const { data: qrows } = await supabase
          .from("questions")
          .select("id")
          .in("topic_id", topicIds);
```

`features/statistics/server/masteryFromUqp.ts` (linie `17–20`)

```ts
  const { data: qrows } = await supabase
    .from("questions")
    .select("id, topic_id")
    .in("id", qids);
```

### Zapisane pytania

`features/saved/server/loadSavedQuestions.ts` (linie `29–36`)

```ts
  const { data, error } = await supabase
    .from("saved_questions")
    .select(
      "id, created_at, question_id, questions(text, topics(name, subjects(id, name, short_name, year, track)))",
    )
```

### OSCE (osobny produkt)

- `features/osce/server/loadTopicSessionData.ts` — `.from("questions")`
- `features/osce/server/fetchSimulationStationQuestions.ts` — `.from("questions")`
- `features/osce/server/loadOsceStations.ts`, `loadOpgAtlasData.ts` — też `questions`

### Admin (poza ścieżką sesji KNNP)

- `features/admin/server/loadAdminQuestions.ts`
- `features/admin/server/loadAdminQuestionDetail.ts`
- `features/admin/server/adminActions.ts`
- `features/admin/server/syncTopicQuestionCount.ts`
- `features/admin/server/loadAdminReports.ts`
- `features/admin/server/loadAdminShared.ts`

---

## 2. Filtrowanie po kierunku (obecny stan)

### `topics.tracks` — logika TS

`lib/content/topicTrackVisibility.ts` (cały plik)

```ts
/** NULL / pusta tablica = widoczny na obu kierunkach. */
export function isTopicVisibleForTrack(
  tracks: string[] | null | undefined,
  track: StudyTrack,
): boolean {
  if (!tracks || tracks.length === 0) return true;
  return tracks.includes(track);
}

export function filterTopicsForTrack<T extends TopicWithTracks>(
  rows: T[],
  track: StudyTrack,
): T[] {
  return rows.filter((row) => isTopicVisibleForTrack(row.tracks, track));
}
```

### `subjects.track` + rok (sesja mieszana / katalog)

`features/shared/server/knnpCatalogCache.ts` (linie `32–45`)

```ts
  let query = supabase
    .from("subjects")
    .select(
      "id, name, short_name, icon_name, year, track, product, display_order",
    )
    .eq("product", "knnp");
  if (track) {
    query = query.eq("track", track);
  }
  if (year != null) {
    query = query.eq("year", year);
  }
```

`features/session/server/questionSelection.ts` (linie `91–93`)

```ts
  if (track) query = query.eq("track", track);
  if (year != null) query = query.eq("year", year);
```

### Pytania — brak filtra per kierunek w query

Tylko `topic_id` + `is_active` (np. `questionSelection.ts` 48–52).

### `fetchDueReviewQuestionIds` — topiki bez `tracks`

`features/session/server/sessionQuestionMix.ts` (linie `56–60`)

```ts
  const { data: topicRows } = await supabase
    .from("topics")
    .select("id")
    .eq("subject_id", subjectId);
```

---

## 3. Skąd kod zna kierunek użytkownika

**`profiles.current_track`** — nie `faculty`, nie `program`.

`lib/dashboard/cachedProfile.ts`

```ts
export const getProfileByUserId = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
});
```

`features/access/lib/studyAccess.ts` (linie `34–36`)

```ts
export function normalizeTrack(track: string | null | undefined): StudyTrack {
  return track === "lekarski" ? "lekarski" : "stomatologia";
}
```

`app/(dashboard)/layout.tsx` (linie `58–65`)

```ts
    const profileRow = await getProfileByUserId(user.id);
    const userTrack = profileRow?.current_track ?? "stomatologia";
    const userYear = profileRow?.current_year ?? 1;
    currentTrack = normalizeTrack(userTrack);
    await getCachedKnnpCatalog(userTrack, userYear);
    dueReviewsCount = await getDueReviewCount(supabase, user.id, userTrack, userYear);
```

Rejestracja: `features/auth/actions.ts` (linie `231–236`)

```ts
        current_track: parsed.data.currentTrack,
        current_year: parsed.data.currentYear,
```

**Sesja na konkretnym przedmiocie** — kierunek z `subjects.track` powłoki:

`features/session/api/startSession.ts` (linie `157–167`)

```ts
        .select("id, name, short_name, track")
      // ...
      subjectTrack = normalizeTrack(subject.track as string);
```

**Dashboard przedmiotu:**

`features/subjects/server/loadSubjectDashboard.ts` (linie `105–106`)

```ts
    const viewerTrack = normalizeTrack(subject.track as string) as StudyTrack;
    const topicRows = filterTopicsForTrack(allTopicRows ?? [], viewerTrack);
```

**Lista przedmiotów KNNP:** `profiles.current_track` — `features/subjects/server/loadKnnpSubjects.ts` (linie `60–63`).

---

## 4. Gdzie filtrowane jest `topics.tracks`

### A) Lista `topic_id` przed zapytaniem o `questions`

`features/session/server/questionSelection.ts` — `fetchVisibleTopicIds` (linie `9–27`).

Używane w: `fetchSubjectQuestionIds`, `fetchKnnpAllQuestionIds`, `fetchKnnpTopicIdSet`, `startSession` (`topicOkForDue`).

### B) Katalog KNNP

`features/shared/server/knnpCatalogCache.ts` (linie `54–65`)

```ts
    .select("id, subject_id, question_count, tracks")
  const topicRows =
    track != null
      ? filterTopicsForTrack(rawTopicRows ?? [], normalizeTrack(track))
      : (rawTopicRows ?? []);
```

→ `loadKnnpSubjects`, `getDueReviewCount`, layout.

### C) UI działów przedmiotu

`features/subjects/server/loadSubjectDashboard.ts` (linie `46–106`)

### D) Start sesji — jeden temat

`features/session/api/startSession.ts` (linie `177–188`)

```ts
      if (!isTopicVisibleForTrack(top.tracks as string[] | null, subjectTrack)) {
        return { ok: false, message: "Ten temat nie jest dostępny na Twoim kierunku." };
      }
```

### E) ANTARES

`features/session/server/buildAntaresInteligentnaSession.ts` — `allowedQuestion` sprawdza `topicOkForDue` (już po filtrze topików).

---

## 5. Schema: `questions` — brak pól per kierunek

`supabase-schema.sql` (linie `144–164`) — brak `tracks`, `faculty`, `program`, `visible_for_*`.

`topics.tracks`:

`scripts/2026-05-28-topics-tracks.sql`

```sql
ALTER TABLE public.topics
  ADD COLUMN IF NOT EXISTS tracks TEXT[] DEFAULT NULL;
```

---

## 6. Miejsca do zmiany przy `questions.tracks` (checklist)

| Priorytet | Plik | Uwagi |
|-----------|------|--------|
| 1 | `features/session/server/questionSelection.ts` | 3× `.from("questions")` — główna pula sesji |
| 2 | `features/session/server/sessionQuestionMix.ts` | due + `fetchDueReviewQuestionIds` (dodać `tracks` na topics) |
| 3 | `features/session/server/loadQuestionsByIdsOrdered.ts` | treść pytań — filtrować lub odrzucać niewidoczne ID |
| 4 | `lib/dashboard/getDueReviewCount.ts` | powtórki globalne |
| 5 | `lib/dashboard/getDueReviewsPerSubject.ts` | due per przedmiot |
| 6 | `features/subjects/server/loadSubjectDashboard.ts` | liczniki działów |
| 7 | `features/subjects/server/loadKnnpSubjects.ts` | suma pytań na liście przedmiotów |
| 8 | `features/session/server/buildAntaresInteligentnaSession.ts` | `allowedQuestion` + meta |
| 9 | `features/session/lib/antares/recalculateTopicMastery.ts` | mastery per topic |
| 10 | `features/pulpit/server/loadPulpit.ts` | mastery ostatniego przedmiotu (topiki bez `tracks` filter) |

**Wyjątki / ostrożnie:**
- `startSession` — `explicitIds` (retry) — bez filtra kierunku dziś
- `loadSessionQuestions` — wczytuje zapisane `question_ids` z sesji
- `fetchDueReviewQuestionIds` — legacy, bez `topics.tracks`
- Admin / OSCE — osobna decyzja produktowa

**Helper docelowy (propozycja):** współdzielić z `topicTrackVisibility.ts` — np. `isContentVisibleForTrack(tracks, track)` dla `topics` i `questions` (NULL = oba kierunki).

---

## Powiązane

- `exports/histologia-stoma-audyt-i-claude-handover.md`
- `FormatPisaniaPytan-PoHistologii-Stoma.md`
- `features/session/server/sharedSubjects.ts` — kanon `histologia` vs `stoma-histologia` / `lek-histologia`
