/** Page copy and outcome pages in zh-HK and nl, html lang via cookie. */
import { BASE, check, finish, openPage, freshStore, addButton, marketButton, fillCard, clickFlowPay, complete3ds, waitForOutcome } from "./lib.mjs";
const { browser, page } = await openPage();
const text = async () => (await page.locator("main").innerText()).replace(/\s+/g, " ");

await freshStore(page);
await addButton(page).nth(0).click();
await page.getByTestId("language").selectOption("zh-HK");
await page.waitForTimeout(300);
let t = await text();
check("zh-HK page copy: 購物車 / 結帳 / 加入 / 姓名", /購物車/.test(t) && /結帳/.test(t) && /加入/.test(t) && /姓名/.test(t));
check("zh-HK html lang after reload", (await (await page.reload(), page.getAttribute("html", "lang"))) === "zh-HK");
await page.getByRole("button", { name: "結帳" }).click();
check("zh-HK validation messages", (await page.locator(".field-error").allInnerTexts()).join("|") === "請輸入姓名|請輸入有效的電郵地址");
await page.getByLabel("姓名").fill("陳大文");
await page.getByLabel("電郵").fill("chan@example.com");
await page.getByRole("button", { name: "結帳" }).click();
await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
check("zh-HK edit cart button", (await page.getByRole("button", { name: "修改購物車" }).count()) === 1);

await fillCard(page, { name: null, number: "4010061700000021" });
await clickFlowPay(page);
await complete3ds(page);
await waitForOutcome(page);
await page.waitForSelector("[data-testid=payment-details]", { timeout: 20000 });
t = await text();
check("zh-HK success page", /訂單已確認/.test(t) && /狀態/.test(t) && /繼續購物/.test(t));
console.log(t.slice(0, 200));

await page.goto(BASE);
await marketButton(page, "HK").click(); // ensure HK then switch to NL
await marketButton(page, "NL").click();
await page.waitForTimeout(300);
t = await text();
check("nl page copy: Je winkelwagen / Toevoegen / Afrekenen", /Je winkelwagen/.test(t) && /Toevoegen/.test(t));
await page.getByRole("button", { name: "Toevoegen" }).nth(0).click();
check("nl checkout button present", (await page.getByRole("button", { name: "Afrekenen" }).count()) === 1);
await page.getByTestId("language").selectOption("en");
await page.waitForTimeout(300);
t = await text();
check("back to English copy", /Your cart/.test(t) && /Checkout/.test(t));
await finish(browser);
