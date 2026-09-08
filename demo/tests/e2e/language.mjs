/** Language options per market and Flow re-rendering in en, zh-HK and nl. */
import { SHOTS, check, finish, openPage, freshStore, addButton, checkoutButton, marketButton } from "./lib.mjs";
const { browser, page } = await openPage();
const options = async () => page.getByTestId("language").locator("option").allInnerTexts();
const flowLabel = async () => {
  await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
  await page.waitForTimeout(2500);
  const accordion = (await page.locator("#flow-container [data-testid$='AccordionButton']").allInnerTexts()).join(" ").replace(/\s+/g, " ").trim();
  let cardholder = null;
  for (const f of page.frames()) { const el = await f.$("#cardholder-name"); if (el) cardholder = await el.getAttribute("aria-label"); }
  return `${accordion} | ${cardholder}`;
};
const sessionIds = [];
page.on("response", async (r) => { if (r.url().endsWith("/api/payment-sessions") && r.ok()) sessionIds.push((await r.json()).id); });

await freshStore(page);
check(`HK options ${JSON.stringify(await options())}`, JSON.stringify(await options()) === '["English","繁體中文（香港）"]');
check("HK default en", (await page.getByTestId("language").inputValue()) === "en");

await addButton(page).nth(0).click();
await page.getByLabel(/^(Full name|Volledige naam|姓名)/).fill("Jia Tsang");
await page.getByLabel(/^(Email|E-mail|電郵)/).fill("jia@example.com");
await checkoutButton(page).click();
const en = await flowLabel();
check(`Flow in English: ${en}`, /Card/.test(en) && /Cardholder/.test(en));

await page.getByTestId("language").selectOption("zh-HK");
await page.waitForTimeout(500);
const zh = await flowLabel();
check(`Flow in zh-HK: ${zh}`, /[一-鿿]/.test(zh));
check("same session reused after language change", sessionIds.length === 1);
check("price in zh-HK still HK$199.00", (await page.getByTestId("cart-total").innerText()) === "HK$199.00");
await page.reload();
check("language persists", (await page.getByTestId("language").inputValue()) === "zh-HK");

await marketButton(page, "NL").click();
check(`NL options ${JSON.stringify(await options())}`, JSON.stringify(await options()) === '["Nederlands","English"]');
check("NL resets to nl", (await page.getByTestId("language").inputValue()) === "nl");
check("NL price in Dutch format", /€\s24,95/.test(await page.getByTestId("cart-total").innerText()));
await checkoutButton(page).click();
const nl = await flowLabel();
check(`Flow in Dutch: ${nl}`, /Kaart|kaart/.test(nl));
await page.screenshot({ path: `${SHOTS}flow-nl.png`, fullPage: true });
await page.getByTestId("language").selectOption("en");
await page.waitForTimeout(500);
check("NL price in English format after switching to en", (await page.getByTestId("cart-total").innerText()) === "€24.95");
const nlEn = await flowLabel();
check(`Flow back to English in NL: ${nlEn}`, /Card/.test(nlEn));
await finish(browser);
