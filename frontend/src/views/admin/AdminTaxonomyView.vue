<template>
  <PageShell :with-sidebar="false">
    <section class="taxonomy-page">
      <header class="taxonomy-header">
        <div>
          <p>后台</p>
          <h1>{{ taxonomyConfig.title }}</h1>
          <AdminNav class="taxonomy-header__nav" />
        </div>
      </header>

      <form class="taxonomy-create" @submit.prevent="createItem">
        <el-input v-model="createForm.name" clearable :placeholder="`${taxonomyConfig.label}名称`" />
        <el-input v-model="createForm.slug" clearable placeholder="slug，可留空自动生成" />
        <el-input v-model="createForm.description" clearable placeholder="描述，可选" />
        <el-button type="primary" native-type="submit" :loading="saving">新增{{ taxonomyConfig.label }}</el-button>
      </form>

      <StateBlock v-if="loading" type="loading" :title="`正在加载${taxonomyConfig.label}`" />
      <StateBlock v-else-if="error" type="error" title="加载失败" :description="error" action-text="重试" @action="loadItems" />
      <section v-else class="taxonomy-table">
        <el-table :data="items" row-key="id" empty-text="暂无数据">
          <el-table-column label="名称" min-width="180">
            <template #default="{ row }">
              <el-input v-if="editingId === row.id" v-model="editForm.name" size="small" />
              <strong v-else>{{ row.name }}</strong>
            </template>
          </el-table-column>
          <el-table-column label="Slug" min-width="180">
            <template #default="{ row }">
              <el-input v-if="editingId === row.id" v-model="editForm.slug" size="small" />
              <span v-else class="muted">{{ row.slug }}</span>
            </template>
          </el-table-column>
          <el-table-column label="描述" min-width="260" show-overflow-tooltip>
            <template #default="{ row }">
              <el-input v-if="editingId === row.id" v-model="editForm.description" size="small" />
              <span v-else class="muted">{{ row.description || "无" }}</span>
            </template>
          </el-table-column>
          <el-table-column label="文章" width="90">
            <template #default="{ row }">{{ row.count ?? 0 }}</template>
          </el-table-column>
          <el-table-column label="操作" width="190" fixed="right">
            <template #default="{ row }">
              <div v-if="editingId === row.id" class="row-actions">
                <el-button size="small" type="primary" :loading="saving" @click="saveEdit(row)">保存</el-button>
                <el-button size="small" @click="cancelEdit">取消</el-button>
              </div>
              <div v-else class="row-actions">
                <el-button size="small" :icon="Edit" @click="startEdit(row)">编辑</el-button>
                <el-button size="small" plain type="danger" :icon="Delete" @click="removeItem(row)">删除</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </section>
    </section>
  </PageShell>
</template>

<script setup lang="ts">
import {
  createAdminCategory,
  createAdminTagItem,
  deleteAdminCategory,
  deleteAdminTag,
  getAdminCategories,
  getAdminTags,
  updateAdminCategory,
  updateAdminTag,
  type TaxonomyPayload
} from "@/api/admin";
import AdminNav from "@/components/admin/AdminNav.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import PageShell from "@/components/layout/PageShell.vue";
import type { TaxonomyItem } from "@/types/blog";
import { Delete, Edit } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";

type TaxonomyKind = "tags" | "categories";

interface TaxonomyConfig {
  kind: TaxonomyKind;
  label: string;
  title: string;
  list: () => Promise<TaxonomyItem[]>;
  create: (payload: TaxonomyPayload) => Promise<TaxonomyItem>;
  update: (id: string, payload: TaxonomyPayload) => Promise<TaxonomyItem>;
  remove: (id: string) => Promise<{ id: string }>;
}

const route = useRoute();
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const items = ref<TaxonomyItem[]>([]);
const editingId = ref("");
const createForm = reactive({
  name: "",
  slug: "",
  description: ""
});
const editForm = reactive({
  name: "",
  slug: "",
  description: ""
});

