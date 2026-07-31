import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidNewsletterEmail,
  parseNewsletterEmail,
} from "../../src/lib/newsletter/email-validation";

test("rejects empty, spaced, incomplete, and malformed addresses", () => {
  for (const email of [
    "",
    "test",
    "test@",
    "@gmail.com",
    "test@gmail",
    "test gmail.com",
    "test..user@gmail.com",
    ".test@gmail.com",
    "test.@gmail.com",
    "test@-gmail.com",
  ]) {
    assert.equal(isValidNewsletterEmail(email), false, email);
  }
});

test("normalizes uppercase and surrounding whitespace", () => {
  assert.deepEqual(parseNewsletterEmail("  User.Name+News@GMAIL.COM  "), {
    ok: true,
    email: "user.name+news@gmail.com",
  });
});

test("accepts a complete valid address", () => {
  assert.equal(isValidNewsletterEmail("user@example.co.in"), true);
});
