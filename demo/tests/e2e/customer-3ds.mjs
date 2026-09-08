/** Customer form validation, cardholder prefill, 3DS challenge / not-authenticated / frictionless paths. */
import { BASE, SHOTS, check, finish, openPage, freshStore, addButton, checkoutButton, marketButton, fillCard, clickFlowPay, complete3ds, waitForOutcome, getPayment } from "./lib.mjs";
const { browser, page } = await openPage();
const sessions = [];
page.on("request", (r) => { if (r.url().endsWith("/api/payment-sessions") && r.method() === "POST") sessions.push(JSON.parse(r.postData())); });
async function cardholderValue() {
  for (const f of page.frames()) { const el = await f.$("#cardholder-name"); if (el) return el.inputValue(); }
  return null;
}
async function fresh() {
  await freshStore(page);
  await addButton(page).nth(2).click(); // Paper 149
}

await fresh();
await checkoutButton(page).click();
check("empty customer shows both field errors", (await page.locator(".field-error").count()) === 2);
check("no session requested with invalid customer", sessions.length === 0);
check("Checkout disabled while invalid after first attempt", await checkoutButton(page).isDisabled());
await page.getByLabel(/^(Full name|Volledige naam|姓名)/).fill("Jia Tsang");
await page.getByLabel(/^(Email|E-mail|電郵)/).fill("jia.tsang@example.com");
check("errors clear when valid", (await page.locator(".field-error").count()) === 0);
await page.reload();
check("customer persists across reload", (await page.getByLabel(/^(Email|E-mail|電郵)/).inputValue()) === "jia.tsang@example.com");

await checkoutButton(page).click();
await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
await page.waitForTimeout(1500);
check("request body carries customer", sessions.at(-1).customer?.email === "jia.tsang@example.com");
check("form disabled while locked", await page.getByLabel(/^(Email|E-mail|電郵)/).isDisabled());
const ch = await cardholderValue();
check(`Flow cardholder prefilled ("${ch}")`, ch === "Jia Tsang");

await fillCard(page, { name: null, number: "4010061700000021" });
await clickFlowPay(page);
const challenged = await complete3ds(page);
check("3DS challenge was presented and completed", challenged);
const out = await waitForOutcome(page);
check(`arrived via redirect on success page (${out.path})`, out.path === "redirect" && page.url().includes("/success"));
await page.waitForSelector("[data-testid=payment-details]", { timeout: 20000 });
const p = await getPayment(out.paymentId);
check(`payment 3ds challenged=${p["3ds"]?.challenged} eci=${p["3ds"]?.eci} status=${p.status}`, p["3ds"]?.challenged === true && p.approved);
check(`payment customer email attached (${p.customer?.email})`, p.customer?.email === "jia.tsang@example.com");
check(`cardholder name on source (${p.source?.name})`, p.source?.name === "Jia Tsang");

await fresh();
await page.getByLabel(/^(Full name|Volledige naam|姓名)/).fill("Jia Tsang");
await page.getByLabel(/^(Email|E-mail|電郵)/).fill("jia.tsang@example.com");
await checkoutButton(page).click();
await fillCard(page, { name: null, number: "4243754271700719" });
await clickFlowPay(page);
await complete3ds(page);
await waitForOutcome(page);
check(`3DS not-authenticated lands on failure page (${page.url().replace(/\?.*/, "")})`, page.url().includes("/failure"));
await page.waitForTimeout(1500);
const ftext = (await page.locator("main").innerText()).replace(/\s+/g, " ");
console.log("failure page:", ftext.slice(0, 300));
await page.getByRole("link", { name: /Back to cart|Terug naar winkelwagen|返回購物車/ }).click();
await page.waitForURL(`${BASE}/`);
check("cart kept after 3DS failure", (await page.getByTestId("cart-total").innerText()) === "HK$149.00");

await marketButton(page, "NL").click();
await checkoutButton(page).click();
await fillCard(page, { name: null, number: "4485040371536584" });
await clickFlowPay(page);
const ch2 = await complete3ds(page, 20000);
const out3 = await waitForOutcome(page);
const p3 = await getPayment(out3.paymentId);
check(`NL frictionless: no challenge (${!ch2}), ${p3.amount} ${p3.currency} ${p3.status}, 3ds enrolled=${p3["3ds"]?.enrolled}`, !ch2 && p3.currency === "EUR" && p3.approved);
await page.screenshot({ path: `${SHOTS}customer-3ds.png`, fullPage: true });
await finish(browser);
