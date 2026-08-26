#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
await db.exec(`
  CREATE ROLE anon;
  CREATE ROLE authenticated;
  CREATE ROLE service_role;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (
    id uuid PRIMARY KEY,
    email text,
    raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb
  );
  CREATE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
  CREATE FUNCTION auth.role() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT current_user $$;
`);
await db.exec(await readFile(resolve("supabase-schema.sql"), "utf8"));
await db.exec(`
  ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student';
  ALTER TABLE public.topics
    ADD COLUMN IF NOT EXISTS is_inbox boolean NOT NULL DEFAULT false;
  ALTER TABLE public.questions
    ADD COLUMN IF NOT EXISTS source text,
    ADD COLUMN IF NOT EXISTS reserve_bucket integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS repeat_count integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subtheme_label text,
    ADD COLUMN IF NOT EXISTS tracks text[];
  ALTER TABLE public.study_sessions
    ADD COLUMN IF NOT EXISTS question_ids jsonb,
    ADD COLUMN IF NOT EXISTS reserve_question_ids jsonb,
    ADD COLUMN IF NOT EXISTS source_filter text;
  CREATE TABLE IF NOT EXISTS public.error_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid,
    created_at timestamptz NOT NULL DEFAULT now()
  );
`);

const migrations = [
  "scripts/2026-08-25-personalized-learning-events.sql",
  "scripts/2026-08-25-daily-study-plan.sql",
  "scripts/2026-08-25-fsrs-memory-v2.sql",
  "scripts/2026-08-25-learning-concepts.sql",
  "scripts/2026-08-25-memory-v2-experiment.sql",
  "scripts/2026-08-25-learning-indexes-concurrently.sql",
];
for (const path of migrations) {
  const sql = (await readFile(resolve(path), "utf8")).replace(
    /^\\set ON_ERROR_STOP on$/m,
    "",
  );
  try {
    if (path.endsWith("learning-indexes-concurrently.sql")) {
      for (const statement of sql
        .split(";")
        .map((value) => value.trim())
        .filter(Boolean)) {
        await db.query(statement);
      }
    } else {
      await db.exec(sql);
    }
  } catch (error) {
    console.error(`FAIL ${path}: ${error.message}`);
    throw error;
  }
  console.log(`OK ${path}`);
}

await db.exec(`
  SELECT set_config('request.jwt.claim.role', 'service_role', false);
  SELECT set_config('request.jwt.claims', '{"role":"service_role"}', false);
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (
    '00000000-0000-4000-8000-000000000001',
    'test@example.com',
    '{"full_name":"Test User","nick":"test-user"}'::jsonb
  );
  INSERT INTO public.subjects (id, name, short_name, year)
  VALUES ('subject', 'Subject', 'SUB', 1);
  INSERT INTO public.topics (id, subject_id, name)
  VALUES ('topic', 'subject', 'Topic');
  INSERT INTO public.questions (
    id, topic_id, text, options, correct_option_id, explanation
  )
  VALUES ('question', 'topic', 'Question', '[]'::jsonb, 'a', 'Explanation');
  INSERT INTO public.study_sessions (
    id, user_id, subject_id, mode, total_questions, question_ids
  )
  VALUES (
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000001',
    'subject',
    'nauka',
    1,
    '["question"]'::jsonb
  );
  INSERT INTO public.session_answers (
    id, session_id, question_id, selected_option_id, is_correct, question_order
  )
  VALUES (
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000002',
    'question',
    'a',
    true,
    0
  );
`);
const applied = await db.query(`
  SELECT public.apply_user_question_review(
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    'question',
    false,
    NULL,
    0,
    true,
    'troche',
    '{
      "last_answered_at":"2026-08-25T00:00:00Z",
      "stability":1,
      "difficulty_rating":5,
      "elapsed_days":0,
      "scheduled_days":1,
      "learning_steps":2,
      "reps":1,
      "lapses":0,
      "state":"learning",
      "next_review":"2026-08-26T00:00:00Z"
    }'::jsonb,
    '{
      "fsrs_rating":3,
      "rating_source":"explicit",
      "state_before":"new",
      "state_after":"learning",
      "retrievability_before":0,
      "retrievability_after":1,
      "stability_before":0,
      "stability_after":1,
      "difficulty_before":0,
      "difficulty_after":5,
      "snapshot_before":{"state":"new","stability":0,"difficulty":0,"elapsedDays":0,"scheduledDays":0,"learningSteps":0,"reps":0,"lapses":0,"due":null,"lastReview":null,"retrievability":0},
      "snapshot_after":{"state":"learning","stability":1,"difficulty":5,"elapsedDays":0,"scheduledDays":1,"learningSteps":2,"reps":1,"lapses":0,"due":"2026-08-26T00:00:00Z","lastReview":"2026-08-25T00:00:00Z","retrievability":1},
      "due_before":"",
      "due_after":"2026-08-26T00:00:00Z"
    }'::jsonb
  ) AS status
`);
if (applied.rows[0]?.status !== "applied") {
  throw new Error("apply_user_question_review did not apply");
}
const appliedAgain = await db.query(`
  SELECT public.apply_user_question_review(
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000001',
    'question',
    false,
    NULL,
    0,
    true,
    'troche',
    '{
      "last_answered_at":"2026-08-25T00:00:00Z",
      "stability":1,
      "difficulty_rating":5,
      "elapsed_days":0,
      "scheduled_days":1,
      "learning_steps":2,
      "reps":1,
      "lapses":0,
      "state":"learning",
      "next_review":"2026-08-26T00:00:00Z"
    }'::jsonb,
    '{
      "fsrs_rating":3,
      "rating_source":"explicit",
      "state_before":"new",
      "state_after":"learning",
      "retrievability_before":0,
      "retrievability_after":1,
      "stability_before":0,
      "stability_after":1,
      "difficulty_before":0,
      "difficulty_after":5,
      "snapshot_before":{"state":"new","stability":0,"difficulty":0,"elapsedDays":0,"scheduledDays":0,"learningSteps":0,"reps":0,"lapses":0,"due":null,"lastReview":null,"retrievability":0},
      "snapshot_after":{"state":"learning","stability":1,"difficulty":5,"elapsedDays":0,"scheduledDays":1,"learningSteps":2,"reps":1,"lapses":0,"due":"2026-08-26T00:00:00Z","lastReview":"2026-08-25T00:00:00Z","retrievability":1},
      "due_before":"",
      "due_after":"2026-08-26T00:00:00Z"
    }'::jsonb
  ) AS status
`);
if (appliedAgain.rows[0]?.status !== "already_applied") {
  throw new Error("apply_user_question_review is not idempotent");
}
const state = await db.query(`
  SELECT
    progress.learning_steps,
    answer.fsrs_applied,
    answer.fsrs_snapshot_after->>'state' AS snapshot_state
  FROM public.user_question_progress progress
  JOIN public.session_answers answer
    ON answer.id = '00000000-0000-4000-8000-000000000003'
  WHERE progress.question_id = 'question'
`);
if (
  state.rows[0]?.learning_steps !== 2 ||
  state.rows[0]?.fsrs_applied !== true ||
  state.rows[0]?.snapshot_state !== "learning"
) {
  throw new Error("Atomic FSRS state was not persisted");
}
console.log("OK runtime apply_user_question_review");

