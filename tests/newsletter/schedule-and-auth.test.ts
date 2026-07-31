import assert from "node:assert/strict";
import test from "node:test";
import { isAuthorizedCronRequest } from "../../src/lib/newsletter/cron-authorization";
import {
  newsletterWeekKey,
  previousSevenDays,
} from "../../src/lib/newsletter/schedule";

test("uses the same permanent week key across a Monday retry", () => {
  assert.equal(
    newsletterWeekKey(new Date("2026-07-27T03:30:00.000Z")),
    "2026-07-27",
  );
  assert.equal(
    newsletterWeekKey(new Date("2026-07-30T12:00:00.000Z")),
    "2026-07-27",
  );
});

test("selects exactly the previous seven days", () => {
  const now = new Date("2026-07-27T03:30:00.000Z");
  const range = previousSevenDays(now);
  assert.equal(range.to.toISOString(), now.toISOString());
  assert.equal(range.from.toISOString(), "2026-07-20T03:30:00.000Z");
});

test("cron authorization rejects missing and invalid secrets", () => {
  assert.equal(isAuthorizedCronRequest(null, "expected-secret"), false);
  assert.equal(
    isAuthorizedCronRequest("Bearer wrong-secret", "expected-secret"),
    false,
  );
  assert.equal(
    isAuthorizedCronRequest("Bearer expected-secret", "expected-secret"),
    true,
  );
});
