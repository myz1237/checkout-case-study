export type Customer = { name: string; email: string };

export const EMPTY_CUSTOMER: Customer = { name: "", email: "" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CustomerErrors = { name?: "error_name"; email?: "error_email" };

/** Returns message keys (see lib/i18n.ts) for each invalid field. */
export function validateCustomer(c: Customer): CustomerErrors {
  const errors: CustomerErrors = {};
  if (c.name.trim().length < 2) errors.name = "error_name";
  if (!EMAIL.test(c.email.trim())) errors.email = "error_email";
  return errors;
}

export function isCustomerValid(c: Customer): boolean {
  return Object.keys(validateCustomer(c)).length === 0;
}

export function normalizeCustomer(c: Customer): Customer {
  return { name: c.name.trim().replace(/\s+/g, " "), email: c.email.trim().toLowerCase() };
}
