<template>
  <AdminLayout>
    <section class="editor-page">
      <header class="editor-header">
        <div>
          <p>后台</p>
          <h1>{{ isEdit ? "编辑文章" : "新建文章" }}</h1>
        </div>
        <div class="header-actions">
          <el-button @click="router.push('/admin')">返回列表</el-button>
          <el-button plain :loading="saving" @click="submit('draft')">保存草稿</el-button>
          <el-button type="primary" :loading="saving" @click="submit('published')">发布</el-button>
        </div>
      </header>

      <StateBlock v-if="loading" type="loading" title="正在加载编辑器" />
      <StateBlock v-else-if="error" type="error" title="加载失败" :description="error" action-text="重试" @action="loadEditor" />
      <section v-else class="editor-layout">
        <el-form class="editor-panel" :model="form" label-position="top">
          <el-form-item label="标题">
            <el-input v-model="form.title" maxlength="160" show-word-limit placeholder="文章标题" />
          </el-form-item>

          <el-form-item label="Slug">
            <el-input v-model="form.slug" maxlength="180" placeholder="my-first-post" @input="slugTouched = true" />
          </el-form-item>

          <el-form-item label="摘要">
            <el-input v-model="form.excerpt" type="textarea" :rows="3" maxlength="320" show-word-limit placeholder="一句话概括文章内容" />
          </el-form-item>

          <el-form-item label="标签">
            <div class="tag-field">
              <div class="field-title">标签</div>
              <div class="tag-box">
                <el-tag v-for="tag in selectedTagItems" :key="tag.value" closable @close="removeTag(tag.value)">
                  {{ tag.name }}
                </el-tag>
                <el-input v-model="tagInput" class="tag-input" placeholder="输入新标签后回车" @keydown.enter.prevent="addTagFromInput" />
                <el-button class="tag-add" plain @click="addTagFromInput">添加</el-button>
              </div>
              <div v-if="suggestedTags.length" class="tag-suggestions">
                <button v-for="tag in suggestedTags" :key="tag.id" type="button" @click="addExistingTag(tag.id)">
                  {{ tag.name }}
                </button>
              </div>
              <p class="field-help">可以直接输入新标签，保存文章时会自动创建。</p>
            </div>
          </el-form-item>

          <div class="form-grid">
            <el-form-item label="封面 URL">
              <el-input v-model="form.cover" placeholder="https://..." />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="form.categoryId" placeholder="选择分类">
                <el-option v-for="category in flatCategories" :key="category.id" :label="taxonomyOptionLabel(category)" :value="category.id" />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="正文 Markdown">
            <el-input v-model="form.content" type="textarea" :autosize="{ minRows: 20, maxRows: 36 }" placeholder="# 标题" />
          </el-form-item>
        </el-form>

        <aside class="editor-panel editor-panel--side">
          <section class="side-section">
            <h2>发布状态</h2>
            <el-radio-group v-model="form.status">
              <el-radio-button label="draft">草稿</el-radio-button>
              <el-radio-button label="published">已发布</el-radio-button>
            </el-radio-group>
          </section>

          <section class="side-section">
            <h2>封面</h2>
            <img v-if="form.cover" class="cover-preview" :src="form.cover" :alt="form.title || 'cover'" />
            <div v-else class="cover-empty">暂无封面</div>
          </section>

          <section class="side-section preview-section">
            <h2>Markdown 预览</h2>
            <MarkdownRenderer :content="form.content || ' '" />
          </section>
        </aside>
      </section>
    </section>
  </AdminLayout>
</template>

