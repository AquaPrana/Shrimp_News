import assert from "node:assert/strict";
import test from "node:test";
import { articleStatus, publicArticleWhere, scheduleFields, scheduleFromFields, validateArticlePublication } from "../../src/lib/article-publication";
import { isAuthorizedCronRequest } from "../../src/lib/newsletter/cron-authorization";

const now = new Date("2026-09-08T12:00:00Z");
const future = "2026-09-10T03:30:00.000Z";

test("IST date/time round trips independently of server timezone", () => {
  assert.equal(scheduleFromFields("2026-09-10", "09:00"), future);
  assert.deepEqual(scheduleFields(future), { date: "2026-09-10", time: "09:00" });
  assert.equal(scheduleFromFields("2026-09-10", "00:00"), "2026-09-09T18:30:00.000Z");
  for (const [date, time] of [["2026-02-30", "09:00"], ["2026-09-10", "24:00"], ["", "09:00"]]) {
    assert.equal(scheduleFromFields(date, time), null);
  }
});

test("schedule requires a future unambiguous instant and overrides the legacy public flag", () => {
  for (const scheduledAt of [null, "garbage", "2026-09-10T09:00", "2027-02-30T09:00:00Z", "2027-09-10T24:00:00Z", now.toISOString(), "2026-01-01T00:00:00Z"]) {
    assert.equal(validateArticlePublication({ publishOption: "schedule", scheduledAt }, undefined, now).ok, false);
  }
  const result = validateArticlePublication({ publishOption: "schedule", scheduledAt: future, isPublished: true }, undefined, now);
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(result.value, { isPublished: false, scheduledAt: new Date(future), publishedAt: null });
});

test("edit retains schedule; reschedule, cancel and publish now clear or replace it", () => {
  const existing = { isPublished: false, scheduledAt: future, publishedAt: null };
  const edit = validateArticlePublication({}, existing, now);
  assert.equal(edit.ok && edit.value.scheduledAt?.toISOString(), future);
  const reschedule = validateArticlePublication({ publishOption: "schedule", scheduledAt: "2026-09-11T03:30:00Z" }, existing, now);
  assert.equal(reschedule.ok && reschedule.value.scheduledAt?.toISOString(), "2026-09-11T03:30:00.000Z");
  for (const payload of [{ publishOption: "draft" }, { publishOption: "now" }, { isPublished: true }, { isPublished: false }]) {
    const result = validateArticlePublication(payload, existing, now);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.scheduledAt, null);
      assert.equal(result.value.isPublished, payload.publishOption === "now" || payload.isPublished === true);
    }
  }
  const published = validateArticlePublication({ publishOption: "now" }, { isPublished: true, publishedAt: "2026-01-01T00:00:00Z" }, now);
  assert.equal(published.ok && published.value.publishedAt?.toISOString(), "2026-01-01T00:00:00.000Z");
});

test("public query and admin status agree immediately before, at and after the deadline", () => {
  for (const offset of [-1, 0, 1]) {
    const clock = new Date(new Date(future).getTime() + offset);
    const where = publicArticleWhere(clock);
    assert.deepEqual(where, { OR: [{ isPublished: true, scheduledAt: null }, { scheduledAt: { lte: clock } }] });
    for (const isPublished of [false, true]) {
      assert.equal(articleStatus({ isPublished, scheduledAt: future }, clock), offset < 0 ? "scheduled" : "published");
    }
  }
  assert.equal(articleStatus({ isPublished: false, scheduledAt: null }, now), "draft");
  assert.equal(articleStatus({ isPublished: true, scheduledAt: null }, now), "published");
});

test("publishing job requires the exact bearer credential", () => {
  assert.equal(isAuthorizedCronRequest(null, "test-secret"), false);
  assert.equal(isAuthorizedCronRequest("Bearer incorrect", "test-secret"), false);
  assert.equal(isAuthorizedCronRequest("Bearer test-secret", "test-secret"), true);
});
