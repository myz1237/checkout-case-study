"use client";

import { type Customer, validateCustomer } from "@/lib/customer";

type Props = {
  value: Customer;
  disabled: boolean;
  showErrors: boolean;
  onChange: (next: Customer) => void;
};

export default function CustomerForm({ value, disabled, showErrors, onChange }: Props) {
  const errors = showErrors ? validateCustomer(value) : {};
  return (
    <div className="customer">
      <label>
        Full name
        <input
          name="name"
          autoComplete="name"
          value={value.name}
          disabled={disabled}
          aria-invalid={Boolean(errors.name)}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </label>
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          value={value.email}
          disabled={disabled}
          aria-invalid={Boolean(errors.email)}
          onChange={(e) => onChange({ ...value, email: e.target.value })}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </label>
    </div>
  );
}
