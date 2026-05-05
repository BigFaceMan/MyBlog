<template>
  <PageShell>
    <section class="hero-panel">
      <p class="hero-panel__eyebrow">{{ t("page.homeTitle") }}</p>
      <h1>{{ siteStore.profile?.name ?? "SSP Blog" }}</h1>
      <p>{{ siteStore.profile?.subtitle ?? t("common.loading") }}</p>
    </section>

    <StateBlock v-if="loading" type="loading" :title="t('common.loading')" />
    <StateBlock v-else-if="error" type="error" :title="t('state.loadFailed')" :description="error" :action-text="t('common.retry')" @action="loadArticles" />
    <StateBlock v-else-if="!pageData.items.length" :title="t('state.articleEmpty')" />
    <template v-else>
      <ArticleList :articles="pageData.items" />
      <div v-if="pageData.totalPages > 1" class="pagination-row">
        <el-pagination v-model:current-page="currentPage" background layout="prev, pager, next" :page-size="pageData.pageSize" :total="pageData.total" />
      </div>
    </template>
  </PageShell>
</template>

<script setup lang="ts">
import { getArticles } from "@/api/blog";
import ArticleList from "@/components/blog/ArticleList.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import PageShell from "@/components/layout/PageShell.vue";
import { useSiteStore } from "@/stores/site";
import type { ArticleSummary, PaginatedResult } from "@/types/blog";
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const siteStore = useSiteStore();
const currentPage = ref(1);
const loading = ref(false);
const error = ref("");
const pageData = reactive<PaginatedResult<ArticleSummary>>({
  items: [],
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 1
});

const loadArticles = async () => {
  loading.value = true;
  error.value = "";

  try {
    const result = await getArticles({
      page: currentPage.value,
      pageSize: pageData.pageSize
    });
    Object.assign(pageData, result);
  } catch (err) {
    error.value = err instanceof Error ? err.message : t("state.loadFailed");
  } finally {
    loading.value = false;
  }
};

watch(currentPage, loadArticles, {
  immediate: true
});
</script>

<style scoped>
.hero-panel {
  position: relative;
  min-height: 184px;
  margin-bottom: 22px;
  padding: clamp(28px, 5vw, 48px);
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.hero-panel::before,
.hero-panel::after {
  position: absolute;
  width: 220px;
  height: 140px;
  content: "";
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  clip-path: polygon(0 22%, 74% 0, 100% 82%, 19% 100%);
}

.hero-panel::before {
  right: 6%;
  bottom: -54px;
}

.hero-panel::after {
  top: -66px;
  left: 10%;
  transform: rotate(18deg);
}

.hero-panel__eyebrow,
.hero-panel h1,
.hero-panel p {
  position: relative;
  z-index: 1;
}

.hero-panel__eyebrow {
  margin: 0 0 8px;
  color: var(--primary-color);
  font-weight: 800;
}

.hero-panel h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: clamp(34px, 5vw, 54px);
  line-height: 1.1;
}

.hero-panel p:last-child {
  max-width: 560px;
  margin: 14px 0 0;
  color: var(--text-regular);
  font-size: 17px;
  line-height: 1.8;
}

.pagination-row {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}
</style>
