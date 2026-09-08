export type Customer = { name: string; email: string };

export const EMPTY_CUSTOMER: Customer = { name: "", email: "" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCustomer(c: Customer): { name?: string; email?: string } {
  const errors: { name?: string; email?: string } = {};
  if (c.name.trim().length < 2) errors.name = "Enter your full name";
  if (!EMAIL.test(c.email.trim())) errors.email = "Enter a valid email address";
  return errors;
}

export function isCustomerValid(c: Customer): boolean {
  return Object.keys(validateCustomer(c)).length === 0;
}

export function normalizeCustomer(c: Customer): Customer {
  return { name: c.name.trim().replace(/\s+/g, " "), email: c.email.trim().toLowerCase() };
}
