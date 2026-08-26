import assert from "node:assert/strict";
import test from "node:test";
import { deriveRetentionPolicy } from "@/features/session/lib/memory/retentionPolicy";

const now = new Date("2026-08-25T00:00:00.000Z");

test("wysoki backlog obniża koszt retencji", () => {
  const policy = deriveRetentionPolicy({
    dailyMinutes: 20,
    dueCount: 2_000,
    averageQuestionSeconds: 45,
    examDate: null,
    now,
  });

  assert.equal(policy.requestRetention, 0.82);
  assert.ok(policy.backlogPressure > 4);
});

test("bliski egzamin podnosi retencję tylko przy wykonalnym backlogu", () => {
  const manageable = deriveRetentionPolicy({
    dailyMinutes: 30,
    dueCount: 10,
    averageQuestionSeconds: 45,
    examDate: "2026-09-10T00:00:00.000Z",
    now,
  });
  const overloaded = deriveRetentionPolicy({
    dailyMinutes: 30,
    dueCount: 2_000,
    averageQuestionSeconds: 45,
    examDate: "2026-09-10T00:00:00.000Z",
    now,
  });

  assert.equal(manageable.requestRetention, 0.93);
  assert.equal(overloaded.requestRetention, 0.82);
});

test("maksymalny interwał nie wybiega poza odległy egzamin", () => {
  const policy = deriveRetentionPolicy({
    dailyMinutes: 30,
    dueCount: 0,
    averageQuestionSeconds: 45,
    examDate: "2027-02-21T00:00:00.000Z",
    now,
  });

  assert.equal(policy.maximumInterval, 180);
});

test("interwał nie wybiega poza egzamin następnego dnia", () => {
  const policy = deriveRetentionPolicy({
    dailyMinutes: 30,
    dueCount: 0,
    averageQuestionSeconds: 45,
    examDate: "2026-08-26T00:00:00.000Z",
    now,
  });

  assert.equal(policy.maximumInterval, 1);
});

test("pojemność dnia mieści jedną wolną próbę w pięciu minutach", () => {
  const policy = deriveRetentionPolicy({
    dailyMinutes: 5,
    dueCount: 10,
    averageQuestionSeconds: 300,
    examDate: null,
    now,
  });

  assert.equal(policy.dailyCapacity, 1);
});
