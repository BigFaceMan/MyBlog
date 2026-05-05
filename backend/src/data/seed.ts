import type { Article, SiteProfile, TaxonomyItem } from "../types.js";

export const categories: TaxonomyItem[] = [
  {
    id: "cat-programming",
    name: "编程",
    slug: "programming",
    description: "工程实践、源码阅读与技术实验"
  },
  {
    id: "cat-infra",
    name: "Infra",
    slug: "infra",
    description: "服务端、部署、观测与稳定性"
  },
  {
    id: "cat-life",
    name: "生活",
    slug: "life",
    description: "日常记录、阅读和随笔"
  },
  {
    id: "cat-weekly",
    name: "周报",
    slug: "weekly",
    description: "阶段性复盘和链接收藏"
  }
];

export const tags: TaxonomyItem[] = [
  { id: "tag-vue", name: "Vue", slug: "vue" },
  { id: "tag-typescript", name: "TypeScript", slug: "typescript" },
  { id: "tag-fastify", name: "Fastify", slug: "fastify" },
  { id: "tag-nodejs", name: "Node.js", slug: "nodejs" },
  { id: "tag-markdown", name: "Markdown", slug: "markdown" },
  { id: "tag-observability", name: "Observability", slug: "observability" },
  { id: "tag-notes", name: "笔记", slug: "notes" },
  { id: "tag-weekly", name: "周报", slug: "weekly" }
];

export const articles: Article[] = [];

export const siteProfile: Omit<SiteProfile, "stats"> = {
  name: "SSP Blog",
  subtitle: "写代码，也记录代码之外的东西",
  avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=300&q=80",
  announcement: "This is my Blog. MVP 版本先支持阅读、检索和内容聚合。",
  socials: [
    {
      type: "github",
      label: "GitHub",
      url: "https://github.com/"
    },
    {
      type: "mail",
      label: "Email",
      url: "mailto:hello@example.com"
    },
    {
      type: "rss",
      label: "RSS",
      url: "/rss.xml"
    },
    {
      type: "twitter",
      label: "Twitter",
      url: "https://twitter.com/"
    }
  ]
};
