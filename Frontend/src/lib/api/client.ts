export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

type JsonRecord = Record<string, unknown>;

export class ApiError extends Error {
  status: number;
  path: string;
  payload: unknown;

  constructor(message: string, options: {
    status: number;
    path: string;
    payload?: unknown;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.path = options.path;
    this.payload = options.payload ?? null;
  }
}

function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null;
}

function getErrorMessage(path: string, status: number, payload: unknown) {
  if (isJsonRecord(payload)) {
    const message = payload.message;
    const error = payload.error;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }

    if (typeof error === "string" && error.trim().length > 0) {
      return error;
    }
  }

  return `Request failed for ${path} with status ${status}`;
}

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    ...init,
  });

  const payload = await parseResponseBody(response);

  if (!response.ok) {
    throw new ApiError(getErrorMessage(path, response.status, payload), {
      status: response.status,
      path,
      payload,
    });
  }

  return payload as T;
}

export async function getJson<T>(path: string, init?: RequestInit): Promise<T> {
  return requestJson<T>(path, init);
}

export async function postJson<TResponse, TBody>(
  path: string,
  body: TBody,
  init?: RequestInit,
): Promise<TResponse> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return requestJson<TResponse>(path, {
    ...init,
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

export async function postFormData<TResponse>(
  path: string,
  body: FormData,
  init?: RequestInit,
): Promise<TResponse> {
  const headers = new Headers(init?.headers);
  headers.delete("Content-Type");

  return requestJson<TResponse>(path, {
    ...init,
    method: "POST",
    headers,
    body,
  });
}