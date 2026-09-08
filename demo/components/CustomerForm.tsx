"use client";

import { type Customer, validateCustomer } from "@/lib/customer";
import type { Translate } from "@/lib/i18n";

type Props = {
  value: Customer;
  disabled: boolean;
  showErrors: boolean;
  t: Translate;
  onChange: (next: Customer) => void;
};

export default function CustomerForm({ value, disabled, showErrors, t, onChange }: Props) {
  const errors = showErrors ? validateCustomer(value) : {};
  return (
    <div className="customer">
      <label>
        {t("full_name")}
        <input
          name="name"
          autoComplete="name"
          value={value.name}
          disabled={disabled}
          aria-invalid={Boolean(errors.name)}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
        {errors.name && <span className="field-error">{t(errors.name)}</span>}
      </label>
      <label>
        {t("email")}
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={value.email}
          disabled={disabled}
          aria-invalid={Boolean(errors.email)}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />
        {errors.email && <span className="field-error">{t(errors.email)}</span>}
      </label>
    </div>
  );
}