<script setup lang="ts">
import { createAdminArticle, createAdminTag, getAdminArticle, updateAdminArticle } from "@/api/admin";
import AdminLayout from "@/components/admin/AdminLayout.vue";
import { getCategories, getTags } from "@/api/blog";
import MarkdownRenderer from "@/components/blog/MarkdownRenderer.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import type { Article, ArticlePayload, ArticleStatus, TaxonomyItem } from "@/types/blog";
import { flattenTaxonomy, taxonomyOptionLabel } from "@/utils/taxonomy";
import { ElMessage } from "element-plus";
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const categories = ref<TaxonomyItem[]>([]);
const tags = ref<TaxonomyItem[]>([]);
const tagInput = ref("");
const slugTouched = ref(false);
const autoSlugSeed = ref(`post-${Date.now()}`);
const isEdit = computed(() => Boolean(route.params.id));
const articleId = computed(() => String(route.params.id ?? ""));
const flatCategories = computed(() => flattenTaxonomy(categories.value));

const createEmptyForm = (): ArticlePayload => ({
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
  categoryId: "",
  tagIds: [],
  status: "draft"
});

const form = reactive<ArticlePayload>(createEmptyForm());
const knownTagIds = computed(() => new Set(tags.value.map((tag) => tag.id)));
const selectedTagItems = computed(() =>
  form.tagIds.map((value) => {
    const tag = tags.value.find((item) => item.id === value);

    return {
      value,
      name: tag?.name ?? value
    };
  })
);
const suggestedTags = computed(() => tags.value.filter((tag) => !form.tagIds.includes(tag.id)).slice(0, 10));

const slugify = (value: string) => {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || autoSlugSeed.value;
};

const toPayload = (article: Article): ArticlePayload => ({
  title: article.title,
  slug: article.slug,
  excerpt: article.excerpt,
  content: article.content,
  cover: article.cover,
  categoryId: article.category.id,
  tagIds: article.tags.map((tag) => tag.id),
  status: article.status
});

const applyDefaultCategory = () => {
  if (!form.categoryId && flatCategories.value[0]) {
    form.categoryId = flatCategories.value[0].id;
  }
};

const loadEditor = async () => {
  loading.value = true;
  error.value = "";
  autoSlugSeed.value = `post-${Date.now()}`;
  slugTouched.value = isEdit.value;
  Object.assign(form, createEmptyForm());

  try {
    const [categoryResult, tagResult, articleResult] = await Promise.all([
      getCategories(),
      getTags(),
      isEdit.value ? getAdminArticle(articleId.value) : Promise.resolve(null)
    ]);

    categories.value = categoryResult;
    tags.value = tagResult;

    if (articleResult) {
      Object.assign(form, toPayload(articleResult));
    } else {
      applyDefaultCategory();
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
};

const normalizedPayload = (status: ArticleStatus): ArticlePayload => ({
  title: form.title.trim(),
  slug: slugify(form.slug),
  excerpt: form.excerpt.trim(),
  content: form.content.trim(),
  cover: form.cover.trim(),
  categoryId: form.categoryId,
  tagIds: [...form.tagIds],
  status
});

const validatePayload = (payload: ArticlePayload) => {
  if (!payload.title) {
    ElMessage.warning("请填写标题");
    return false;
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
    ElMessage.warning("Slug 只能包含小写字母、数字和连字符");
    return false;
  }

  if (!payload.excerpt) {
    ElMessage.warning("请填写摘要");
    return false;
  }

  if (!payload.cover) {
    ElMessage.warning("请填写封面 URL");
    return false;
  }

  if (!payload.categoryId) {
    ElMessage.warning("请选择分类");
    return false;
  }

  if (!payload.content) {
    ElMessage.warning("请填写正文");
    return false;
  }

  return true;
};

const addExistingTag = (tagId: string) => {
  if (!form.tagIds.includes(tagId)) {
    form.tagIds.push(tagId);
  }
};

const addTagFromInput = () => {
  const name = tagInput.value.trim();

  if (!name) {
    return;
  }

  const existingTag = tags.value.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
  const value = existingTag?.id ?? name;

  if (!form.tagIds.includes(value)) {
    form.tagIds.push(value);
  }

  tagInput.value = "";
};

const removeTag = (value: string) => {
  form.tagIds = form.tagIds.filter((tagId) => tagId !== value);
};

const resolveTagIds = async () => {
  const resolvedTagIds: string[] = [];

  for (const value of form.tagIds) {
    const tagValue = value.trim();

    if (!tagValue) {
      continue;
    }

    if (knownTagIds.value.has(tagValue)) {
      resolvedTagIds.push(tagValue);
      continue;
    }

    const existingTag = tags.value.find((tag) => tag.name.toLowerCase() === tagValue.toLowerCase());
    const tag = existingTag ?? (await createAdminTag(tagValue));

    if (!tags.value.some((item) => item.id === tag.id)) {
      tags.value.push(tag);
    }

    resolvedTagIds.push(tag.id);
  }

  form.tagIds = [...new Set(resolvedTagIds)];

  return form.tagIds;
};

const submit = async (status: ArticleStatus) => {
  const payload = normalizedPayload(status);

  if (!validatePayload(payload)) {
    return;
  }

  saving.value = true;

  try {
    const tagIds = await resolveTagIds();
    const payloadWithTags = {
      ...payload,
      tagIds
    };
    const savedArticle = isEdit.value ? await updateAdminArticle(articleId.value, payloadWithTags) : await createAdminArticle(payloadWithTags);
    Object.assign(form, toPayload(savedArticle));
    ElMessage.success(status === "published" ? "已发布" : "草稿已保存");

    if (!isEdit.value) {
      await router.replace(`/admin/articles/${savedArticle.id}/edit`);
    }
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "保存失败");
  } finally {
    saving.value = false;
  }
};

watch(
  () => route.fullPath,
  () => {
    void loadEditor();
  },
  {
    immediate: true
  }
);

watch(
  () => form.title,
  (title) => {
    if (!slugTouched.value) {
      form.slug = slugify(title);
    }
  }
);
</script>

<style scoped>
.editor-page {
  display: grid;
  gap: 18px;
}

.editor-header,
.editor-panel {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
}

.editor-header p {
  margin: 0 0 6px;
  color: var(--primary-color);
  font-weight: 800;
}

.editor-header h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 30px;
  line-height: 1.15;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

.header-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.editor-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
  align-items: start;
}

