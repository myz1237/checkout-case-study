"use client";

import { MARKETS, type MarketId } from "@/lib/markets";

type Props = { value: MarketId; onChange: (id: MarketId) => void };

export default function MarketSwitch({ value, onChange }: Props) {
  return (
    <div className="segmented" role="group" aria-label="Market">
      {Object.values(MARKETS).map((m) => (
        <button
          key={m.id}
          type="button"
          className={m.id === value ? "active" : ""}
          aria-pressed={m.id === value}
          onClick={() => onChange(m.id)}
        >
          {m.label} · {m.currency}
        </button>
      ))}
    </div>
  );
}
