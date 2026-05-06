<template>
  <div class="article-meta">
    <span class="article-meta__item">
      <Calendar :size="13" />
      {{ t("common.created") }} {{ formatDate(article.createdAt) }}
    </span>
    <RouterLink class="article-meta__item article-meta__link" :to="`/categories/${article.category.slug}`">
      <Folder :size="13" />
      {{ article.category.name }}
    </RouterLink>
    <span class="article-meta__tags">
      <RouterLink v-for="tag in article.tags" :key="tag.id" class="article-meta__tag" :to="`/tags/${tag.slug}`">
        <PriceTag :size="12" />
        {{ tag.name }}
      </RouterLink>
    </span>
  </div>
</template>

<script setup lang="ts">
import type { ArticleSummary } from "@/types/blog";
import { formatDate } from "@/utils/date";
import { Calendar, Folder, PriceTag } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";

defineProps<{
  article: ArticleSummary;
}>();

const { t } = useI18n();
</script>

<style scoped>
.article-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px 10px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.article-meta__item,
.article-meta__tag,
.article-meta__tags {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.article-meta :deep(svg) {
  display: block;
  flex: 0 0 13px;
  width: 13px;
  height: 13px;
}

.article-meta__tag :deep(svg) {
  flex-basis: 12px;
  width: 12px;
  height: 12px;
}

.article-meta__link,
.article-meta__tag {
  color: inherit;
  text-decoration: none;
  transition: var(--animation-fast);
}

.article-meta__link:hover,
.article-meta__tag:hover {
  color: var(--primary-color);
}

.article-meta__tags {
  flex-wrap: wrap;
  gap: 6px 8px;
}
</style>
