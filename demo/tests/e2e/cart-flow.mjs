/** Products, cart persistence, locked checkout, edit cart, and a card payment for the cart total. */
import { BASE, SHOTS, check, finish, openPage, fillCustomer, addButton, checkoutButton, editCartButton, fillCard, clickFlowPay, complete3ds, waitForOutcome, getPayment } from "./lib.mjs";
const { browser, page } = await openPage();
const total = () => page.getByTestId("cart-total").innerText();

await page.goto(BASE);
await addButton(page).nth(0).click(); // Moss 199
await addButton(page).nth(0).click(); // Moss x2
await addButton(page).nth(3).click(); // Tri Grip 249
check("total after adds is HK$647.00", (await total()) === "HK$647.00");

await page.reload();
check("cart survives reload", (await total()) === "HK$647.00");

await fillCustomer(page);
await checkoutButton(page).click();
await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
check("Add buttons disabled while locked", await addButton(page).nth(0).isDisabled());
check("quantity controls hidden while locked", (await page.getByLabel(/Increase/).count()) === 0);

await page.reload();
await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
check("locked checkout survives reload with Flow mounted", true);

await editCartButton(page).click();
check("Flow removed after Edit cart", (await page.locator("#flow-container iframe").count()) === 0);
await page.getByLabel("Decrease Moss Silicone Case").click();
check("total after decrease is HK$448.00", (await total()) === "HK$448.00");

await fillCustomer(page);
await checkoutButton(page).click();
await fillCard(page);
await clickFlowPay(page);
await complete3ds(page);
const outcome = await waitForOutcome(page);
console.log("outcome:", outcome);
const payment = await getPayment(outcome.paymentId);
check(`payment amount 44800 HKD approved (got ${payment.amount} ${payment.currency} ${payment.status})`,
  payment.amount === 44800 && payment.currency === "HKD" && payment.approved === true);
console.log("reference:", payment.reference);
await page.screenshot({ path: `${SHOTS}cart-flow.png`, fullPage: true });
await finish(browser);
