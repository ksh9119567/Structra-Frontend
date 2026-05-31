/**
 * Lightweight, dependency-free validation for the auth forms. Mirrors the
 * backend's expectations (email + non-empty password). Shared by the client
 * form and the BFF route handler so both agree.
 */

export type LoginInput = {
  email: string;
  password: string;
  rememberMe?: boolean;
};

export type SignupInput = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type FieldErrors = Partial<
  Record<"email" | "password" | "username" | "confirmPassword", string>
>;

// Pragmatic email check — good enough for UX; the backend is the source of truth.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(input: {
  email?: unknown;
  password?: unknown;
}): { errors: FieldErrors; valid: boolean } {
  const errors: FieldErrors = {};

  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";

  if (!email) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}

export function validateSignup(input: {
  username?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
}): { errors: FieldErrors; valid: boolean } {
  const errors: FieldErrors = {};

  const username =
    typeof input.username === "string" ? input.username.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const confirmPassword =
    typeof input.confirmPassword === "string" ? input.confirmPassword : "";

  if (!username) {
    errors.username = "Username is required.";
  } else if (username.length < 3) {
    errors.username = "Username must be at least 3 characters.";
  } else if (username.length > 100) {
    errors.username = "Username must be 100 characters or fewer.";
  }

  if (!email) {
    errors.email = "Email address is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (password && confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return { errors, valid: Object.keys(errors).length === 0 };
}
