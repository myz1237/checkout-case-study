/** Save a card on the first purchase, then pay with the saved card (no CVV) on the next visit with the same email. */
import { addButton, check, checkoutButton, clickFlowPay, complete3ds, fillCard, fillCustomer, finish, freshStore, getPayment, openPage, waitForOutcome } from "./lib.mjs";

const email = `saved-${Date.now()}@example.com`;
const { browser, page } = await openPage();

await freshStore(page);
await addButton(page).nth(0).click();
await fillCustomer(page, "Jia Tsang", email);
await checkoutButton(page).click();
await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
await page.waitForTimeout(1500);
check("first visit shows no saved cards", (await page.getByText(/Saved cards/).count()) === 0);
check("first visit offers to save the card", (await page.locator("#shouldSaveCardAtMerchant").count()) === 1);
await fillCard(page, { name: null });
await page.getByText("Save card details for future purchases").click();
check("consent ticked", await page.locator("#shouldSaveCardAtMerchant").isChecked());
await clickFlowPay(page);
await complete3ds(page);
const first = await waitForOutcome(page);
const firstPayment = await getPayment(first.paymentId);
check(`first payment ${firstPayment.status}, customer ${firstPayment.customer?.id ?? "?"}`, firstPayment.approved && Boolean(firstPayment.customer?.id));

await page.goto(page.url().replace(/\/success.*/, "/"));
await addButton(page).nth(1).click();
await fillCustomer(page, "Jia Tsang", email);
await checkoutButton(page).click();
await page.waitForSelector("#flow-container [data-testid$='AccordionButton']", { timeout: 30000 });
await page.waitForTimeout(2000);
const text = (await page.locator("#flow-container").innerText()).replace(/\s+/g, " ");
check("second visit lists the saved card", /Saved cards/.test(text) && /4242/.test(text));
check("saved card is preselected with a Pay button and no CVV field", (await page.locator("#flow-container").getByRole("button", { name: /^(Pay|Betalen|付款)/ }).count()) >= 1 && !/Security code/.test(text.split("Saved cards")[0]));
await page.locator("#flow-container").getByRole("button", { name: /^(Pay|Betalen|付款)/ }).first().click();
await complete3ds(page);
const second = await waitForOutcome(page);
const secondPayment = await getPayment(second.paymentId);
check(`second payment ${secondPayment.status} with stored card ${secondPayment.source?.id ?? "?"}`, secondPayment.approved && secondPayment.source?.id === firstPayment.source?.id);
await page.waitForSelector("[data-testid=payment-details]", { timeout: 20000 });
check("success page shows the card", /Visa •••• 4242/.test(await page.locator("main").innerText()));
await finish(browser);
