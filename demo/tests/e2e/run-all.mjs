/** Runs every end-to-end scenario against a running storefront (`pnpm dev`) and prints a summary. */
import { spawnSync } from "node:child_process";
import { BASE } from "./lib.mjs";

const SCENARIOS = ["cart-flow", "market-matrix", "currency", "outcome-pages", "customer-3ds", "language", "page-i18n", "ideal"];
const only = process.argv.slice(2);
const list = only.length ? SCENARIOS.filter((s) => only.includes(s)) : SCENARIOS;

try {
  await fetch(BASE);
} catch {
  console.error(`No storefront at ${BASE}. Start it with \`pnpm dev\` (or set E2E_BASE_URL).`);
  process.exit(2);
}

const results = [];
for (const name of list) {
  console.log(`\n=== ${name} ===`);
  const r = spawnSync(process.execPath, [new URL(`./${name}.mjs`, import.meta.url).pathname], { stdio: "inherit", env: process.env });
  results.push({ name, ok: r.status === 0 });
}
console.log("\nSummary");
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"} ${r.name}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