.editor-panel {
  min-width: 0;
  padding: 22px;
}

.editor-panel--side {
  position: sticky;
  top: calc(var(--header-height) + 24px);
  display: grid;
  gap: 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 14px;
}

.tag-field {
  width: 100%;
}

.field-title {
  margin-bottom: 8px;
  color: var(--text-primary);
  font-weight: 700;
}

.tag-box {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  min-height: 42px;
  padding: 8px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.tag-input {
  flex: 1 1 180px;
  min-width: 150px;
}

.tag-input :deep(.el-input__wrapper) {
  box-shadow: none;
}

.tag-add {
  flex: 0 0 auto;
}

.tag-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tag-suggestions button {
  min-height: 30px;
  padding: 0 10px;
  color: var(--text-regular);
  font-weight: 600;
  background: var(--surface-muted);
  border: 1px solid var(--border-color);
  border-radius: 999px;
  cursor: pointer;
  transition: var(--animation-fast);
}

.tag-suggestions button:hover {
  color: var(--primary-color);
  border-color: var(--primary-border);
}

.field-help {
  margin: 8px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.5;
}

.side-section {
  display: grid;
  gap: 10px;
}

.side-section h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
}

.cover-preview,
.cover-empty {
  width: 100%;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.cover-preview {
  object-fit: cover;
}

.cover-empty {
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  background: var(--surface-muted);
}

.preview-section {
  max-height: 520px;
  overflow: auto;
  padding-top: 2px;
}

.preview-section :deep(.markdown-body) {
  font-size: 15px;
}

@media (max-width: 980px) {
  .editor-layout {
    grid-template-columns: 1fr;
  }

  .editor-panel--side {
    position: static;
  }
}

@media (max-width: 700px) {
  .editor-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .header-actions {
    justify-content: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
