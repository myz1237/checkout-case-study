"use client";

import { LOCALES, type LocaleId } from "@/lib/locales";

type Props = { value: LocaleId; options: readonly string[]; label: string; onChange: (id: LocaleId) => void };

export default function LanguageSelect({ value, options, label, onChange }: Props) {
  return (
    <label className="language">
      <span className="visually-hidden">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as LocaleId)} aria-label={label} data-testid="language">
        {options.map((id) => (
          <option key={id} value={id}>
            {LOCALES[id as LocaleId]?.label ?? id}
          </option>
        ))}
      </select>
    </label>
  );
}
