import { describe, expect, it } from "vitest";
import { isCustomerValid, normalizeCustomer, validateCustomer } from "./customer";

describe("customer", () => {
  it("requires a name of at least two characters and a plausible email", () => {
    expect(validateCustomer({ name: "", email: "" })).toEqual({ name: "Enter your full name", email: "Enter a valid email address" });
    expect(validateCustomer({ name: "Jia Tsang", email: "jia@example.com" })).toEqual({});
    expect(isCustomerValid({ name: "J", email: "jia@example.com" })).toBe(false);
    expect(isCustomerValid({ name: "Jia", email: "jia@example" })).toBe(false);
  });

  it("normalises whitespace and email case", () => {
    expect(normalizeCustomer({ name: "  Jia   Tsang ", email: " Jia@Example.COM " })).toEqual({ name: "Jia Tsang", email: "jia@example.com" });
  });
});
