import type { ApiResponse } from "@/types/blog";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: init?.credentials ?? "include",
    headers
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.code !== 0) {
    throw new HttpError(payload.message || response.statusText, response.status);
  }

  return payload.data;
}