const memoryV2Args = `
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000001',
  'question',
  'memory-v2/ts-fsrs-5.4.1',
  NULL,
  'shadow',
  false,
  NULL,
  0,
  '{
    "state":"learning",
    "stability":1,
    "difficulty":5,
    "elapsed_days":0,
    "scheduled_days":1,
    "learning_steps":2,
    "reps":1,
    "lapses":0,
    "next_review":"2026-08-26T00:00:00Z",
    "last_answered_at":"2026-08-25T00:00:00Z",
    "source":"live",
    "updated_at":"2026-08-25T00:00:00Z"
  }'::jsonb,
  '{
    "fsrs_rating":3,
    "state_before":"new",
    "state_after":"learning",
    "retrievability_before":0,
    "retrievability_after":1,
    "stability_before":0,
    "stability_after":1,
    "difficulty_before":0,
    "difficulty_after":5,
    "learning_steps_before":0,
    "learning_steps_after":2,
    "snapshot_before":{"state":"new","stability":0,"difficulty":0,"elapsedDays":0,"scheduledDays":0,"learningSteps":0,"reps":0,"lapses":0,"due":null,"lastReview":null,"retrievability":0},
    "snapshot_after":{"state":"learning","stability":1,"difficulty":5,"elapsedDays":0,"scheduledDays":1,"learningSteps":2,"reps":1,"lapses":0,"due":"2026-08-26T00:00:00Z","lastReview":"2026-08-25T00:00:00Z","retrievability":1},
    "due_before":"",
    "due_after":"2026-08-26T00:00:00Z"
  }'::jsonb
`;
const memoryApplied = await db.query(`
  SELECT public.apply_memory_v2_review(${memoryV2Args}) AS status
`);
const memoryRepeated = await db.query(`
  SELECT public.apply_memory_v2_review(${memoryV2Args}) AS status
`);
if (
  memoryApplied.rows[0]?.status !== "applied" ||
  memoryRepeated.rows[0]?.status !== "already_applied"
) {
  throw new Error("apply_memory_v2_review is not atomic and idempotent");
}
const memoryState = await db.query(`
  SELECT
    memory.reps,
    COUNT(projection.*)::integer AS projections,
    bool_and(projection.snapshot_after IS NOT NULL) AS has_snapshot
  FROM public.user_question_memory_v2 memory
  JOIN public.session_answer_memory_projections projection
    ON projection.user_id = memory.user_id
    AND projection.question_id = memory.question_id
  WHERE memory.question_id = 'question'
  GROUP BY memory.reps
`);
if (
  memoryState.rows[0]?.reps !== 1 ||
  memoryState.rows[0]?.projections !== 1 ||
  memoryState.rows[0]?.has_snapshot !== true
) {
  throw new Error("Atomic memory v2 state was not persisted");
}
console.log("OK runtime apply_memory_v2_review");

