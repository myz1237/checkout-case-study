/** NL market → iDEAL → test bank TESTNL2A → simulator (IDEAL_OUTCOME, default SUCCESS) → our outcome page. Skipped when the account lacks iDEAL. */
import { BASE, SHOTS, check, finish, openPage, freshStore, fillCustomer, addButton, checkoutButton, marketButton, getPayment } from "./lib.mjs";

const wanted = (process.env.IDEAL_OUTCOME ?? "SUCCESS").toUpperCase();
const { browser, page } = await openPage();

await freshStore(page);
await marketButton(page, "NL").click();
await addButton(page).nth(0).click();
await fillCustomer(page);
await checkoutButton(page).click();
await page.waitForSelector("#flow-container iframe", { timeout: 30000 });
await page.waitForTimeout(2000);

if ((await page.getByTestId("idealAccordionButton").count()) === 0) {
  console.log("SKIP iDEAL is not enabled on the account behind the NL credentials");
  await finish(browser);
}

await page.getByTestId("idealAccordionButton").click();
await page.getByTestId("idealAccordionPanel").getByRole("button", { name: /Betalen|Pay|iDEAL/ }).first().click();
await page.waitForURL((u) => !u.href.startsWith(BASE), { timeout: 30000 });
check(`redirected to iDEAL (${new URL(page.url()).host})`, /ideal\.nl/.test(page.url()));

await page.getByText(/Select your bank/i).first().click();
await Promise.all([
  page.waitForURL((u) => !/ext\.pay\.ideal\.nl/.test(u.href), { timeout: 30000 }).catch(() => {}),
  page.getByRole("button", { name: "TESTNL2A" }).first().click(),
]);
await page.waitForLoadState("networkidle").catch(() => {});
const simulator = page.getByRole("button", { name: wanted }).first();
check(`simulator offers ${wanted}`, (await simulator.count()) === 1);
await simulator.click();
await page.waitForURL(/\/(success|failure)/, { timeout: 60000 });
await page.waitForSelector("[data-testid=payment-details]", { timeout: 20000 });
check("redirect URL keeps market=NL", /market=NL/.test(page.url()));

const id = page.url().match(/cko-payment-id=([^&]+)/)?.[1];
const payment = await getPayment(id);
const text = (await page.locator("main").innerText()).replace(/\s+/g, " ");
if (wanted === "SUCCESS") {
  check(`success page for iDEAL payment (${payment.status} ${payment.amount} ${payment.currency})`, page.url().includes("/success") && payment.approved && /iDEAL/.test(text));
} else {
  check(`failure page for iDEAL payment (${payment.status})`, page.url().includes("/failure") && !payment.approved && /iDEAL/.test(text));
}
await page.screenshot({ path: `${SHOTS}ideal-${wanted.toLowerCase()}.png`, fullPage: true });
await finish(browser);
