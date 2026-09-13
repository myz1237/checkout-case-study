/** Pay by card, then refund from the staff area (/admin, Basic Auth): partial refund, then the rest. */
import { chromium } from "playwright";
import { addButton, BASE, check, checkoutButton, clickFlowPay, complete3ds, fillCard, fillCustomer, finish, freshStore, getPayment, openPage, waitForOutcome } from "./lib.mjs";

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
const reference = (await page.getByTestId("payment-details").innerText()).match(/ORD-\d+/)?.[0];
check(`success page shows the order reference (${reference}) and no refund form`, Boolean(reference) && (await page.getByTestId("refund-form").count()) === 0);
check("success page tells the customer to contact support", (await page.getByText(/Need a refund\? Contact support/).count()) === 1);

// Staff area requires Basic Auth
const anon = await page.request.get(`${BASE}/admin`, { maxRedirects: 0 });
check(`/admin without credentials → ${anon.status()}`, anon.status() === 401 && /Basic/.test(anon.headers()["www-authenticate"] ?? ""));
const apiAnon = await page.request.post(`${BASE}/api/admin/refund`, { data: { paymentId, amount: 100 } });
check(`/api/admin/refund without credentials → ${apiAnon.status()}`, apiAnon.status() === 401);

const staff = await browser.newContext({ httpCredentials: { username: process.env.ADMIN_USER, password: process.env.ADMIN_PASSWORD } });
const admin = await staff.newPage();
await admin.goto(`${BASE}/admin`);
await admin.getByLabel(/Order reference or payment id/).fill(reference);
await admin.getByRole("button", { name: "Look up" }).click();
await admin.waitForSelector("[data-testid=admin-payment]", { timeout: 30000 });
await admin.waitForLoadState("networkidle");
await admin.waitForTimeout(800);
check("admin finds the payment by order reference", (await admin.getByTestId("admin-payment").innerText()).includes(paymentId));

const form = admin.getByTestId("refund-form");
check("refund form defaults to the full amount", (await form.locator("input").inputValue()) === "199.00");
await form.locator("input").fill("250");
check("amount above the refundable total disables the button", await form.getByRole("button").isDisabled());
await form.locator("input").fill("50.00");
await form.getByRole("button").click();
await admin.getByText(/Refund accepted/).waitFor({ timeout: 30000 });
await admin.getByTestId("payment-details").getByText("Partially Refunded").waitFor({ timeout: 30000 });
await admin.waitForTimeout(500);
const adminText = (await admin.getByTestId("admin-payment").innerText()).replace(/\s+/g, " ");
check("partial refund reflected in the admin view", /Refunded so far HK\$50\.00/.test(adminText));
check(`API status after partial refund: ${(await getPayment(paymentId)).status}`, (await getPayment(paymentId)).status === "Partially Refunded");

await admin.waitForFunction(() => document.querySelector("[data-testid=refund-form] input")?.value === "149.00", null, { timeout: 15000 }).catch(() => {});
const form2 = admin.getByTestId("refund-form");
check("remaining refundable defaults to HK$149.00", (await form2.locator("input").inputValue()) === "149.00");
await form2.getByRole("button").click();
await admin.getByText(/Refund accepted/).waitFor({ timeout: 30000 });
await admin.getByTestId("payment-details").getByText(/^Refunded$/).waitFor({ timeout: 30000 });
await admin.waitForTimeout(500);
check("refund form gone once fully refunded", (await admin.getByTestId("refund-form").count()) === 0);
check(`API status after full refund: ${(await getPayment(paymentId)).status}`, (await getPayment(paymentId)).status === "Refunded");

await page.reload();
await page.waitForSelector("[data-testid=payment-details]");
check("customer's success page now shows Refunded", /Refunded/.test(await page.getByTestId("payment-details").innerText()));
await admin.screenshot({ path: `tests/e2e/screenshots/admin-refund.png`, fullPage: true });
await staff.close();
await finish(browser);
