import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const BASE = {
  CKO_SECRET_KEY: "sk_default",
  CKO_PROCESSING_CHANNEL_ID: "pc_default",
  NEXT_PUBLIC_CKO_PUBLIC_KEY: "pk_default",
};

describe("credentials", () => {
  beforeEach(() => {
    Object.assign(process.env, BASE);
    delete process.env.CKO_NL_SECRET_KEY;
    delete process.env.CKO_NL_PROCESSING_CHANNEL_ID;
    delete process.env.CKO_NL_PUBLIC_KEY;
  });
  afterEach(() => vi.resetModules());

  it("uses the default set when a market has no override", async () => {
    const { credentialsFor, allCredentials } = await import("@/lib/credentials");
    expect(credentialsFor("NL").secretKey).toBe("sk_default");
    expect(credentialsFor("HK").market).toBe("default");
    expect(allCredentials(["HK", "NL"])).toHaveLength(1);
  });

  it("uses the market override when fully configured", async () => {
    process.env.CKO_NL_SECRET_KEY = "sk_nl";
    process.env.CKO_NL_PROCESSING_CHANNEL_ID = "pc_nl";
    process.env.CKO_NL_PUBLIC_KEY = "pk_nl";
    const { credentialsFor, allCredentials } = await import("@/lib/credentials");
    expect(credentialsFor("NL")).toEqual({ market: "NL", secretKey: "sk_nl", processingChannelId: "pc_nl", publicKey: "pk_nl" });
    expect(credentialsFor("HK").secretKey).toBe("sk_default");
    expect(allCredentials(["HK", "NL"]).map((c) => c.market)).toEqual(["default", "NL"]);
  });

  it("refuses a partial override", async () => {
    process.env.CKO_NL_SECRET_KEY = "sk_nl";
    const { credentialsFor } = await import("@/lib/credentials");
    expect(() => credentialsFor("NL")).toThrow(/Incomplete/);
  });
});
