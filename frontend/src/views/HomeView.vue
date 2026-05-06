<template>
  <PageShell>
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
import type { ArticleSummary, PaginatedResult } from "@/types/blog";
import { reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
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
.pagination-row {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}
</style>
