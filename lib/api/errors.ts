/**
 * Normalized API error shape shared between the BFF route handlers and the
 * client. DRF surfaces errors in several formats:
 * - { "detail": "<message>" } for auth/permission errors
 * - { "field_name": ["error1", "error2"] } for validation errors
 * - { "non_field_errors": ["..."] } for form-level validation
 */
export type ApiErrorBody = {
  message: string;
  status: number;
  /** Optional machine-readable code for client-side branching. */
  code?: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }

  toBody(): ApiErrorBody {
    return { message: this.message, status: this.status, code: this.code };
  }
}

/**
 * Pull a human-readable message out of a DRF error payload.
 *
 * DRF error formats:
 * - { "detail": "No active account found with the given credentials" }
 * - { "email": ["user with this email already exists."] }
 * - { "non_field_errors": ["Unable to log in with provided credentials."] }
 * - { "password": ["This password is too short.", "This password is too common."] }
 * - ["Invalid or expired OTP"] — a bare array, DRF's shape when a plain
 *   `ValidationError("message")` is raised directly in view/service code
 *   rather than from a serializer's `validate()`.
 */
export function extractDetail(payload: unknown, fallback: string): string {
  if (!payload) return fallback;

  if (Array.isArray(payload)) {
    return payload.length > 0 && typeof payload[0] === "string" ? payload[0] : fallback;
  }

  if (typeof payload !== "object") return fallback;

  const obj = payload as Record<string, unknown>;

  // Standard DRF detail field
  if (typeof obj.detail === "string") return obj.detail;

  // non_field_errors array
  if (Array.isArray(obj.non_field_errors) && obj.non_field_errors.length > 0) {
    return String(obj.non_field_errors[0]);
  }

  // message field (custom from our backend)
  if (typeof obj.message === "string") return obj.message;

  // Field-level errors — pick the first one
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") {
      return `${key}: ${val[0]}`;
    }
  }

  return fallback;
}
