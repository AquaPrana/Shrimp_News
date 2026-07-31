const LOCAL_PART = /^[A-Z0-9!#$%&'*+/=?^_`{|}~.-]+$/i;
const DOMAIN_LABEL = /^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?$/i;

export function normalizeNewsletterEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidNewsletterEmail(value: string) {
  if (!value || value.length > 190 || /\s/.test(value)) return false;

  const parts = value.split("@");
  if (parts.length !== 2) return false;

  const [local, domain] = parts;
  if (
    !local ||
    local.length > 64 ||
    local.startsWith(".") ||
    local.endsWith(".") ||
    local.includes("..") ||
    !LOCAL_PART.test(local)
  ) {
    return false;
  }

  if (!domain || domain.length > 253 || domain.includes("..")) return false;
  const labels = domain.split(".");
  if (labels.length < 2 || labels.some((label) => !DOMAIN_LABEL.test(label))) {
    return false;
  }

  const topLevelDomain = labels.at(-1) || "";
  return /^[A-Z]{2,63}$/i.test(topLevelDomain);
}

export function parseNewsletterEmail(value: unknown) {
  const email = normalizeNewsletterEmail(value);
  return isValidNewsletterEmail(email)
    ? { ok: true as const, email }
    : { ok: false as const, email };
}
