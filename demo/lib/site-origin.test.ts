import { afterEach, describe, expect, it } from "vitest";
import { siteOrigin } from "./site-origin";

const req = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

describe("siteOrigin", () => {
  afterEach(() => {
    delete process.env.SITE_URL;
  });

  it("prefers SITE_URL when set", () => {
    process.env.SITE_URL = "https://shop.example/";
    expect(siteOrigin(req("http://localhost:3000/api/x", { host: "localhost:3000" }))).toBe("https://shop.example");
  });

  it("uses forwarded headers behind a proxy", () => {
    expect(siteOrigin(req("http://localhost:3000/api/x", { "x-forwarded-host": "shop.example", "x-forwarded-proto": "https" }))).toBe("https://shop.example");
  });

  it("falls back to the host header, then the request url", () => {
    expect(siteOrigin(req("http://localhost:3000/api/x", { host: "localhost:3000" }))).toBe("http://localhost:3000");
    expect(siteOrigin(req("http://localhost:3000/api/x"))).toBe("http://localhost:3000");
  });
});
