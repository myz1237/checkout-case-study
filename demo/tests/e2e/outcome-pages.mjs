/** Success page (sync path), unknown/missing ids, failure page with decline reason, inline decline in Flow. */
import { BASE, SHOTS, check, finish, openPage, freshStore, fillCustomer, addButton, checkoutButton, fillCard, clickFlowPay, complete3ds, waitForOutcome, createDeclinedPayment } from "./lib.mjs";
const { browser, page } = await openPage();

// 1. synchronous success lands on /success with details, cart cleared
await freshStore(page);
await addButton(page).nth(1).click(); // Forest 299
await fillCustomer(page);
await checkoutButton(page).click();
await fillCard(page);
await clickFlowPay(page);
await complete3ds(page);
await waitForOutcome(page);
await page.waitForSelector("[data-testid=payment-details]", { timeout: 20000 });
const details = await page.getByTestId("payment-details").innerText();
console.log("---\n" + details + "\n---");
check("success page shows Captured/Authorized", /Captured|Authorized/.test(details));
check("success page shows HK$299.00", details.includes("HK$299.00"));
check("success page shows card scheme and last4", /Card \(Visa •••• 4242\)/.test(details));
check("success page shows order reference", /ORD-\d+/.test(details));
await page.getByRole("link", { name: /Continue shopping|Verder winkelen|繼續購物/ }).click();
await page.waitForURL(`${BASE}/`);
check("cart cleared after success", (await page.getByText(/Your cart is empty|winkelwagen is leeg|購物車是空的/).count()) === 1);

// 2. unknown id
await page.goto(`${BASE}/success?cko-payment-id=pay_aaaaaaaaaaaaaaaaaaaaaaaaaa`);
check("unknown id handled", (await page.getByText(/could not find payment/).count()) === 1);
await page.goto(`${BASE}/success`);
check("missing id handled", (await page.getByText(/No payment reference/).count()) === 1);

// 3. failure page with a declined payment; cart kept
const declined = await createDeclinedPayment();
console.log("declined payment:", declined.id, declined.status, declined.response_summary);
await page.goto(BASE);
await addButton(page).nth(0).click();
await fillCustomer(page);
await checkoutButton(page).click();
await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
await page.goto(`${BASE}/failure?cko-payment-id=${declined.id}`);
const fdetails = await page.getByTestId("payment-details").innerText();
check("failure page shows Declined and reason", /Declined/.test(fdetails) && /Insufficient/i.test(fdetails));
await page.getByRole("link", { name: /Back to cart|Terug naar winkelwagen|返回購物車/ }).click();
await page.waitForURL(`${BASE}/`);
check("cart kept and unlocked after failure", (await page.getByTestId("cart-total").innerText()) === "HK$199.00" && (await checkoutButton(page).count()) === 1);

// 4. declined card through Flow (synchronous path): what does the customer see?
await fillCustomer(page);
await checkoutButton(page).click();
await fillCard(page, { number: "4544249167673670" });
await clickFlowPay(page);
await page.waitForTimeout(8000);
console.log("after Flow decline, url:", page.url());
console.log("page text excerpt:", (await page.locator("main").innerText()).replace(/\s+/g, " ").slice(0, 400));
await page.screenshot({ path: `${SHOTS}flow-decline.png`, fullPage: true });
await finish(browser);
