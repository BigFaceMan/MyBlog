import { request } from "@/api/http";

export type UserRole = "root" | "user";

export interface AuthUser {
  username: string;
  role: UserRole;
  isRoot: boolean;
}

export interface AuthStateResponse {
  authenticated: boolean;
  user: AuthUser | null;
}

export function loginUser(username: string, password: string) {
  return request<AuthUser>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      username,
      password
    })
  });
}

export function registerUser(username: string, password: string) {
  return request<AuthUser>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      password
    })
  });
}

export function logoutUser() {
  return request<{ success: boolean }>("/api/auth/logout", {
    method: "POST"
  });
}

export function getCurrentUser() {
  return request<AuthStateResponse>("/api/auth/me");
}
