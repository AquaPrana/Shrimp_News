import { PageShell } from "@/components/layout/page-shell";

/** Ordered privacy copy keys. */
const PRIVACY_BODY_KEYS = [
  "privacyP1",
  "privacyP2",
  "privacyP3",
  "privacyP4",
  "privacyP5",
] as const;

export default function PrivacyPolicyPage() {
  return (
    <PageShell
      eyebrowKey="privacyEyebrow"
      titleKey="privacyTitle"
      descriptionKey="privacyDescription"
      bodyKeys={PRIVACY_BODY_KEYS}
    />
  );
}
