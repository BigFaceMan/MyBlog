<template>
  <AdminLayout>
    <section class="profile-admin">
      <header class="profile-header">
        <div>
          <p>后台</p>
          <h1>个人简介管理</h1>
        </div>
        <el-button type="primary" :loading="saving" @click="saveProfile">保存修改</el-button>
      </header>

      <StateBlock v-if="loading" type="loading" title="正在加载个人简介" />
      <StateBlock v-else-if="error" type="error" title="加载失败" :description="error" action-text="重试" @action="loadProfile" />
      <section v-else class="profile-grid">
        <el-form class="profile-panel" label-position="top">
          <div class="form-grid">
            <el-form-item label="站点名称">
              <el-input v-model="form.name" maxlength="80" show-word-limit placeholder="SSP Blog" />
            </el-form-item>
            <el-form-item label="一句话介绍">
              <el-input v-model="form.subtitle" maxlength="160" show-word-limit placeholder="写代码，也记录代码之外的东西" />
            </el-form-item>
          </div>

          <el-form-item label="头像 URL">
            <el-input v-model="form.avatar" placeholder="https://..." />
          </el-form-item>

          <el-form-item label="公告 / 简介">
            <el-input v-model="form.announcement" type="textarea" :rows="4" maxlength="500" show-word-limit placeholder="展示在主页公告和关于页里的介绍" />
          </el-form-item>

          <section class="social-section">
            <div class="section-title">
              <h2>社交链接</h2>
              <p>主页按钮和 AuthorCard 下方图标会使用这些链接。</p>
            </div>
            <div class="social-list">
              <div v-for="social in form.socials" :key="social.type" class="social-row">
                <strong>{{ socialTypeLabel(social.type) }}</strong>
                <el-input v-model="social.label" placeholder="显示名称" />
                <el-input v-model="social.url" placeholder="链接地址" />
              </div>
            </div>
          </section>
        </el-form>

        <aside class="profile-panel profile-preview">
          <h2>主页预览</h2>
          <div class="author-preview">
            <img class="author-preview__avatar" :src="form.avatar" :alt="form.name" />
            <h3>{{ form.name || "SSP Blog" }}</h3>
            <p>{{ form.subtitle || "写代码，也记录代码之外的东西" }}</p>
            <a class="author-preview__follow" :href="firstSocialUrl" target="_blank" rel="noreferrer">Follow Me</a>
            <div class="author-preview__socials">
              <span v-for="social in visibleSocials" :key="social.type">{{ social.label }}</span>
            </div>
          </div>

          <div class="announcement-preview">
            <h3>Announcement</h3>
            <p>{{ form.announcement || "暂无公告" }}</p>
          </div>
        </aside>
      </section>
    </section>
  </AdminLayout>
</template>

<script setup lang="ts">
import { getAdminSiteProfile, updateAdminSiteProfile, type SiteProfilePayload } from "@/api/admin";
import AdminLayout from "@/components/admin/AdminLayout.vue";
import StateBlock from "@/components/common/StateBlock.vue";
import { useSiteStore } from "@/stores/site";
import type { SiteProfile } from "@/types/blog";
import { ElMessage } from "element-plus";
import { computed, reactive, ref } from "vue";

type SocialItem = SiteProfile["socials"][number];
type SocialType = SocialItem["type"];

const siteStore = useSiteStore();
const loading = ref(false);
const saving = ref(false);
const error = ref("");
const socialTypes: SocialType[] = ["github", "mail", "rss", "twitter"];
const socialLabels: Record<SocialType, string> = {
  github: "GitHub",
  mail: "邮箱",
  rss: "RSS",
  twitter: "Twitter"
};

const createEmptyForm = (): SiteProfilePayload => ({
  name: "",
  subtitle: "",
  avatar: "",
  announcement: "",
  socials: socialTypes.map((type) => ({
    type,
    label: socialLabels[type],
    url: ""
  }))
});

const form = reactive<SiteProfilePayload>(createEmptyForm());
const visibleSocials = computed(() => form.socials.filter((social) => social.label.trim() && social.url.trim()));
const firstSocialUrl = computed(() => visibleSocials.value[0]?.url ?? "#");

const socialTypeLabel = (type: SocialType) => socialLabels[type];

