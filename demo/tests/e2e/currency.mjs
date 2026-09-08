/** Currency choice per market: USD prices, session currency, iDEAL only in EUR, and a USD card payment. */
import { addButton, check, checkoutButton, clickFlowPay, complete3ds, fillCard, fillCustomer, finish, freshStore, getPayment, marketButton, openPage, waitForOutcome } from "./lib.mjs";

const { browser, page } = await openPage();
const total = () => page.getByTestId("cart-total").innerText();
const options = async () => page.getByTestId("currency").locator("option").allInnerTexts();
const sessions = [];
page.on("request", (r) => { if (r.url().endsWith("/api/payment-sessions") && r.method() === "POST") sessions.push(JSON.parse(r.postData())); });
const flowMethods = async () => {
  await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
  await page.waitForTimeout(1500);
  return (await page.locator("#flow-container [data-testid$='AccordionButton']").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
};

await freshStore(page);
check(`HK currency options ${JSON.stringify(await options())}`, JSON.stringify(await options()) === '["HKD","USD"]');
await addButton(page).nth(0).click();
check("HK default HKD total", (await total()) === "HK$199.00");
await page.getByTestId("currency").selectOption("USD");
check("HK USD price list", (await total()) === "US$25.99");
await page.reload();
check("currency persists", (await page.getByTestId("currency").inputValue()) === "USD");

await marketButton(page, "NL").click();
check("market switch resets currency to EUR", (await page.getByTestId("currency").inputValue()) === "EUR");
check(`NL currency options ${JSON.stringify(await options())}`, JSON.stringify(await options()) === '["EUR","USD"]');
await fillCustomer(page);
await checkoutButton(page).click();
const eur = await flowMethods();
check(`NL/EUR Flow shows ${JSON.stringify(eur)} incl. iDEAL`, eur.some((m) => /ideal/i.test(m)));
await page.getByTestId("currency").selectOption("USD");
check("changing currency unlocks the checkout", (await page.locator("#flow-container iframe").count()) === 0);
await checkoutButton(page).click();
const usd = await flowMethods();
check(`NL/USD Flow shows ${JSON.stringify(usd)} without iDEAL`, !usd.some((m) => /ideal/i.test(m)));
check("session request carries currency USD", sessions.at(-1).currency === "USD");

await fillCard(page, { name: null });
await clickFlowPay(page);
await complete3ds(page);
const outcome = await waitForOutcome(page);
const payment = await getPayment(outcome.paymentId);
check(`USD payment ${payment.amount} ${payment.currency} ${payment.status}`, payment.currency === "USD" && payment.amount === 2599 && payment.approved);
await page.waitForSelector("[data-testid=payment-details]", { timeout: 20000 });
check("success page shows US$25.99", /US\$\s?25\.99|\$\s?25,99|25\.99/.test(await page.locator("main").innerText()));
await finish(browser);
