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
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers
    },
    ...init
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || payload.code !== 0) {
    throw new HttpError(payload.message || response.statusText, response.status);
  }

  return payload.data;
}
