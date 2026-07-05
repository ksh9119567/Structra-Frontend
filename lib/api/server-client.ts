// Server-side fetch helper for talking to the FastAPI backend from Route
// Handlers / Server Components. Not for use in the browser.
import { getApiBaseUrl } from "@/lib/auth/config";
import { ApiError, extractDetail } from "./errors";

type RequestOptions = {
  /** Bearer access token to attach to the request. */
  token?: string;
  /** JSON body. Mutually exclusive with `form`. */
  json?: unknown;
  /** application/x-www-form-urlencoded body (used by the backend's auth endpoints). */
  form?: Record<string, string>;
  /** Extra headers. */
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, json, form, headers = {}, signal } = options;
  const url = `${getApiBaseUrl()}${path}`;

  const finalHeaders: Record<string, string> = { ...headers };
  let body: BodyInit | undefined;

  if (form) {
    finalHeaders["Content-Type"] = "application/x-www-form-urlencoded";
    body = new URLSearchParams(form).toString();
  } else if (json !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  if (token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: finalHeaders,
      body,
      signal,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Unable to reach the Structra server. Please try again.",
      503,
      "network_error",
    );
  }

  const text = await response.text();
  const payload = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    throw new ApiError(
      extractDetail(payload, "Something went wrong. Please try again."),
      response.status,
    );
  }

  return payload as T;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const serverApi = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),
  post: <T>(path: string, options?: RequestOptions) =>
    request<T>("POST", path, options),
  put: <T>(path: string, options?: RequestOptions) =>
    request<T>("PUT", path, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};
