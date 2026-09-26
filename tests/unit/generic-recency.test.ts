import { test } from "node:test";
import assert from "node:assert/strict";
import { RECENCY_LABELS, groupByRecency, recencyGroupFor } from "../../packages/ui/src/index";

const now = new Date(2026, 8, 26, 15, 0, 0);

test("recency buckets follow calendar days relative to now", () => {
  assert.equal(recencyGroupFor(new Date(2026, 8, 26, 0, 5), now).label, "Today");
  assert.equal(recencyGroupFor(new Date(2026, 8, 27, 9), now).label, "Today");
  assert.equal(recencyGroupFor(new Date(2026, 8, 25, 23, 59), now).label, "Yesterday");
  assert.equal(recencyGroupFor(new Date(2026, 8, 25, 0, 0), now).label, "Yesterday");
  assert.equal(recencyGroupFor(new Date(2026, 8, 24, 23, 59), now).label, "Previous 7 days");
  assert.equal(recencyGroupFor(new Date(2026, 8, 19), now).label, "Previous 7 days");
  assert.equal(recencyGroupFor(new Date(2026, 8, 18), now).label, "Previous 30 days");
  assert.equal(recencyGroupFor(new Date(2026, 7, 27), now).label, "Previous 30 days");
  assert.equal(recencyGroupFor(new Date(2026, 7, 26), now).label, "August");
  assert.equal(recencyGroupFor(new Date(2026, 5, 3), now).label, "June");
  assert.equal(recencyGroupFor(new Date(2025, 11, 3), now).label, "December 2025");
  assert.deepEqual(recencyGroupFor("not a date", now), { key: "older", bucket: "older", label: "Older" });
  assert.deepEqual(RECENCY_LABELS, {
    today: "Today",
    yesterday: "Yesterday",
    week: "Previous 7 days",
    month: "Previous 30 days",
    older: "Older",
  });
});

test("an explicit time zone decides the calendar day, not the process zone", () => {
  const utcNow = new Date("2026-09-26T02:00:00Z");
  const lateEvening = "2026-09-25T20:00:00Z";
  assert.equal(recencyGroupFor(lateEvening, utcNow, { timeZone: "UTC" }).label, "Yesterday");
  assert.equal(recencyGroupFor(lateEvening, utcNow, { timeZone: "America/Los_Angeles" }).label, "Today");
  assert.equal(recencyGroupFor(lateEvening, utcNow, { timeZone: "Pacific/Auckland" }).label, "Today");
  assert.equal(
    recencyGroupFor("2026-08-01T03:00:00Z", new Date("2026-10-15T12:00:00Z"), { timeZone: "America/New_York" }).label,
    "July",
  );
  assert.equal(
    recencyGroupFor("2026-08-01T03:00:00Z", new Date("2026-10-15T12:00:00Z"), { timeZone: "America/New_York" }).key,
    "2026-07",
  );
});

test("daylight saving transitions do not shift day boundaries", () => {
  const options = { timeZone: "America/New_York" };
  const afterFallBack = new Date("2026-11-02T17:00:00Z");
  assert.equal(recencyGroupFor("2026-11-01T04:30:00Z", afterFallBack, options).label, "Yesterday");
  assert.equal(recencyGroupFor("2026-10-31T03:59:00Z", afterFallBack, options).label, "Previous 7 days");
  const afterSpringForward = new Date("2026-03-09T16:00:00Z");
  assert.equal(recencyGroupFor("2026-03-08T05:00:00Z", afterSpringForward, options).label, "Yesterday");
  assert.equal(recencyGroupFor("2026-03-09T04:00:00Z", afterSpringForward, options).label, "Today");
});

test("groupByRecency keeps newest first, preserves group order and puts invalid dates last", () => {
  const groups = groupByRecency(
    [
      { id: "a", at: new Date(2026, 8, 20).toISOString() },
      { id: "x", at: "garbage" },
      { id: "b", at: new Date(2026, 8, 26, 9).getTime() },
      { id: "c", at: new Date(2026, 8, 26, 12) },
      { id: "d", at: new Date(2026, 1, 2).toISOString() },
    ],
    (item) => item.at,
    now,
  );
  assert.deepEqual(
    groups.map((group) => group.label),
    ["Today", "Previous 7 days", "February", "Older"],
  );
  assert.deepEqual(groups[0].items.map((item) => item.id), ["c", "b"]);
  assert.deepEqual(groups.map((group) => group.bucket), ["today", "week", "older", "older"]);
  assert.deepEqual(groupByRecency([], () => 0, now), []);
});

test("labels and locale can be localized", () => {
  const options = { locale: "es-ES", labels: { today: "Hoy", yesterday: "Ayer" } };
  assert.equal(recencyGroupFor(new Date(2026, 8, 26, 1), now, options).label, "Hoy");
  assert.equal(recencyGroupFor(new Date(2026, 8, 25, 1), now, options).label, "Ayer");
  assert.equal(recencyGroupFor(new Date(2026, 5, 3), now, options).label, "junio");
});
