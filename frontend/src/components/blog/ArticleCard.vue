<template>
  <article :class="['article-card', { 'article-card--reversed': reversed }]">
    <RouterLink class="article-card__cover-link" :to="`/articles/${article.slug}`" :aria-label="article.title">
      <img class="article-card__cover" :src="article.cover" :alt="article.title" loading="lazy" />
    </RouterLink>
    <div class="article-card__body">
      <RouterLink class="article-card__title" :to="`/articles/${article.slug}`">{{ article.title }}</RouterLink>
      <ArticleMeta :article="article" />
      <p class="article-card__excerpt">{{ article.excerpt }}</p>
      <div class="article-card__footer">
        <span class="article-card__read-time">{{ t("common.minRead", { count: article.readingMinutes }) }}</span>
        <RouterLink class="article-card__more" :to="`/articles/${article.slug}`">{{ t("common.readMore") }}</RouterLink>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import ArticleMeta from "@/components/blog/ArticleMeta.vue";
import type { ArticleSummary } from "@/types/blog";
import { useI18n } from "vue-i18n";

defineProps<{
  article: ArticleSummary;
  reversed?: boolean;
}>();

const { t } = useI18n();
</script>

<style scoped>
.article-card {
  display: grid;
  grid-template-columns: minmax(220px, 42%) minmax(0, 1fr);
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid transparent;
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
  transition: var(--animation-fast);
}

.article-card--reversed {
  grid-template-columns: minmax(0, 1fr) minmax(220px, 42%);
}

.article-card:hover {
  border-color: var(--primary-border);
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-2px);
}

.article-card__cover-link {
  display: block;
  min-height: 224px;
  background: var(--surface-muted);
}

.article-card--reversed .article-card__cover-link {
  order: 2;
}

.article-card--reversed .article-card__body {
  order: 1;
}

.article-card__cover {
  width: 100%;
  height: 100%;
  min-height: 224px;
  object-fit: cover;
  vertical-align: middle;
}

.article-card__body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: clamp(20px, 3vw, 32px);
}

.article-card__title {
  display: -webkit-box;
  margin-bottom: 14px;
  overflow: hidden;
  color: var(--text-primary);
  font-size: clamp(21px, 2.4vw, 28px);
  font-weight: 800;
  line-height: 1.35;
  text-decoration: none;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.article-card__title:hover {
  color: var(--primary-color);
}

.article-card__excerpt {
  display: -webkit-box;
  margin: 16px 0 22px;
  overflow: hidden;
  color: var(--text-regular);
  line-height: 1.8;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.article-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: auto;
  color: var(--text-secondary);
  font-size: 14px;
}

.article-card__more {
  flex: 0 0 auto;
  color: var(--primary-color);
  font-weight: 700;
  text-decoration: none;
}

@media (max-width: 700px) {
  .article-card {
    grid-template-columns: 1fr;
  }

  .article-card--reversed .article-card__cover-link,
  .article-card--reversed .article-card__body {
    order: initial;
  }

  .article-card__cover,
  .article-card__cover-link {
    min-height: 210px;
  }
}
</style>
