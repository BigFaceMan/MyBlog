<template>
  <div class="article-list">
    <ArticleCard v-for="(article, index) in articles" :key="article.id" :article="article" :reversed="index % 2 === 1" />
  </div>
</template>

<script setup lang="ts">
import ArticleCard from "@/components/blog/ArticleCard.vue";
import type { ArticleSummary } from "@/types/blog";

defineProps<{
  articles: ArticleSummary[];
}>();
</script>

<style scoped>
.article-list {
  display: grid;
  gap: 22px;
}
</style>
