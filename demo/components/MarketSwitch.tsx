"use client";

import type { Translate } from "@/lib/i18n";
import { MARKETS, type MarketId } from "@/lib/markets";

type Props = { value: MarketId; disabled?: boolean; t: Translate; onChange: (id: MarketId) => void };

export default function MarketSwitch({ value, disabled, t, onChange }: Props) {
  return (
    <div className="segmented" role="group" aria-label={t("market")}>
      {Object.values(MARKETS).map((m) => (
        <button
          key={m.id}
          type="button"
          className={m.id === value ? "active" : ""}
          aria-pressed={m.id === value}
          disabled={disabled}
          onClick={() => onChange(m.id)}
        >
          {t(`market_${m.id}`)}
        </button>
      ))}
    </div>
  );
}
