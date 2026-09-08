import "server-only";
import type { MarketId } from "./markets";

/** Checkout.com credentials resolved per market: the default set, or a `CKO_<MARKET>_*` override. */
export type Credentials = {
  market: MarketId | "default";
  secretKey: string;
  processingChannelId: string;
  publicKey: string;
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function defaultCredentials(): Credentials {
  return {
    market: "default",
    secretKey: required("CKO_SECRET_KEY"),
    processingChannelId: required("CKO_PROCESSING_CHANNEL_ID"),
    publicKey: required("NEXT_PUBLIC_CKO_PUBLIC_KEY"),
  };
}

function overrideFor(market: MarketId): Credentials | null {
  const names = [`CKO_${market}_SECRET_KEY`, `CKO_${market}_PROCESSING_CHANNEL_ID`, `CKO_${market}_PUBLIC_KEY`];
  const values = names.map((n) => process.env[n]?.trim() ?? "");
  const set = values.filter(Boolean).length;
  if (set === 0) return null;
  if (set !== names.length) {
    throw new Error(`Incomplete credentials for market ${market}: set all of ${names.join(", ")} or none`);
  }
  return { market, secretKey: values[0], processingChannelId: values[1], publicKey: values[2] };
}

export function credentialsFor(market: MarketId): Credentials {
  return overrideFor(market) ?? defaultCredentials();
}

/** Every distinct credential set, default first: used when a payment's market is unknown. */
export function allCredentials(markets: MarketId[]): Credentials[] {
  const sets = [defaultCredentials(), ...markets.map(overrideFor).filter((c): c is Credentials => c !== null)];
  const seen = new Set<string>();
  return sets.filter((c) => (seen.has(c.secretKey) ? false : (seen.add(c.secretKey), true)));
}
