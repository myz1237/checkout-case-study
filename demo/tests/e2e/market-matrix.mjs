/** HK/NL switch: currency, per-market payment methods on the session token and in Flow, EUR card payment. */
import { SHOTS, check, finish, openPage, freshStore, fillCustomer, addButton, checkoutButton, marketButton, fillCard, clickFlowPay, complete3ds, waitForOutcome, getPayment } from "./lib.mjs";
const { browser, page } = await openPage();
const decode = (session) => {
  let tok = session.payment_session_token.split(":")[1];
  tok += "=".repeat((4 - (tok.length % 4)) % 4);
  return JSON.parse(Buffer.from(tok, "base64").toString());
};
const sessions = [];
page.on("response", async (r) => {
  if (r.url().endsWith("/api/payment-sessions") && r.ok()) sessions.push(decode((await r.json()).session));
});
const flowMethods = async () => (await page.locator("#flow-container [data-testid$='AccordionButton']").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());

await freshStore(page);
await addButton(page).nth(0).click();
check("HK default total HK$199.00", (await page.getByTestId("cart-total").innerText()) === "HK$199.00");

await fillCustomer(page);
await checkoutButton(page).click();
await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
await page.waitForTimeout(1500);
const hk = sessions.at(-1);
check(`HK session methods ${JSON.stringify(hk.payment_methods.map((m) => m.type))} == card,applepay`,
  JSON.stringify(hk.payment_methods.map((m) => m.type)) === '["card","applepay"]');
check(`HK session currency ${hk.currency} country ${hk.payment_methods[0].billing_address?.country}`, hk.currency === "HKD");
const hkUi = await flowMethods();
check(`HK Flow shows ${JSON.stringify(hkUi)}; no Google Pay`, !hkUi.some((t) => /google/i.test(t)));

await marketButton(page, "NL").click();
check("switching market while locked unlocks and removes Flow", (await page.locator("#flow-container iframe").count()) === 0 && (await checkoutButton(page).count()) === 1);
const nlTotal = await page.getByTestId("cart-total").innerText();
check(`NL total shown in EUR (${nlTotal})`, /24,95/.test(nlTotal) && nlTotal.includes("€"));
await page.reload();
check("market persists across reload", await marketButton(page, "NL").getAttribute("aria-pressed") === "true");

await fillCustomer(page);
await checkoutButton(page).click();
await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
await page.waitForTimeout(1500);
const nl = sessions.at(-1);
const nlTypes = nl.payment_methods.map((m) => m.type);
console.log("NL session methods:", nlTypes, "currency:", nl.currency, "locale:", nl.locale);
check("NL session has card + applepay", nlTypes.includes("card") && nlTypes.includes("applepay"));
check("NL session has ideal (NL credentials point at the account with iDEAL)", nlTypes.includes("ideal"));
check("NL session has no googlepay/sofort", !nlTypes.includes("googlepay") && !nlTypes.includes("sofort"));
const nlUi = await flowMethods();
check(`NL Flow shows ${JSON.stringify(nlUi)}; no Google Pay`, !nlUi.some((t) => /google/i.test(t)));

await fillCard(page);
await clickFlowPay(page);
await complete3ds(page);
const outcome = await waitForOutcome(page);
const payment = await getPayment(outcome.paymentId);
check(`NL payment ${payment.amount} ${payment.currency} ${payment.status}`, payment.amount === 2495 && payment.currency === "EUR" && payment.approved);
await page.screenshot({ path: `${SHOTS}market-nl.png`, fullPage: true });
await finish(browser);