const applyProfileToForm = (profile: SiteProfile) => {
  form.name = profile.name;
  form.subtitle = profile.subtitle;
  form.avatar = profile.avatar;
  form.announcement = profile.announcement;
  form.socials = socialTypes.map((type) => {
    const current = profile.socials.find((social) => social.type === type);

    return {
      type,
      label: current?.label ?? socialLabels[type],
      url: current?.url ?? ""
    };
  });
};

const toPayload = (): SiteProfilePayload => ({
  name: form.name.trim(),
  subtitle: form.subtitle.trim(),
  avatar: form.avatar.trim(),
  announcement: form.announcement.trim(),
  socials: form.socials
    .map((social) => ({
      type: social.type,
      label: social.label.trim(),
      url: social.url.trim()
    }))
    .filter((social) => social.label && social.url)
});

const loadProfile = async () => {
  loading.value = true;
  error.value = "";

  try {
    const profile = await getAdminSiteProfile();
    applyProfileToForm(profile);
  } catch (err) {
    error.value = err instanceof Error ? err.message : "加载失败";
  } finally {
    loading.value = false;
  }
};

const validatePayload = (payload: SiteProfilePayload) => {
  if (!payload.name) {
    ElMessage.warning("请填写站点名称");
    return false;
  }

  if (!payload.avatar) {
    ElMessage.warning("请填写头像 URL");
    return false;
  }

  return true;
};

const saveProfile = async () => {
  const payload = toPayload();

  if (!validatePayload(payload)) {
    return;
  }

  saving.value = true;

  try {
    const profile = await updateAdminSiteProfile(payload);
    applyProfileToForm(profile);
    siteStore.setProfile(profile);
    ElMessage.success("个人简介已保存");
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : "保存失败");
  } finally {
    saving.value = false;
  }
};

void loadProfile();
</script>

<style scoped>
.profile-admin {
  display: grid;
  gap: 18px;
}

.profile-header,
.profile-panel {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);
}

.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 28px;
}

.profile-header p {
  margin: 0 0 6px;
  color: var(--primary-color);
  font-weight: 800;
}

.profile-header h1 {
  margin: 0;
  color: var(--text-primary);
  font-size: 30px;
  line-height: 1.15;
}

.profile-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  align-items: start;
}

.profile-panel {
  min-width: 0;
  padding: 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.social-section {
  display: grid;
  gap: 14px;
}

.section-title h2,
.section-title p,
.profile-preview h2,
.author-preview h3,
.author-preview p,
.announcement-preview h3,
.announcement-preview p {
  margin: 0;
}

.section-title h2,
.profile-preview h2 {
  color: var(--text-primary);
  font-size: 18px;
}

.section-title p {
  margin-top: 4px;
  color: var(--text-secondary);
  font-size: 13px;
}

.social-list {
  display: grid;
  gap: 10px;
}

.social-row {
  display: grid;
  grid-template-columns: 86px minmax(0, 160px) minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.social-row strong {
  color: var(--text-primary);
}

.profile-preview {
  position: sticky;
  top: calc(var(--header-height) + 24px);
  display: grid;
  gap: 18px;
}

.author-preview {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 16px;
  text-align: center;
  background: var(--surface-muted);
  border-radius: 8px;
}

.author-preview__avatar {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border: 4px solid var(--card-bg);
  border-radius: 999px;
  box-shadow: var(--shadow-avatar);
}

.author-preview h3 {
  color: var(--text-primary);
  font-size: 22px;
}

.author-preview p,
.announcement-preview p {
  color: var(--text-regular);
  line-height: 1.7;
}

.author-preview__follow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 38px;
  color: white;
  font-weight: 700;
  text-decoration: none;
  background: var(--primary-color);
  border-radius: 6px;
}

.author-preview__socials {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 12px;
}

.announcement-preview {
  display: grid;
  gap: 8px;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
}

.announcement-preview h3 {
  color: var(--text-primary);
  font-size: 16px;
}

@media (max-width: 1080px) {
  .profile-grid {
    grid-template-columns: 1fr;
  }

  .profile-preview {
    position: static;
  }
}

@media (max-width: 700px) {
  .profile-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .form-grid,
  .social-row {
    grid-template-columns: 1fr;
  }
}
</style>
