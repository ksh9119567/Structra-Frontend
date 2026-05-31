"use client";

import type { FieldErrors } from "./validation";

export type LoginResult =
  | { ok: true }
  | { ok: false; message: string; errors?: FieldErrors };

export type SignupResult =
  | { ok: true }
  | { ok: false; message: string; errors?: FieldErrors };

/**
 * Calls the same-origin BFF login endpoint. Tokens are set as httpOnly cookies
 * by the route handler, so there is nothing token-related to handle here.
 */
export async function loginRequest(input: {
  email: string;
  password: string;
  rememberMe: boolean;
}): Promise<LoginResult> {
  let response: Response;
  try {
    response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return {
      ok: false,
      message: "Network error. Check your connection and try again.",
    };
  }

  if (response.ok) {
    return { ok: true };
  }

  const data = (await response.json().catch(() => null)) as
    | { message?: string; errors?: FieldErrors }
    | null;

  return {
    ok: false,
    message: data?.message ?? "Unable to sign in. Please try again.",
    errors: data?.errors,
  };
}

/**
 * Calls the same-origin BFF signup endpoint. On success, the user is
 * automatically logged in (tokens set as httpOnly cookies).
 */
export async function signupRequest(input: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}): Promise<SignupResult> {
  let response: Response;
  try {
    response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return {
      ok: false,
      message: "Network error. Check your connection and try again.",
    };
  }

  if (response.ok) {
    return { ok: true };
  }

  const data = (await response.json().catch(() => null)) as
    | { message?: string; errors?: FieldErrors }
    | null;

  return {
    ok: false,
    message: data?.message ?? "Unable to create account. Please try again.",
    errors: data?.errors,
  };
}
