import { API_BASE_URL, ApiError, getJson } from "@/lib/api/client";

export type BackendRootResponse = {
  ok: boolean;
  message?: string;
};

export type BackendHealthResponse = {
  ok: boolean;
  status?: string;
  service?: string;
  timestamp?: string;
  checks?: {
    mongo?: string;
  };
};

function formatBackendError(error: unknown) {
  if (error instanceof ApiError) {
    return `HTTP ${error.status} en ${error.path}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible consultar el backend.";
}

export async function getBackendSnapshot() {
  try {
    const [rootData, healthData] = await Promise.all([
      getJson<BackendRootResponse>("/"),
      getJson<BackendHealthResponse>("/health"),
    ]);

    return {
      apiBaseUrl: API_BASE_URL,
      reachable: rootData.ok,
      rootData,
      healthData,
      error: null,
    };
  } catch (error) {
    return {
      apiBaseUrl: API_BASE_URL,
      reachable: false,
      rootData: null,
      healthData: null,
      error: formatBackendError(error),
    };
  }
}