<template>
  <section class="sidebar-card">
    <h2 class="sidebar-card__title">
      <Clock :size="20" />
      {{ t("sidebar.recentPosts") }}
    </h2>

    <div v-if="loading" class="recent-list">
      <el-skeleton v-for="item in 4" :key="item" :rows="2" animated />
    </div>
    <StateBlock v-else-if="error" type="error" :title="t('state.loadFailed')" :description="error" />
    <div v-else class="recent-list">
      <RouterLink v-for="article in articles" :key="article.id" class="recent-item" :to="`/articles/${article.slug}`">
        <img class="recent-item__cover" :src="article.cover" :alt="article.title" loading="lazy" />
        <span class="recent-item__body">
          <span class="recent-item__title">{{ article.title }}</span>
          <span class="recent-item__date">{{ formatDate(article.createdAt) }}</span>
        </span>
      </RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getArticles } from "@/api/blog";
import StateBlock from "@/components/common/StateBlock.vue";
import type { ArticleSummary } from "@/types/blog";
import { formatDate } from "@/utils/date";
import { Clock } from "@element-plus/icons-vue";
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const articles = ref<ArticleSummary[]>([]);
const loading = ref(false);
const error = ref("");

const loadArticles = async () => {
  loading.value = true;
  error.value = "";

  try {
    const result = await getArticles({
      page: 1,
      pageSize: 5
    });
    articles.value = result.items;
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("state.loadFailed");
  } finally {
    loading.value = false;
  }
};

onMounted(loadArticles);
</script>

<style scoped>
.recent-list {
  display: grid;
  gap: 12px;
}

.recent-item {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 10px;
  color: var(--text-primary);
  text-decoration: none;
}

.recent-item__cover {
  width: 64px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}

.recent-item__body {
  min-width: 0;
}

.recent-item__title,
.recent-item__date {
  display: block;
}

.recent-item__title {
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-item__date {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 13px;
}
</style>
