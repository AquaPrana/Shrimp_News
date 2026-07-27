import "server-only";

import { cookies } from "next/headers";
import {
  LANGUAGE_COOKIE_KEY,
  parseLanguage,
  type Language,
} from "@/lib/language-preference";

/**
 * Read the visitor language cookie for SSR.
 * Defaults to English when unset or invalid.
 */
export async function getRequestLanguage(): Promise<Language> {
  const jar = await cookies();
  return parseLanguage(jar.get(LANGUAGE_COOKIE_KEY)?.value) ?? "en";
}
