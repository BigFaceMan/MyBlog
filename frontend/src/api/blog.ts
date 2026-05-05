import { request } from "@/api/http";
import type { ArchiveYear, Article, ArticleSummary, PaginatedResult, SiteProfile, TaxonomyItem } from "@/types/blog";

export interface ArticleListParams {
  page?: number;
  pageSize?: number;
  category?: string;
  tag?: string;
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

export function getSiteProfile() {
  return request<SiteProfile>("/api/site/profile");
}

export function getArticles(params: ArticleListParams = {}) {
  return request<PaginatedResult<ArticleSummary>>(`/api/articles${toQuery(params)}`);
}

export function getArticle(slug: string) {
  return request<Article>(`/api/articles/${slug}`);
}

export function getCategories() {
  return request<TaxonomyItem[]>("/api/categories");
}

export function getCategoryArticles(slug: string, params: ArticleListParams = {}) {
  return request<PaginatedResult<ArticleSummary>>(`/api/categories/${slug}/articles${toQuery(params)}`);
}

export function getTags() {
  return request<TaxonomyItem[]>("/api/tags");
}

export function getTagArticles(slug: string, params: ArticleListParams = {}) {
  return request<PaginatedResult<ArticleSummary>>(`/api/tags/${slug}/articles${toQuery(params)}`);
}

export function getArchive() {
  return request<ArchiveYear[]>("/api/archive");
}

export function searchArticles(keyword: string, params: ArticleListParams = {}) {
  return request<PaginatedResult<ArticleSummary>>(`/api/search${toQuery({ q: keyword, ...params })}`);
}
