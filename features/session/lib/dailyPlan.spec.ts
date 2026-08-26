import assert from "node:assert/strict";
import test from "node:test";
import { buildDailyPlan } from "./dailyPlan";

test("mieści plan i jego miks w budżecie czasu", () => {
  const plan = buildDailyPlan({
    dailyMinutes: 30,
    averageQuestionSeconds: 60,
    questionsToday: 5,
    dueBacklog: 12,
    remediationBacklog: 4,
    savedConceptSignalCount: 2,
    daysToExam: 120,
  });

  assert.equal(plan.targetQuestions, 30);
  assert.equal(plan.questionCount, 25);
  assert.equal(plan.dueCount + plan.newCount + plan.remediationCount, 25);
  assert.ok(plan.estimatedMinutes <= 30);
  assert.match(plan.startHref ?? "", /plan=1/);
});

test("zapisane pytania dają remediację bez pijawek", () => {
  const plan = buildDailyPlan({
    dailyMinutes: 30,
    averageQuestionSeconds: 60,
    questionsToday: 0,
    dueBacklog: 12,
    remediationBacklog: 0,
    savedConceptSignalCount: 8,
    daysToExam: 120,
  });

  assert.equal(plan.remediationCount, 6);
  assert.ok(plan.rationale.includes("saved_concepts"));
});

test("nie pokazuje całego backlogu jako planu na dziś", () => {
  const plan = buildDailyPlan({
    dailyMinutes: 15,
    averageQuestionSeconds: 45,
    questionsToday: 0,
    dueBacklog: 800,
    remediationBacklog: 20,
    savedConceptSignalCount: 0,
    daysToExam: null,
  });

  assert.equal(plan.questionCount, 20);
  assert.ok(plan.dueCount < plan.dueBacklog);
  assert.ok(plan.rationale.includes("due_backlog"));
});

test("zamyka plan po wykorzystaniu dziennego budżetu", () => {
  const plan = buildDailyPlan({
    dailyMinutes: 10,
    averageQuestionSeconds: 60,
    questionsToday: 12,
    dueBacklog: 50,
    remediationBacklog: 0,
    savedConceptSignalCount: 0,
    daysToExam: null,
  });

  assert.equal(plan.questionCount, 0);
  assert.equal(plan.startHref, null);
  assert.deepEqual(plan.rationale, ["plan_complete"]);
});

test("nie wymusza pięciu pytań ponad budżet wolnego użytkownika", () => {
  const plan = buildDailyPlan({
    dailyMinutes: 5,
    averageQuestionSeconds: 300,
    questionsToday: 0,
    dueBacklog: 10,
    remediationBacklog: 0,
    savedConceptSignalCount: 0,
    daysToExam: null,
  });

  assert.equal(plan.targetQuestions, 1);
  assert.equal(plan.questionCount, 1);
  assert.equal(plan.estimatedMinutes, 5);
});
