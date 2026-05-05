<template>
  <div class="article-meta">
    <span class="article-meta__item">
      <Calendar :size="15" />
      {{ t("common.created") }} {{ formatDate(article.createdAt) }}
    </span>
    <RouterLink class="article-meta__item article-meta__link" :to="`/categories/${article.category.slug}`">
      <Folder :size="15" />
      {{ article.category.name }}
    </RouterLink>
    <span class="article-meta__tags">
      <RouterLink v-for="tag in article.tags" :key="tag.id" class="article-meta__tag" :to="`/tags/${tag.slug}`">
        <PriceTag :size="14" />
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
  gap: 9px 12px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.4;
}

.article-meta__item,
.article-meta__tag,
.article-meta__tags {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
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
  gap: 8px;
}
</style>