await db.exec(`
  INSERT INTO public.concepts (id, subject_id, topic_id, slug, name)
  VALUES (
    '00000000-0000-4000-8000-000000000004',
    'subject',
    'topic',
    'runtime-concept',
    'Runtime concept'
  );
  INSERT INTO public.question_concepts (question_id, concept_id)
  VALUES ('question', '00000000-0000-4000-8000-000000000004');
`);
const finalized = await db.query(`
  SELECT public.finalize_learning_answer(
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000003',
    'question',
    0.9,
    'legacy-v1',
    '{"fsrs_rating":3,"fsrs_rating_label":"Good"}'::jsonb
  ) AS result
`);
const finalizedAgain = await db.query(`
  SELECT public.finalize_learning_answer(
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000003',
    'question',
    0.9,
    'legacy-v1',
    '{"fsrs_rating":3,"fsrs_rating_label":"Good"}'::jsonb
  ) AS result
`);
if (
  finalized.rows[0]?.result?.correctStreak !== 1 ||
  finalizedAgain.rows[0]?.result?.correctStreak !== 1
) {
  throw new Error("finalize_learning_answer is not idempotent");
}
const conceptState = await db.query(`
  SELECT
    state.exposures,
    COUNT(attempt.*)::integer AS attempts,
    progress.correct_streak,
    COUNT(event.*)::integer AS events
  FROM public.user_concept_state state
  JOIN public.user_concept_attempts attempt
    ON attempt.user_id = state.user_id
    AND attempt.concept_id = state.concept_id
  JOIN public.user_question_progress progress
    ON progress.user_id = state.user_id
    AND progress.question_id = 'question'
  JOIN public.learning_events event
    ON event.answer_id = attempt.answer_id
    AND event.event_type = 'answer'
  WHERE state.concept_id = '00000000-0000-4000-8000-000000000004'
  GROUP BY state.exposures, progress.correct_streak
`);
if (
  conceptState.rows[0]?.exposures !== 1 ||
  conceptState.rows[0]?.attempts !== 1 ||
  conceptState.rows[0]?.correct_streak !== 1 ||
  conceptState.rows[0]?.events !== 1
) {
  throw new Error("Final answer processing is not atomic and idempotent");
}
console.log("OK runtime finalize_learning_answer");

const feedbackStatus = await db.query(`
  SELECT public.record_feedback_consumption(
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'question',
    'standard',
    4.5
  ) AS status
`);
const feedbackStatusAgain = await db.query(`
  SELECT public.record_feedback_consumption(
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    'question',
    'standard',
    4.5
  ) AS status
`);
const feedbackTelemetry = await db.query(`
  SELECT
    answer.feedback_dwell_seconds,
    COUNT(event.*)::integer AS events
  FROM public.session_answers answer
  JOIN public.learning_events event
    ON event.answer_id = answer.id
    AND event.event_type = 'feedback_consumed'
  WHERE answer.id = '00000000-0000-4000-8000-000000000003'
  GROUP BY answer.feedback_dwell_seconds
`);
if (
  feedbackStatus.rows[0]?.status !== "applied" ||
  feedbackStatusAgain.rows[0]?.status !== "already_applied" ||
  Number(feedbackTelemetry.rows[0]?.feedback_dwell_seconds) !== 4.5 ||
  feedbackTelemetry.rows[0]?.events !== 1
) {
  throw new Error("Feedback telemetry is not atomic and idempotent");
}
console.log("OK runtime record_feedback_consumption");

const fingerprint = "a".repeat(64);
const weights = JSON.stringify(Array.from({ length: 21 }, () => 1));
await db.query(`
  SELECT public.activate_fsrs_parameter_set(
    'memory-v2/ts-fsrs-5.4.1',
    'global',
    NULL,
    NULL,
    NULL,
    '${weights}'::jsonb,
    0.9,
    3650,
    10000,
    0.1,
    0.1,
    now(),
    '{"parameterFingerprint":"${fingerprint}"}'::jsonb
  )
`);
await db.query(`
  SELECT public.set_learning_experiment_rollout(
    'memory-v2-rollout',
    5,
    '{
      "experimentKey":"memory-v2-rollout",
      "stage":"preflight",
      "decision":"pass",
      "violations":[],
      "evaluatedAt":"${new Date().toISOString()}",
      "parameterFingerprint":"${fingerprint}"
    }'::jsonb,
    'migration-test'
  )
`);
let activationBlocked = false;
try {
  await db.query(`
    SELECT public.activate_fsrs_parameter_set(
      'memory-v2/ts-fsrs-5.4.1',
      'global',
      NULL,
      NULL,
      NULL,
      '${weights}'::jsonb,
      0.9,
      3650,
      10000,
      0.1,
      0.1,
      now(),
      '{"parameterFingerprint":"${fingerprint}"}'::jsonb
    )
  `);
} catch {
  activationBlocked = true;
}
if (!activationBlocked) {
  throw new Error("Parameter activation was not frozen during rollout");
}
console.log("OK runtime staged rollout and parameter freeze");

await db.close();
