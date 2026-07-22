import { PageShell } from "@/components/layout/page-shell";

/** Add new terms paragraphs here — each key must exist in en/te/hi translations. */
const TERMS_BODY_KEYS = [
  "termsP1",
  "termsP2",
  "termsP3",
  "termsP4",
  "termsP5",
  "termsP6",
] as const;

export default function TermsPage() {
  return (
    <PageShell
      eyebrowKey="termsEyebrow"
      titleKey="termsTitle"
      descriptionKey="termsDescription"
      bodyKeys={TERMS_BODY_KEYS}
    />
  );
}
