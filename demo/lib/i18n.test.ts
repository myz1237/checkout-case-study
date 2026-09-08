import { describe, expect, it } from "vitest";
import { MESSAGE_KEYS, translator } from "./i18n";
import { LOCALES } from "./locales";

describe("i18n", () => {
  it("has every key in every locale", () => {
    for (const locale of Object.keys(LOCALES) as (keyof typeof LOCALES)[]) {
      const t = translator(locale);
      for (const key of MESSAGE_KEYS) expect(t(key), `${locale}:${key}`).not.toBe("");
    }
  });

  it("interpolates variables", () => {
    expect(translator("en")("increase", { name: "Moss" })).toBe("Increase Moss");
    expect(translator("zh-HK")("not_found", { id: "pay_1" })).toBe("找不到付款 pay_1。");
  });
});
