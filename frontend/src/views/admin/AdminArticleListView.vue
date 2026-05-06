<template>
  <AdminLayout>
    <section class="admin-page">
      <header class="admin-header">
        <div>
          <p>后台</p>
          <h1>文章管理</h1>
        </div>
        <div class="admin-header__actions">
          <el-button plain :icon="SwitchButton" @click="handleLogout">退出登录</el-button>
          <el-button type="primary" :icon="Plus" @click="router.push('/admin/articles/new')">新建文章</el-button>
        </div>
      </header>

      <section class="admin-filters">
        <el-input v-model="keywordInput" clearable placeholder="搜索标题、摘要、正文或标签" @keyup.enter="applySearch">
          <template #append>
            <el-button @click="applySearch">搜索</el-button>
          </template>
        </el-input>
        <el-select v-model="statusFilter" clearable placeholder="全部状态" @change="handleFilterChange">
          <el-option label="已发布" value="published" />
          <el-option label="草稿" value="draft" />
        </el-select>
      </section>

      <StateBlock v-if="loading" type="loading" title="正在加载文章" />
      <StateBlock v-else-if="error" type="error" title="加载失败" :description="error" action-text="重试" @action="loadArticles" />
      <section v-else class="admin-table">
        <el-table :data="pageData.items" row-key="id" empty-text="暂无文章">
          <el-table-column label="标题" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="article-title">
                <strong>{{ row.title }}</strong>
                <span>{{ row.slug }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="分类" width="120">
            <template #default="{ row }">{{ row.category.name }}</template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTagType(row.status)" effect="light">{{ statusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="140">
            <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
          </el-table-column>
          <el-table-column label="阅读" width="82">
            <template #default="{ row }">{{ row.readingMinutes }} 分钟</template>
          </el-table-column>
          <el-table-column label="操作" width="320" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button size="small" :icon="Edit" @click="router.push(`/admin/articles/${row.id}/edit`)">编辑</el-button>
                <el-button size="small" :icon="View" :disabled="row.status !== 'published'" @click="router.push(`/articles/${row.slug}`)">查看</el-button>
                <el-button size="small" plain :type="row.status === 'published' ? 'warning' : 'success'" @click="toggleStatus(row)">
                  {{ row.status === "published" ? "转草稿" : "发布" }}
                </el-button>
                <el-button size="small" plain type="danger" :icon="Delete" @click="removeArticle(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="pageData.totalPages > 1" class="pagination-row">
          <el-pagination v-model:current-page="currentPage" background layout="prev, pager, next" :page-size="pageData.pageSize" :total="pageData.total" />
        </div>
      </section>
    </section>
  </AdminLayout>
</template>

<script setup lang="ts">
import { deleteAdminArticle, getAdminArticles, updateAdminArticleStatus } from "@/api/admin";
import AdminLayout from "@/components/admin/AdminLayout.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import { useAuthStore } from "@/stores/auth";
import type { ArticleStatus, ArticleSummary, PaginatedResult } from "@/types/blog";
import { formatDate } from "@/utils/date";
import { Delete, Edit, Plus, SwitchButton, View } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();
const currentPage = ref(1);
const loading = ref(false);
const error = ref("");
const keywordInput = ref("");
const keyword = ref("");
const statusFilter = ref<ArticleStatus | "">("");
const pageData = reactive<PaginatedResult<ArticleSummary>>({
  items: [],
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1
});

const statusLabel = (status: ArticleStatus) => (status === "published" ? "已发布" : "草稿");
const statusTagType = (status: ArticleStatus) => (status === "published" ? "success" : "info");

const loadArticles = async () => {
  loading.value = true;
  error.value = "";

  try {
    const result = await getAdminArticles({
      page: currentPage.value,
      pageSize: pageData.pageSize,
      status: statusFilter.value,
      keyword: keyword.value
    });
    Object.assign(pageData, result);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
};

const applySearch = () => {
  currentPage.value = 1;
  keyword.value = keywordInput.value.trim();
};

const handleFilterChange = () => {
  currentPage.value = 1;
};

const handleLogout = async () => {
  await authStore.logout();
  ElMessage.success("已退出登录");
  await router.replace("/login");
};

const toggleStatus = async (article: ArticleSummary) => {
  const nextStatus: ArticleStatus = article.status === "published" ? "draft" : "published";

  try {
    await updateAdminArticleStatus(article.id, nextStatus);
    ElMessage.success(nextStatus === "published" ? "已发布" : "已转为草稿");
    await loadArticles();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "状态更新失败");
  }
};

const removeArticle = async (article: ArticleSummary) => {
  try {
    await ElMessageBox.confirm(`确认删除「${article.title}」？`, "删除文章", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
    await deleteAdminArticle(article.id);
    ElMessage.success("已删除");
    await loadArticles();
  } catch (err) {
    if (err !== "cancel" && err !== "close") {
      ElMessage.error(err instanceof Error ? err.message : "删除失败");
    }
  }
};

watch([currentPage, statusFilter, keyword], loadArticles, {
  immediate: true
});
</script>

<style scoped>
.admin-page {
  display: grid;
  gap: 18px;
}

.admin-header,
.admin-filters,
.admin-table {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.admin-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
}

.admin-header p {
  margin: 0 0 6px;
  color: var(--primary-color);
  font-weight: 800;
}

.admin-header h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 30px;
  line-height: 1.15;
}

.admin-header__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.admin-header__actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.admin-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 12px;
  padding: 16px;
}

.admin-table {
  overflow: hidden;
  padding: 12px;
}

.article-title {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.article-title strong,
.article-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-title span {
  color: var(--text-secondary);
  font-size: 13px;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.row-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.pagination-row {
  display: flex;
  justify-content: center;
  padding: 18px 0 8px;
}

@media (max-width: 760px) {
  .admin-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .admin-filters {
    grid-template-columns: 1fr;
  }
}
</style>
