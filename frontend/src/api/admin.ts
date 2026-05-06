import { request } from "@/api/http";
import type { Article, ArticlePayload, ArticleStatus, ArticleSummary, PaginatedResult, SiteProfile, TaxonomyItem } from "@/types/blog";

export interface AdminArticleListParams {
  page?: number;
  pageSize?: number;
  status?: ArticleStatus | "";
  keyword?: string;
}

export interface TaxonomyPayload {
  name: string;
  slug?: string;
  description?: string;
  parentId?: string | null;
}

export interface SiteProfilePayload {
  name: string;
  subtitle: string;
  avatar: string;
  announcement: string;
  socials: SiteProfile["socials"];
}

export type AdminUserRole = "root" | "user";
export type AdminUserStatus = "active" | "disabled";

export interface AdminUser {
  id: string;
  username: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  createdAt: string;
  updatedAt: string;
  isRoot: boolean;
}

export interface AdminUserPayload {
  username: string;
  password: string;
  role: AdminUserRole;
  status: AdminUserStatus;
}

const toQuery = <T extends object>(params: T) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if ((typeof value === "string" || typeof value === "number") && value !== "") {
      query.set(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

const toJsonInit = (method: "POST" | "PUT" | "PATCH", payload: unknown): RequestInit => ({
  method,
  body: JSON.stringify(payload)
});

export function getAdminArticles(params: AdminArticleListParams = {}) {
  return request<PaginatedResult<ArticleSummary>>(`/api/admin/articles${toQuery(params)}`);
}

export function getAdminArticle(id: string) {
  return request<Article>(`/api/admin/articles/${id}`);
}

export function createAdminArticle(payload: ArticlePayload) {
  return request<Article>("/api/admin/articles", toJsonInit("POST", payload));
}

export function updateAdminArticle(id: string, payload: ArticlePayload) {
  return request<Article>(`/api/admin/articles/${id}`, toJsonInit("PUT", payload));
}

export function updateAdminArticleStatus(id: string, status: ArticleStatus) {
  return request<Article>(`/api/admin/articles/${id}/status`, toJsonInit("PATCH", { status }));
}

export function deleteAdminArticle(id: string) {
  return request<{ id: string }>(`/api/admin/articles/${id}`, {
    method: "DELETE"
  });
}

export function createAdminTag(name: string) {
  return request<TaxonomyItem>("/api/admin/tags", toJsonInit("POST", { name }));
}

export function getAdminTags() {
  return request<TaxonomyItem[]>("/api/admin/tags");
}

export function createAdminTagItem(payload: TaxonomyPayload) {
  return request<TaxonomyItem>("/api/admin/tags", toJsonInit("POST", payload));
}

export function updateAdminTag(id: string, payload: TaxonomyPayload) {
  return request<TaxonomyItem>(`/api/admin/tags/${id}`, toJsonInit("PUT", payload));
}

export function deleteAdminTag(id: string) {
  return request<{ id: string }>(`/api/admin/tags/${id}`, {
    method: "DELETE"
  });
}

export function getAdminCategories() {
  return request<TaxonomyItem[]>("/api/admin/categories");
}

export function createAdminCategory(payload: TaxonomyPayload) {
  return request<TaxonomyItem>("/api/admin/categories", toJsonInit("POST", payload));
}

export function updateAdminCategory(id: string, payload: TaxonomyPayload) {
  return request<TaxonomyItem>(`/api/admin/categories/${id}`, toJsonInit("PUT", payload));
}

export function deleteAdminCategory(id: string) {
  return request<{ id: string }>(`/api/admin/categories/${id}`, {
    method: "DELETE"
  });
}

export function getAdminSiteProfile() {
  return request<SiteProfile>("/api/admin/site/profile");
}

export function updateAdminSiteProfile(payload: SiteProfilePayload) {
  return request<SiteProfile>("/api/admin/site/profile", toJsonInit("PUT", payload));
}

export function getAdminUsers() {
  return request<AdminUser[]>("/api/admin/users");
}

export function createAdminUser(payload: AdminUserPayload) {
  return request<AdminUser>("/api/admin/users", toJsonInit("POST", payload));
}

export function updateAdminUser(id: string, payload: Partial<Pick<AdminUser, "role" | "status">>) {
  return request<AdminUser>(`/api/admin/users/${id}`, toJsonInit("PATCH", payload));
}

export function updateAdminUserPassword(id: string, password: string) {
  return request<AdminUser>(`/api/admin/users/${id}/password`, toJsonInit("PATCH", { password }));
}

export function deleteAdminUser(id: string) {
  return request<{ id: string }>(`/api/admin/users/${id}`, {
    method: "DELETE"
  });
}
