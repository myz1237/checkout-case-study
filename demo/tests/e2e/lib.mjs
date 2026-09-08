/** Shared Playwright helpers for the scenarios; they drive E2E_BASE_URL and make real sandbox payments. */
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

export const BASE = (process.env.E2E_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
export const SHOTS = new URL("./screenshots/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });

let failures = 0;
export const check = (label, ok) => {
  if (!ok) failures++;
  console.log(ok ? "PASS" : "FAIL", label);
};

/** Close the browser and exit non-zero if any check failed. */
export async function finish(browser) {
  await browser.close();
  if (failures > 0) {
    console.log(`${failures} check(s) failed`);
    process.exit(1);
  }
}

export async function openPage() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  page.on("pageerror", (e) => console.log("[pageerror]", e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && !/favicon|ERR_CONNECTION_CLOSED/.test(m.text())) console.log("[console.error]", m.text().slice(0, 300));
  });
  return { browser, page };
}

/** Open the storefront with a clean browser state. */
export async function freshStore(page) {
  await page.goto(BASE);
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.reload();
}

export async function fillCustomer(page, name = "Jia Tsang", email = "jia.tsang@example.com") {
  await page.getByLabel(/^(Full name|Volledige naam|姓名)/).fill(name);
  await page.getByLabel(/^(Email|E-mail|電郵)/).fill(email);
}

export const addButton = (page) => page.getByRole("button", { name: /^(Add|Toevoegen|加入)$/ });
export const checkoutButton = (page) => page.getByRole("button", { name: /^(Checkout|Afrekenen|結帳)$/ });
export const editCartButton = (page) => page.getByRole("button", { name: /^(Edit cart|Winkelwagen wijzigen|修改購物車)$/ });
export const marketButton = (page, id) =>
  page.getByRole("button", { name: id === "NL" ? /Netherlands|Nederland|荷蘭/ : /Hong Kong|Hongkong|香港/ });

/** Flow renders each secure field in its own iframe; find the one holding `id`. */
export async function fillFlowField(page, id, value) {
  for (const f of page.frames()) {
    const el = await f.$(`#${id}`);
    if (el) { await el.click(); await el.type(value, { delay: 15 }); return; }
  }
  throw new Error(`Flow field ${id} not found`);
}

export async function fillCard(page, { number = "4242424242424242", name = "Test Buyer", expiry = "1230", cvv = "100" } = {}) {
  await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
  await page.waitForTimeout(1500);
  if (name) await fillFlowField(page, "cardholder-name", name);
  await fillFlowField(page, "card-number", number);
  await fillFlowField(page, "card-expiry-date", expiry);
  await fillFlowField(page, "card-cvv", cvv);
}

export async function clickFlowPay(page) {
  await page.getByTestId("cardAccordionPanel").getByRole("button", { name: /^(Pay|Betalen|付款)/ }).click();
}

/** Complete the 3DS challenge simulator if it appears. Resolves true if a challenge was shown. */
export async function complete3ds(page, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const f of page.frames()) {
      try {
        const pw = await f.$('input[type="password"]');
        if (pw) {
          await pw.fill("Checkout1!");
          await f.getByRole("button", { name: /continue/i }).click();
          return true;
        }
      } catch {}
    }
    if (/\/(success|failure)/.test(page.url())) return false;
    await page.waitForTimeout(800);
  }
  return false;
}

/** Both sync (client navigation) and redirect flows end on /success or /failure with cko-payment-id. */
export async function waitForOutcome(page, timeoutMs = 60000) {
  await page.waitForURL(/\/(success|failure)/, { timeout: timeoutMs });
  const url = page.url();
  const m = url.match(/cko-payment-id=([^&]+)/);
  return { paymentId: m?.[1], path: /cko-session-id=/.test(url) ? "redirect" : "sync" };
}

const API = process.env.NEXT_PUBLIC_CKO_ENVIRONMENT === "production" ? "https://api.checkout.com" : "https://api.sandbox.checkout.com";

/** The payment may live on either account (per-market credentials); try each configured key. */
export async function getPayment(id) {
  for (const key of [process.env.CKO_SECRET_KEY, process.env.CKO_NL_SECRET_KEY].filter(Boolean)) {
    const res = await fetch(`${API}/payments/${id}`, { headers: { Authorization: `Bearer ${key}` } });
    if (res.ok) return res.json();
  }
  throw new Error(`payment ${id} not found on any configured account`);
}

/** Create a declined payment directly through the API (for the failure page scenario). */
export async function createDeclinedPayment() {
  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.CKO_SECRET_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      source: { type: "card", number: "4544249167673670", expiry_month: 12, expiry_year: 2030, cvv: "100" },
      amount: 1000, currency: "HKD", reference: "E2E-DECLINE", processing_channel_id: process.env.CKO_PROCESSING_CHANNEL_ID,
    }),
  });
  return res.json();
}
