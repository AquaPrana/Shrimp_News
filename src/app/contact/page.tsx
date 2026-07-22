"use client";

import {
  PAGE_CONTENT_PANEL_CLASS,
  PageShell,
} from "@/components/layout/page-shell";
import { useLanguage } from "@/context/language-context";

const EDITORIAL_EMAIL = "editor@shrimp.news";
const BUSINESS_EMAIL = "sales@shrimp.news";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <PageShell
      eyebrowKey="contactEyebrow"
      titleKey="contactTitle"
      descriptionKey="contactDescription"
    >
      <div className={PAGE_CONTENT_PANEL_CLASS}>
        <p className="mb-4">{t("contactGeneralEnquiries")}</p>
        <p className="mb-4">
          {t("contactEditorialLabel")}:{" "}
          <a
            href={`mailto:${EDITORIAL_EMAIL}`}
            className="underline underline-offset-2"
          >
            {EDITORIAL_EMAIL}
          </a>
        </p>
        <p className="mb-4">
          {t("contactBusinessLabel")}:{" "}
          <a
            href={`mailto:${BUSINESS_EMAIL}`}
            className="underline underline-offset-2"
          >
            {BUSINESS_EMAIL}
          </a>
        </p>
        <p className="mb-0 last:mb-0">{t("contactClosing")}</p>
      </div>
    </PageShell>
  );
}
