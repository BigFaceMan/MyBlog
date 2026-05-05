import { request } from "@/api/http";
import type { Article, ArticlePayload, ArticleStatus, ArticleSummary, PaginatedResult, TaxonomyItem } from "@/types/blog";

export interface AdminArticleListParams {
  page?: number;
  pageSize?: number;
  status?: ArticleStatus | "";
  keyword?: string;
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
