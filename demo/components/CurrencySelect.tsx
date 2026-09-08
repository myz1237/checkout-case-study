"use client";

import type { Currency } from "@/lib/catalog";

type Props = { value: Currency; options: readonly Currency[]; label: string; disabled?: boolean; onChange: (c: Currency) => void };

export default function CurrencySelect({ value, options, label, disabled, onChange }: Props) {
  return (
    <label className="language">
      <span className="visually-hidden">{label}</span>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value as Currency)} aria-label={label} data-testid="currency">
        {options.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
  );
}