const taxonomyConfig = computed<TaxonomyConfig>(() => {
  if (route.path.includes("/admin/categories")) {
    return {
      kind: "categories",
      label: "类别",
      title: "类别管理",
      list: getAdminCategories,
      create: createAdminCategory,
      update: updateAdminCategory,
      remove: deleteAdminCategory
    };
  }

  return {
    kind: "tags",
    label: "标签",
    title: "标签管理",
    list: getAdminTags,
    create: createAdminTagItem,
    update: updateAdminTag,
    remove: deleteAdminTag
  };
});

const toPayload = (form: typeof createForm): TaxonomyPayload => {
  const payload: TaxonomyPayload = {
    name: form.name.trim()
  };
  const slug = form.slug.trim();
  const description = form.description.trim();

  if (slug) {
    payload.slug = slug;
  }

  if (description) {
    payload.description = description;
  }

  return payload;
};

const resetCreateForm = () => {
  createForm.name = "";
  createForm.slug = "";
  createForm.description = "";
};

const loadItems = async () => {
  loading.value = true;
  error.value = "";

  try {
    items.value = await taxonomyConfig.value.list();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
};

const createItem = async () => {
  const payload = toPayload(createForm);

  if (!payload.name) {
    ElMessage.warning(`请填写${taxonomyConfig.value.label}名称`);
    return;
  }

  saving.value = true;

  try {
    await taxonomyConfig.value.create(payload);
    ElMessage.success(`已新增${taxonomyConfig.value.label}`);
    resetCreateForm();
    await loadItems();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "新增失败");
  } finally {
    saving.value = false;
  }
};

const startEdit = (item: TaxonomyItem) => {
  editingId.value = item.id;
  editForm.name = item.name;
  editForm.slug = item.slug;
  editForm.description = item.description ?? "";
};

const cancelEdit = () => {
  editingId.value = "";
};

const saveEdit = async (item: TaxonomyItem) => {
  const payload = toPayload(editForm);

  if (!payload.name) {
    ElMessage.warning(`请填写${taxonomyConfig.value.label}名称`);
    return;
  }

  saving.value = true;

  try {
    await taxonomyConfig.value.update(item.id, payload);
    ElMessage.success("已保存");
    editingId.value = "";
    await loadItems();
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "保存失败");
  } finally {
    saving.value = false;
  }
};

const removeItem = async (item: TaxonomyItem) => {
  try {
    await ElMessageBox.confirm(`确认删除「${item.name}」？`, `删除${taxonomyConfig.value.label}`, {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消"
    });
    await taxonomyConfig.value.remove(item.id);
    ElMessage.success("已删除");
    await loadItems();
  } catch (err) {
    if (err !== "cancel" && err !== "close") {
      ElMessage.error(err instanceof Error ? err.message : "删除失败");
    }
  }
};

watch(
  () => taxonomyConfig.value.kind,
  () => {
    editingId.value = "";
    resetCreateForm();
    void loadItems();
  },
  {
    immediate: true
  }
);
</script>

<style scoped>
.taxonomy-page {
  display: grid;
  gap: 18px;
}

.taxonomy-header,
.taxonomy-create,
.taxonomy-table {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.taxonomy-header {
  padding: 24px 28px;
}

.taxonomy-header p {
  margin: 0 0 6px;
  color: var(--primary-color);
  font-weight: 800;
}

.taxonomy-header h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 30px;
  line-height: 1.15;
}

.taxonomy-header__nav {
  margin-top: 14px;
}

.taxonomy-create {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr) minmax(0, 1.3fr) auto;
  gap: 12px;
  padding: 16px;
}

.taxonomy-table {
  overflow: hidden;
  padding: 12px;
}

.muted {
  color: var(--text-secondary);
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.row-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

@media (max-width: 920px) {
  .taxonomy-create {
    grid-template-columns: 1fr;
  }
}
</style>
