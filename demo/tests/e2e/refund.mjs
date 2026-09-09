/** Pay by card, then refund part of it and the rest from the success page; statuses verified via the API. */
import { addButton, check, checkoutButton, clickFlowPay, complete3ds, fillCard, fillCustomer, finish, freshStore, getPayment, openPage, waitForOutcome } from "./lib.mjs";

const { browser, page } = await openPage();
await freshStore(page);
await addButton(page).nth(0).click(); // HK$199.00
await fillCustomer(page);
await checkoutButton(page).click();
await fillCard(page);
await clickFlowPay(page);
await complete3ds(page);
const { paymentId } = await waitForOutcome(page);
await page.waitForSelector("[data-testid=payment-details]", { timeout: 20000 });

const form = page.getByTestId("refund-form");
check("refund form shown for a captured payment", (await form.count()) === 1);
check("default amount is the full payment", (await form.locator("input").inputValue()) === "199.00");

await form.locator("input").fill("250");
check("amount above the refundable total disables the button", await form.getByRole("button").isDisabled());

await form.locator("input").fill("50.00");
await form.getByRole("button").click();
await page.getByText(/Refund accepted/).waitFor({ timeout: 30000 });
await page.getByTestId("payment-details").getByText("Partially Refunded").waitFor({ timeout: 30000 });
await page.waitForTimeout(500);
const details = (await page.getByTestId("payment-details").innerText()).replace(/\s+/g, " ");
check(`partial refund: ${details.match(/Status (\S+ ?\S*)/)?.[1]}`, /Partially Refunded/.test(details) && /Refunded so far HK\$50\.00/.test(details));
const p1 = await getPayment(paymentId);
check(`API status after partial refund: ${p1.status}`, p1.status === "Partially Refunded");

const form2 = page.getByTestId("refund-form");
await page.waitForFunction(() => document.querySelector("[data-testid=refund-form] input")?.value === "149.00", null, { timeout: 15000 }).catch(() => {});
check("remaining refundable defaults to HK$149.00", (await form2.locator("input").inputValue()) === "149.00");
await form2.getByRole("button").click();
await page.getByText(/Refund accepted/).waitFor({ timeout: 30000 });
await page.getByTestId("payment-details").getByText(/^Refunded$/).waitFor({ timeout: 30000 });
await page.waitForTimeout(500);
check("refund form gone once fully refunded", (await page.getByTestId("refund-form").count()) === 0);
const p2 = await getPayment(paymentId);
check(`API status after full refund: ${p2.status}`, p2.status === "Refunded");
await page.screenshot({ path: `tests/e2e/screenshots/refund.png`, fullPage: true });
await finish(browser);
