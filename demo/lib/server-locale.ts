import "server-only";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, translator, type Translate } from "./i18n";
import { isLocaleId, type LocaleId } from "./locales";

/** Locale for server-rendered pages: the storefront mirrors its choice into a cookie. */
export async function serverLocale(): Promise<{ locale: LocaleId; t: Translate }> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale: LocaleId = isLocaleId(value) ? value : "en";
  return { locale, t: translator(locale) };
}
