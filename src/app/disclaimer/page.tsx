import { PageShell } from "@/components/layout/page-shell";

/** Add new disclaimer paragraphs here — each key must exist in en/te/hi translations. */
const DISCLAIMER_BODY_KEYS = [
  "disclaimerP1",
  "disclaimerP2",
  "disclaimerP3",
  "disclaimerP4",
  "disclaimerP5",
] as const;

export default function DisclaimerPage() {
  return (
    <PageShell
      eyebrowKey="disclaimerEyebrow"
      titleKey="disclaimerTitle"
      descriptionKey="disclaimerDescription"
      bodyKeys={DISCLAIMER_BODY_KEYS}
    />
  );
}
